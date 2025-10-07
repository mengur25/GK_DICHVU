from sqlite3 import IntegrityError
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import hmac, hashlib, time, urllib.parse
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import setting, models
from ..utils import send_email
from datetime import date, datetime
from ..models import RoleEnum, InvoiceStatus, PaymentMethod
router = APIRouter(prefix="/vnpay", tags=["Payments"])

class VnPayCreateIn(BaseModel):
    invoice_id: int
    amount: int

@router.post("/create")
def create_vnpay_payment(data: VnPayCreateIn, db: Session = Depends(get_db)):
    TMN = setting.VNPAY_TMN_CODE
    SECRET = setting.VNPAY_HASH_SECRET
    VNPAY_URL = setting.VNPAY_URL
    RETURN_URL = setting.VNPAY_RETURN_URL

    if not TMN or not SECRET:
        raise HTTPException(status_code=500, detail="VNPAY not configured on server")

    amount_vnd = (int(data.amount) * 1000) * 100
    txn_ref = f"{data.invoice_id}-{int(time.time())}"

    vnp_params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": TMN,
        "vnp_Amount": str(amount_vnd),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": f"Payment for invoice {data.invoice_id}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": RETURN_URL,
        "vnp_IpAddr": "127.0.0.1", 
        "vnp_CreateDate": time.strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": time.strftime("%Y%m%d%H%M%S", time.localtime(time.time() + 15*60))
    }

    # Tạo chuỗi hash
    sorted_items = sorted(vnp_params.items())
    hash_data = "&".join(f"{k}={urllib.parse.quote_plus(v)}" for k, v in sorted_items)
    secure_hash = hmac.new(SECRET.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    vnp_params["vnp_SecureHash"] = secure_hash
    query = urllib.parse.urlencode(vnp_params)
    payment_url = f"{VNPAY_URL}?{query}"


    return {"paymentUrl": payment_url, "txnRef": txn_ref}


@router.get("/verify")
async def verify_vnpay_return(request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    params = dict(request.query_params)
    vnp_secure_hash = params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)

    SECRET = setting.VNPAY_HASH_SECRET
    if not vnp_secure_hash:
        raise HTTPException(status_code=400, detail="Missing secure hash")

    sorted_items = sorted(params.items())
    hash_data = "&".join(f"{k}={urllib.parse.quote_plus(v)}" for k, v in sorted_items)
    expected_hash = hmac.new(SECRET.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    if expected_hash != vnp_secure_hash:
        raise HTTPException(status_code=400, detail="Invalid signature")

    txn_ref = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    amount_str = params.get("vnp_Amount", "0")

    try:
        amount_vnd = int(amount_str) // 100
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount format")

    if not txn_ref:
        raise HTTPException(status_code=400, detail="Missing transaction reference")

    try:
        invoice_id = int(txn_ref.split("-")[0])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid transaction reference format")

    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    key = f"{invoice.student.user_id}:{invoice_id}"

    student = db.query(models.Student).filter(models.Student.id == invoice.student_id).first()
    payer_student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()


    if response_code == "00":
        existing_payment = db.query(models.Payment).filter(
            models.Payment.transaction_code == txn_ref
        ).first()
        if existing_payment:
            return {
                "success": True,
                "message": "Payment already processed",
                "invoice_id": existing_payment.invoice_id,
                "student_id": student.id,
                "student_code": student.student_code if student else "",
                "student_name": student.full_name if student else "",
                "amount": existing_payment.amount_paid,
                "paid_at": existing_payment.payment_date
            }

        total_paid = sum(p.amount_paid for p in invoice.payments)
        due = invoice.total_amount - total_paid
        pay_amount = min(amount_vnd, due)


        payment = models.Payment(
            invoice_id=invoice.id,
            payer_student_id=payer_student.id,
            amount_paid=pay_amount,
            method=PaymentMethod.bank_transfer,
            payment_date=date.today(),
            transaction_code=txn_ref,
        )
        db.add(payment)

        try:
            send_email(invoice.student.user.email, "Invoice Paid",
                       f"Your invoice has been paid via VNPay. Amount: {invoice.total_amount}")
        except:
            pass

        if pay_amount >= due:
            invoice.status = InvoiceStatus.paid
            invoice.paid_at = datetime.now()

        db.commit()

        # Trả về thông tin thanh toán mới, bao gồm student_code và student_name
        return {
            "success": True,
            "message": "Payment successful",
            "invoice_id": invoice.id,
            "student_id": student.id,
            "student_code": student.student_code if student else "",
            "student_name": student.full_name if student else "",
            "amount": pay_amount,
            "paid_at": payment.payment_date
        }

    else:
        # Log failed transaction without creating a Payment record
        transaction = models.Payment(
            invoice_id=invoice_id,
            amount=amount_vnd / 1000,
            txn_ref=txn_ref,
            payment_method=PaymentMethod.bank_transfer,
            status="failed",
            response_code=response_code,
            created_at=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(transaction)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Transaction failed")

        raise HTTPException(status_code=400, detail=f"Payment failed, code={response_code}")
