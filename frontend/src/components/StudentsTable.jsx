import React from "react";

export default function StudentsTable({ students = [] }) {
  return (
    <div className="clean-card p-6">
      <h3 className="text-lg font-semibold mb-4">Students</h3>
      {students.length === 0 ? (
        <p className="text-sm text-gray-500">No students found.</p>
      ) : (
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
            {students.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{s.id}</td>
                <td className="px-3 py-2">{s.student_code}</td>
                <td className="px-3 py-2">{s.full_name}</td>
                <td className="px-3 py-2">{s.department}</td>
                <td className="px-3 py-2">{s.phone}</td>
                <td className="px-3 py-2">{s.balance ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
