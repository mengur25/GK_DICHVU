import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

function PaymentReturn() {
  const location = useLocation();
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await axios.get(`/vnpay/verify${location.search}`);
        if (res.data.success) {
          setMessage("Thanh toán thành công!");
        } else {
          setMessage("Thanh toán thất bại: " + (res.data.message || ""));
        }
      } catch (err) {
        console.error("Verify error:", err);
        setMessage("Có lỗi khi xác minh thanh toán");
      }
    };
    verifyPayment();
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded shadow text-center">
        <h2 className="text-xl font-bold mb-4">{message}</h2>
        <a href="/dashboard" className="btn-primary">Về Dashboard</a>
      </div>
    </div>
  );
}

export default PaymentReturn;
