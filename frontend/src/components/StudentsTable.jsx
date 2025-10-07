import React, { useState } from "react";

export default function StudentsTable({ students = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const totalPages = Math.ceil(students.length / rowsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentStudents = students.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Students</h3>
      {students.length === 0 ? (
        <p className="text-sm text-gray-500">No students found.</p>
      ) : (
        <>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Student Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{s.id}</td>
                  <td className="px-3 py-2">{s.student_code}</td>
                  <td className="px-3 py-2">{s.full_name}</td>
                  <td className="px-3 py-2">{s.department}</td>
                  <td className="px-3 py-2">{s.phone}</td>
                  <td className="px-3 py-2">{s.service_account?.balance ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
