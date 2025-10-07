import React, { useState } from "react";

export default function CoursesTable({ courses = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
  
    const totalPages = Math.ceil(courses.length / rowsPerPage);
  
    const handlePrev = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };
  
    const handleNext = () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
  
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentCourses = courses.slice(startIndex, startIndex + rowsPerPage);
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Courses</h3>
      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">No courses found.</p>
      ) : (
        <>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Credits</th>
              <th className="px-3 py-2 text-left">Tuition/Credit</th>
            </tr>
          </thead>
          <tbody>
            {currentCourses.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{c.id}</td>
                <td className="px-3 py-2">{c.course_code}</td>
                <td className="px-3 py-2">{c.course_name}</td>
                <td className="px-3 py-2">{c.credits}</td>
                <td className="px-3 py-2">{c.tuition_fee_per_credit}</td>
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
