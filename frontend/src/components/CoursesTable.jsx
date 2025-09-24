import React from "react";

export default function CoursesTable({ courses = [] }) {
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Courses</h3>
      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">No courses found.</p>
      ) : (
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
            {courses.map((c) => (
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
      )}
    </div>
  );
}
