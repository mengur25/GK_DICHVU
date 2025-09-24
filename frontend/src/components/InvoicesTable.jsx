import React from "react";

export default function InvoicesTable({ invoices = [] }) {
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Invoices</h3>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices found.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Amount</th>
              <th className="px-3 py-2 text-left">Due Date</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{i.id}</td>
                <td className="px-3 py-2">{i.student_id}</td>
                <td className="px-3 py-2">{i.total_amount}</td>
                <td className="px-3 py-2">{i.due_date}</td>
                <td className="px-3 py-2">{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
