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
import CreateModal from '../components/CreateModal';

const studentFields = [
  { name: 'email', label: 'Email' },
  { name: 'password', label: 'Password' },
  { name: 'full_name', label: 'Full Name' },
  { name: 'student_code', label: 'Student Code' },
  { name: 'department', label: 'Department' },
  { name: 'phone', label: 'Phone' },
];

const courseFields = [
  { name: 'course_code', label: 'Course Code' },
  { name: 'course_name', label: 'Course Name' },
  { name: 'credits', label: 'Credits' },
  { name: 'tuition_fee_per_credit', label: 'Tuition Fee/Credit' },
];

const invoiceFields = [
  { name: 'student_id', label: 'Student ID' },
  { name: 'semester', label: 'Semester' },
  { name: 'year', label: 'Year' },
  { name: 'due_date', label: 'Due Date' },
];

const enrollmentFields = [
  { name: 'student_id', label: 'Student ID' },
  { name: 'courses', label: 'Courses (comma separated)' },
  { name: 'semester', label: 'Semester' },
  { name: 'year', label: 'Year' },
  { name: 'status', label: 'Status' },
];

function AdminDashboard() {
  const [openModal, setOpenModal] = useState(null);
  const openStudentModal = () => setOpenModal('student');
  const openCourseModal = () => setOpenModal('course');
  const openInvoiceModal = () => setOpenModal('invoice');
  const openEnrollmentModal = () => setOpenModal('enrollment');

  const closeModal = () => setOpenModal(null);


  const handleCreate = async (type, data) => {
    try {
      if (type === 'enrollment' && data.courses) {
        data.courses = data.courses.split(',').map(c => c.trim());
      }
      const res = await axios.post(`/${type}/`, data);
      console.log(`${type} created:`, res.data);
      // loadUserData() nếu muốn reload dữ liệu
    } catch (err) {
      console.error(`Create ${type} Error:`, err);
    }
  };

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
    try { logout(); } catch (_) { }
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
              onAddStudent={openStudentModal}
              onAddCourse={openCourseModal}
              onAddInvoice={openInvoiceModal}
              onAddEnrollment={openEnrollmentModal}
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
      {openModal === 'student' && (
        <CreateModal
          open={openModal === 'student'} // quan trọng: prop open
          title="Create Student"
          fields={studentFields}
          onClose={closeModal}
          onSubmit={(data) => handleCreate('students', data)}
        />

      )}

      {openModal === 'course' && (
        <CreateModal
          open={openModal === 'course'}
          title="Create Course"
          fields={courseFields}
          onClose={closeModal}
          onSubmit={(data) => handleCreate('courses', data)}
        />

      )}

      {openModal === 'invoice' && (
        <CreateModal
          open={openModal === 'invoice'}
          title="Create Invoice"
          fields={invoiceFields}
          onClose={closeModal}
          onSubmit={(data) => handleCreate('invoices', data)}
        />

      )}

      {openModal === 'enrollment' && (
        <CreateModal
          open={openModal === 'enrollment'}
          title="Create Enrollment"
          fields={enrollmentFields}
          onClose={closeModal}
          onSubmit={(data) => handleCreate('enrollments', data)}
        />

      )}

    </div>
  );
}

export default AdminDashboard;


