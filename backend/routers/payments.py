from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from .. import schemas, models
from ..deps import get_db, require_roles, get_current_user
from ..models import RoleEnum, InvoiceStatus, PaymentMethod
from ..utils import generate_otp, send_email
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import func, distinct

router = APIRouter(prefix="/payments", tags=["Payments"])

global_otp_store = {}  

@router.post("/request", response_model=dict)
def request_payment(
    payload: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.student:
        raise HTTPException(403, "Only students can pay")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")

    student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first()
    if student.student_code != payload.student_code or student.full_name != payload.student_name:
        raise HTTPException(400, "MSSV or student name does not match")

    if not payload.agree_terms:
        raise HTTPException(400, "Must agree to terms")

    total_paid = sum(p.amount_paid for p in invoice.payments)
    due = invoice.total_amount - total_paid
    if due <= 0:
        raise HTTPException(400, "Invoice is already fully paid")

    if payload.amount_paid <= 0:
        raise HTTPException(400, "Amount must be greater than 0")

    otp, expires_at = generate_otp()
    key = f"{current_user.id}:{payload.invoice_id}"
    global_otp_store[key] = {"otp": otp, "expires_at": expires_at, "resend_count": 0}

    send_email(current_user.email, "OTP for Payment", f"Your OTP: {otp} (expires in 2 minutes)")
    return {"detail": "OTP sent to email"}

@router.post("/resend", response_model=dict)
def resend_otp(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    key = f"{current_user.id}:{invoice_id}"
    otp_data = global_otp_store.get(key)
    if not otp_data:
        raise HTTPException(400, "No OTP request found for this invoice")

    if otp_data["resend_count"] >= 1:
        raise HTTPException(401, "Maximum resend attempts reached")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")

    otp, expires_at = generate_otp()
    otp_data["otp"] = otp
    otp_data["expires_at"] = expires_at
    otp_data["resend_count"] += 1
    global_otp_store[key] = otp_data

    send_email(current_user.email, "New OTP for Payment", f"Your new OTP: {otp} (expires in 2 minutes)")
    return {"detail": "New OTP sent to email"}

@router.post("/confirm", response_model=dict)
def confirm_payment(
    payload: schemas.PaymentCreate,
    otp: str = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    key = f"{current_user.id}:{payload.invoice_id}"
    otp_data = global_otp_store.get(key)
    if not otp_data:
        raise HTTPException(400, "No OTP request found for this invoice")
    if datetime.now(tz=timezone.utc) > otp_data["expires_at"]:
        raise HTTPException(400, "OTP has expired")
    if otp != otp_data["otp"]:
        raise HTTPException(400, "Invalid OTP")

    if payload.method not in (PaymentMethod.bank_transfer, PaymentMethod.service_account, PaymentMethod.credit_card):
        raise HTTPException(400, "Unsupported payment method")

    invoice = db.execute(
        select(models.Invoice).where(models.Invoice.id == payload.invoice_id).with_for_update()
    ).scalars().first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")

    student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first()
    if student.student_code != payload.student_code or student.full_name != payload.student_name:
        raise HTTPException(400, "MSSV or student name does not match")

    payer_student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not payer_student:
        raise HTTPException(400, "Student not found for current user")

    total_paid = sum(p.amount_paid for p in invoice.payments)
    due = invoice.total_amount - total_paid
    if due <= 0:
        raise HTTPException(400, "Invoice is already fully paid")

    requested_amount = payload.amount_paid
    if requested_amount <= 0:
        raise HTTPException(400, "Amount must be greater than 0")
    if requested_amount < due:
        raise HTTPException(400, "Amount must cover full invoice (no partial payments allowed)")

    pay_amount = due
    excess_amount = int(requested_amount - due) if requested_amount > due else 0

    # ======= Service Account =======
    if payload.method == PaymentMethod.service_account:
        if not payer_student.service_account:
            raise HTTPException(400, "No service account found for this student")

        available_balance = float(payer_student.service_account.balance or 0)
        requested = float(requested_amount)
        if requested > available_balance:
            raise HTTPException(400, "Insufficient balance in service account")

        payer_student.service_account.balance = available_balance - requested

    elif payload.method in (PaymentMethod.credit_card):
        if excess_amount > 0:
            if not payer_student.service_account:
                payer_student.service_account = models.ServiceAccount(balance=0)
                db.add(payer_student.service_account)
            payer_student.service_account.balance = (payer_student.service_account.balance or 0) + excess_amount

    payment = models.Payment(
        invoice_id=invoice.id,
        payer_student_id=payer_student.id,
        amount_paid=pay_amount,
        method=payload.method,
        payment_date=date.today(),
        transaction_code=str(uuid.uuid4()),
    )
    db.add(payment)

    if pay_amount >= due:
        invoice.status = InvoiceStatus.paid
        invoice.paid_at = datetime.now()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Transaction failed")

    # Gửi email (nếu muốn)
    try:
        send_email(current_user.email, "Payment Confirmation",
                   f"Payment successful for invoice {invoice.id}. Amount: {pay_amount}")
        send_email(student.user.email, "Invoice Paid",
                   f"Your invoice has been paid.")
    except Exception as e:
        print("Warning: failed to send email:", e)

    del global_otp_store[key]

    # Trả về response
    return {
        "success": True,
        "message": "Payment successful",
        "payment": {
            "id": payment.id,
            "invoice_id": payment.invoice_id,
            "payer_student_id": payment.payer_student_id,
            "amount_paid": payment.amount_paid,
            "method": payment.method,
            "payment_date": str(payment.payment_date),
            "transaction_code": payment.transaction_code,
        }
    }

@router.get("/", response_model=list[schemas.PaymentOut])
def list_payments(db: Session = Depends(get_db),
                  _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))):
    payments = db.query(models.Payment).all()
    results = []

    for p in payments:
        invoice = db.query(models.Invoice).filter(models.Invoice.id == p.invoice_id).first()
        student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first() if invoice else None

        results.append({
            "id": p.id,
            "invoice_id": p.invoice_id,
            "student_code": student.student_code if student else "",
            "student_name": student.full_name if student else "",
            "payment_date": p.payment_date,
            "amount_paid": p.amount_paid,
            "method": p.method,
            "transaction_code": p.transaction_code
        })
    return results


@router.get("/history/summary", response_model=schemas.PaymentHistorySummary)
def payment_history_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        student_id = current_user.student.id

        payments_q = db.query(models.Payment).filter(models.Payment.payer_student_id == student_id)

        total_paid_invoices = payments_q.with_entities(func.count(distinct(models.Payment.invoice_id))).scalar() or 0
        total_amount = payments_q.with_entities(func.coalesce(func.sum(models.Payment.amount_paid), 0)).scalar() or 0
        unique_payers = 1 if total_paid_invoices > 0 else 0

        recent_q = (
            payments_q
            .join(models.Invoice, models.Invoice.id == models.Payment.invoice_id)
            .join(models.Student, models.Student.id == models.Invoice.student_id)
            .with_entities(
                models.Payment.id.label("payment_id"),
                models.Payment.invoice_id,
                models.Payment.amount_paid.label("amount"),
                models.Payment.payment_date.label("paid_at"),
                models.Invoice.student_id,
                models.Student.student_code,
                models.Student.full_name.label("student_name")
            )
            .order_by(models.Payment.payment_date.desc())
            .limit(20)


        )
        for row in recent_q.all():
            print(row.payment_id, row.invoice_id, row.amount, row.paid_at)

        recent_items = [
            {
                "invoice_id": row.invoice_id,
                "student_id": row.student_id,
                "student_code": row.student_code,
                "student_name": row.student_name,
                "amount": int(row.amount or 0),
                "paid_at": row.paid_at,
            }
            for row in recent_q.all() 
        ]

        return {
            "total_paid_invoices": int(total_paid_invoices),
            "total_amount": int(total_amount),
            "unique_payers": int(unique_payers),
            "recent_payments": recent_items
        }

    except Exception as e:
        print("Error in /payments/history/summary:", e)
        raise HTTPException(status_code=500, detail=str(e))

