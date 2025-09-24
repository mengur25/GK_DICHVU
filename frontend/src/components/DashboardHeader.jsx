import { GraduationCap, LogOut } from "lucide-react";

export default function DashboardHeader({ onLogout }) {
  return (
    <header className="header-payment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-black rounded-lg flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tuition Payment System</h1>
              <p className="text-gray-600">Admin Dashboard</p>
            </div>
          </div>

          <button onClick={onLogout} className="btn-secondary flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
