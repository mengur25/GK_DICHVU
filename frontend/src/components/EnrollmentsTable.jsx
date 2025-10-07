import React, { useState } from "react";

export default function EnrollmentsTable({ enrollments = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;
  
    const totalPages = Math.ceil(enrollments.length / rowsPerPage);
  
    const handlePrev = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };
  
    const handleNext = () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
  
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentEnrollments = enrollments.slice(startIndex, startIndex + rowsPerPage);
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Enrollments</h3>
      {enrollments.length === 0 ? (
        <p className="text-sm text-gray-500">No enrollments found.</p>
      ) : (
        <>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">Semester</th>
              <th className="px-3 py-2 text-left">Year</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentEnrollments.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{e.id}</td>
                <td className="px-3 py-2">{e.student_id}</td>
                <td className="px-3 py-2">{e.course_id}</td>
                <td className="px-3 py-2">{e.semester}</td>
                <td className="px-3 py-2">{e.year}</td>
                <td className="px-3 py-2">{e.status}</td>
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
