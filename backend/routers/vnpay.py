from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import hmac, hashlib, time, urllib.parse
from sqlalchemy.orm import Session
from ..deps import get_db
from .. import setting, models

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
async def verify_vnpay_return(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)

    # Lấy secure hash và bỏ ra khỏi params
    vnp_secure_hash = params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)

    SECRET = setting.VNPAY_HASH_SECRET
    if not vnp_secure_hash:
        return {"success": False, "message": "Missing secure hash"}

    # Sắp xếp params và tạo chuỗi hash đúng cách
    sorted_items = sorted(params.items())
    hash_data = "&".join(f"{k}={urllib.parse.quote_plus(v)}" for k, v in sorted_items)
    expected_hash = hmac.new(SECRET.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    # Debug nếu cần
    print("Hash verify data:", hash_data)
    print("Expected hash:", expected_hash)
    print("Received hash:", vnp_secure_hash)

    # So sánh chữ ký
    if expected_hash != vnp_secure_hash:
        return {"success": False, "message": "Invalid signature"}

    # Lấy thông tin từ kết quả VNPay
    txn_ref = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    amount_str = params.get("vnp_Amount", "0")

    # Chuyển amount về VNĐ (chia cho 100)
    try:
        amount_vnd = int(amount_str) // 100
    except Exception:
        amount_vnd = 0

    # Tách invoice_id từ txn_ref
    invoice_id = None
    if txn_ref:
        try:
            invoice_id = int(txn_ref.split("-")[0])
        except Exception:
            invoice_id = None


        return {
            "success": True,
            "message": "Payment success",
            "invoice_id": invoice_id,
            "amount": amount_vnd
        }

    return {"success": False, "message": f"Payment failed, code={response_code}"}
