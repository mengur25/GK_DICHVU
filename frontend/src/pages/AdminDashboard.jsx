import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

import DashboardHeader from '../components/DashboardHeader';
import BackendTestingTools from '../components/BackendTestingTools';
import StudentsTable from '../components/StudentsTable';
import CoursesTable from '../components/CoursesTable';
import InvoicesTable from '../components/InvoicesTable';
import EnrollmentsTable from '../components/EnrollmentsTable';
import PaymentHistorySection from '../components/PaymentHistorySection';

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    students: [],
    courses: [],
    invoices: [],
    enrollments: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);

  useEffect(() => {
  const role = localStorage.getItem('role');
if (!role) {
  navigate('/login');
  return;
}
if (role !== 'admin') {
  navigate('/dashboard');
  return;
}


  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  loadUserData();
}, [navigate]);


  const loadUserData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes, invoicesRes, enrollmentsRes] = await Promise.all([
        axios.get('/students/').catch(() => ({ data: [] })),
        axios.get('/courses/').catch(() => ({ data: [] })),
        axios.get('/invoices/').catch(() => ({ data: [] })),
        axios.get('/enrollments/').catch(() => ({ data: [] }))
      ]);

      setUserData({
        students: studentsRes.data || [],
        courses: coursesRes.data || [],
        invoices: invoicesRes.data || [],
        enrollments: enrollmentsRes.data || []
      });
    } catch (err) {
      console.error('loadUserData', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try { logout(); } catch (_) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStartPayment = () => navigate('/payment');
  const testAddStudent = () => console.log("Test Add Student");
  const testAddCourse = () => console.log("Test Add Course");
  const testAddInvoice = () => console.log("Test Add Invoice");
  const testAddEnrollment = () => console.log("Test Add Enrollment");


  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Tuition Payment System"
        subtitle="Admin Dashboard"
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="clean-card p-6">
            <h3 className="text-lg font-semibold mb-4">Tuition Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Process tuition payments or open payment page for students.</p>
            <div className="flex gap-3">
              <button onClick={handleStartPayment} className="btn-primary">Start Payment Process</button>
            </div>
          </div>

          <div className="clean-card p-6">
            <BackendTestingTools
              onAddStudent={testAddStudent}
              onAddCourse={testAddCourse}
              onAddInvoice={testAddInvoice}
              onAddEnrollment={testAddEnrollment}
              onRefreshData={loadUserData}
              loading={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="clean-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userData.students.length}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="clean-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{userData.courses.length}</div>
            <div className="text-sm text-gray-600">Courses</div>
          </div>
          <div className="clean-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{userData.invoices.length}</div>
            <div className="text-sm text-gray-600">Invoices</div>
          </div>
          <div className="clean-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{userData.enrollments.length}</div>
            <div className="text-sm text-gray-600">Enrollments</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <StudentsTable students={userData.students} />
          </div>
          <div>
            <CoursesTable courses={userData.courses} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div><InvoicesTable invoices={userData.invoices} /></div>
          <div><EnrollmentsTable enrollments={userData.enrollments} /></div>
        </div>

        {currentUser?.role === 'student' && currentStudent && (
          <div className="mt-8">
            <PaymentHistorySection studentId={currentStudent.id} />
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
