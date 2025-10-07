import { Plus, BookOpen, FileText, User, Database, TestTube } from "lucide-react";

export default function BackendTestingTools({
  onAddStudent,
  onAddCourse,
  onAddInvoice,
  onAddEnrollment,
  onRefreshData,
  loading
}) {
  return (
    <div className="clean-card p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
        <TestTube className="h-5 w-5" />
        Backend Testing Tools
      </h3>
      <div className="space-y-4">
        <button
          onClick={onAddStudent}
          disabled={loading}
          className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />  Add Student
        </button>
        <button
          onClick={onAddCourse}
          disabled={loading}
          className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
        >
          <BookOpen className="h-5 w-5" />  Add Course
        </button>
        <button
          onClick={onAddInvoice}
          disabled={loading}
          className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
        >
          <FileText className="h-5 w-5" />  Add Invoice
        </button>
        <button
          onClick={onAddEnrollment}
          disabled={loading}
          className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
        >
          <User className="h-5 w-5" />  Add Enrollment
        </button>

      </div>
    </div>
  );
}
