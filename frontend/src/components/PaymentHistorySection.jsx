import React from "react";

export default function PaymentHistorySection({ history = {} }) {
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Payment History</h3>
      {history.recent_payments?.length > 0 ? (
        <ul className="space-y-2">
          {history.recent_payments.map((p) => (
            <li key={p.invoice_id} className="p-3 bg-white rounded-lg border flex justify-between">
              <div>
                <div className="text-sm font-semibold">Invoice #{p.invoice_id}</div>
                <div className="text-xs text-gray-500">{p.student_name ?? "—"} (ID: {p.student_id})</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{p.amount}</div>
                <div className="text-xs text-gray-500">{p.paid_at ?? ""}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No recent payments.</p>
      )}
    </div>
  );
}
