import React, { useState } from "react";

export default function InvoicesTable({ invoices = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;
  
    const totalPages = Math.ceil(invoices.length / rowsPerPage);
  
    const handlePrev = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };
  
    const handleNext = () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
  
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentInvoices = invoices.slice(startIndex, startIndex + rowsPerPage);
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Invoices</h3>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices found.</p>
      ) : (
        <>
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
            {currentInvoices.map((i) => (
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
        <div className="flex justify-end items-center gap-2 mt-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="btn-secondary py-1 px-3 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="btn-secondary py-1 px-3 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
