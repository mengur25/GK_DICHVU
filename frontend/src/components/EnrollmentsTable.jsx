import React from "react";

export default function EnrollmentsTable({ enrollments = [] }) {
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Enrollments</h3>
      {enrollments.length === 0 ? (
        <p className="text-sm text-gray-500">No enrollments found.</p>
      ) : (
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
            {enrollments.map((e) => (
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
      )}
    </div>
  );
}
