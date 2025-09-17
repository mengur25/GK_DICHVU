from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import schemas
import models
from deps import get_db, require_roles, get_current_user
from models import RoleEnum, InvoiceStatus, PaymentMethod
from utils import generate_otp, send_email
import uuid
from datetime import date, datetime, timezone

router = APIRouter(prefix="/payments", tags=["Payments"])

global_otp_store = {}  

@router.post("/request", response_model=dict)
def request_payment(
    payload: schemas.PaymentCreate,  
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Any authenticated user (admin or student) can initiate payment
    
    invoice = db.query(models.Invoice).filter(models.Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Validate by student_code only (flexible payer)
    student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first()
    if student.student_code != payload.student_code:
        raise HTTPException(400, "Student code does not match the invoice")
    
    if payload.method == PaymentMethod.credit_card and not payload.card_number:
        raise HTTPException(400, "Card number required for credit card payment")
    if not payload.agree_terms:
        raise HTTPException(400, "Must agree to terms")
    
    if invoice.status == "paid":
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    # Enforce full amount
    due = invoice.total_amount - sum(p.amount_paid for p in invoice.payments)
    if payload.amount_paid < due:
        raise HTTPException(400, "Must pay the full invoice amount")
    
    # Check payer's balance before sending OTP
    payer_student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if payload.method == PaymentMethod.bank_transfer:
        if not payer_student or not payer_student.service_account:
            raise HTTPException(400, "Payer does not have a service account for bank transfer")
        if payer_student.service_account.balance < due:
            raise HTTPException(400, f"Insufficient balance. Available: {payer_student.service_account.balance}, Required: {due}")
    
    otp, expires_at = generate_otp()
    key = f"{current_user.id}:{payload.invoice_id}"
    global_otp_store[key] = {"otp": otp, "expires_at": expires_at, "resend_count": 0}  # Khởi tạo resend_count
    
    
    send_email("nguyentansangxd@gmail.com", "OTP for Payment", f"Your OTP: {otp} (expires in 2 minutes)")
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
        raise HTTPException(400, "Maximum resend attempts reached")
    
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    otp, expires_at = generate_otp()
    otp_data["otp"] = otp
    otp_data["expires_at"] = expires_at
    otp_data["resend_count"] += 1
    global_otp_store[key] = otp_data
    
    
    send_email("nguyentansangxd@gmail.com", "New OTP for Payment", f"Your new OTP: {otp} (expires in 2 minutes)")
    return {"detail": "New OTP sent to email"}

@router.post("/confirm", response_model=schemas.PaymentOut)
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
    
    invoice = db.execute(select(models.Invoice).where(models.Invoice.id == payload.invoice_id).with_for_update()).scalars().first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    # Validate by student_code only
    student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first()
    if student.student_code != payload.student_code:
        raise HTTPException(400, "Student code does not match the invoice")
    
    due = invoice.total_amount - sum(p.amount_paid for p in invoice.payments)
    # Enforce full payment only
    if payload.amount_paid < due:
        raise HTTPException(400, "Must pay the full invoice amount")
    pay_amount = due
    remaining_amount = 0
    
    # Check payer's balance again before confirming payment
    payer_student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if payload.method == PaymentMethod.bank_transfer:
        if not payer_student or not payer_student.service_account:
            raise HTTPException(400, "Payer does not have a service account for bank transfer")
        if payer_student.service_account.balance < pay_amount:
            raise HTTPException(400, f"Insufficient balance. Available: {payer_student.service_account.balance}, Required: {pay_amount}")
    
    payment = models.Payment(
        invoice_id=invoice.id,
        amount_paid=pay_amount,
        method=payload.method,
        payment_date=date.today(),
        transaction_code=str(uuid.uuid4()),
        card_number=payload.card_number if payload.method == PaymentMethod.credit_card else None
    )
    db.add(payment)
    
    if pay_amount >= due:
        invoice.status = InvoiceStatus.paid
    
    # Deduct from payer service account (mandatory for bank transfer)
    if payload.method == PaymentMethod.bank_transfer:
        payer_student.service_account.balance -= pay_amount
    
    # No surplus handling since only full payment is accepted now
    
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Transaction failed")
    
    send_email("nguyentansangxd@gmail.com", "Payment Confirmation", f"Payment successful for invoice {invoice.id}. Amount: {pay_amount}")
    send_email(student.user.email, "Invoice Paid", f"Your invoice {invoice.id} has been paid.")
    
    del global_otp_store[key]  

    
    return payment

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

@router.get("/by-student/{student_id}", response_model=list[schemas.PaymentOut])
def payments_by_student(student_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    # Student chỉ có thể xem lịch sử của chính mình
    if current_user.role == RoleEnum.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(403, "Access denied - You can only view your own payment history")
    
    # Lấy tất cả payments của student thông qua invoices
    payments = db.query(models.Payment).join(models.Invoice).filter(
        models.Invoice.student_id == student_id
    ).order_by(models.Payment.payment_date.desc()).all()
    
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
