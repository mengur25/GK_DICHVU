import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PaymentHistory from './PaymentHistory';
import AddCourseModal from './AddCourseModal';
import AddBalanceModal from './AddBalanceModal';
import { 
  GraduationCap, 
  CreditCard, 
  LogOut, 
  User, 
  BookOpen, 
  FileText,
  Plus,
  Database,
  TestTube,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Settings,
  EyeOff,
  Receipt
} from 'lucide-react';

function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userData, setUserData] = useState({
    students: [],
    courses: [],
    invoices: [],
    enrollments: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadCurrentUserInfo();
  }, []);

  const loadUserData = async () => {
    try {
      const [studentsRes, coursesRes, invoicesRes, enrollmentsRes] = await Promise.all([
        axios.get('/students/'),
        axios.get('/courses/'),
        axios.get('/invoices/'),
        axios.get('/enrollments/')
      ]);

      setUserData({
        students: studentsRes.data || [],
        courses: coursesRes.data || [],
        invoices: invoicesRes.data || [],
        enrollments: enrollmentsRes.data || []
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCurrentUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);

      // If user is student, load student profile
      if (response.data.role === 'student') {
        try {
          const studentRes = await axios.get('/students/profile');
          setCurrentStudent(studentRes.data);
        } catch (studentErr) {
          console.log('Could not load student profile:', studentErr);
        }
      }
    } catch (error) {
      console.error('Error loading current user info:', error);
    }
  };

  const toggleStudentDetails = (studentId) => {
    setShowStudentDetails(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTuitionPayment = () => {
    navigate('/payment');
  };

  // Test functions for backend
  const testAddStudent = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const studentData = {
        email: `student${Date.now()}@test.com`,
        password: "test123456",
        full_name: `Sinh viên Test ${new Date().toLocaleTimeString()}`,
        student_code: `SV${Date.now()}`,
        department: "Computer Science",
        phone: `0123${Date.now().toString().slice(-6)}`
      };

      const response = await axios.post('/students/', studentData);
      setMessage({ 
        type: 'success', 
        text: `Đã tạo sinh viên: ${response.data.full_name} (${response.data.student_code})` 
      });
      // Reload data after successful creation
      loadUserData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Lỗi tạo sinh viên: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const testAddCourse = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const courseData = {
        course_code: `CS${Date.now()}`,
        course_name: `Khóa học Test ${new Date().toLocaleTimeString()}`,
        credits: 3,
        tuition_fee_per_credit: 500000
      };

      const response = await axios.post('/courses/', courseData);
      setMessage({ 
        type: 'success', 
        text: `Đã tạo khóa học: ${response.data.course_name} (${response.data.course_code})` 
      });
      // Reload data after successful creation
      loadUserData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Lỗi tạo khóa học: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const testAddInvoice = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const invoiceData = {
        student_id: 1, // Assuming student with ID 1 exists
        semester: "Fall",
        due_date: "2024-12-31",
        year: 2024,
        status: "unpaid"
      };

      const response = await axios.post('/invoices/', invoiceData);
      setMessage({ 
        type: 'success', 
        text: `Đã tạo hóa đơn cho sinh viên ID ${response.data.student_id} - ${response.data.semester} ${response.data.year}` 
      });
      // Reload data after successful creation
      loadUserData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Lỗi tạo hóa đơn: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const testAddEnrollment = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const enrollmentData = {
        student_id: 1, // Assuming student with ID 1 exists
        courses: ["CS001"],  // courses should be list of strings (course codes)
        semester: "Fall",
        year: 2024,
        status: "registered"
      };

      const response = await axios.post('/enrollments/', enrollmentData);
      // Response is a list, get the first enrollment
      if (Array.isArray(response.data) && response.data.length > 0) {
        const enrollment = response.data[0];
        setMessage({ 
          type: 'success', 
          text: `Đã tạo đăng ký khóa học cho sinh viên ID ${enrollment.student_id}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Response không hợp lệ từ enrollment API' 
        });
      }
      // Reload data after successful creation
      loadUserData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Lỗi tạo đăng ký: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetAllData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await loadUserData();
      setMessage({ 
        type: 'success', 
        text: `Dữ liệu đã được cập nhật: ${userData.students.length} sinh viên, ${userData.courses.length} khóa học, ${userData.invoices.length} hóa đơn, ${userData.enrollments.length} đăng ký` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Lỗi lấy dữ liệu: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-payment">
        <div className="container-payment">
          {/* Main Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Tuition Payment Card */}
            <div className="clean-card p-8 hover:clean-card-hover">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-black rounded-full flex items-center justify-center mb-6">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Tuition Payment
                </h3>
                <p className="text-gray-600 mb-6">
                  Process tuition payments for students with secure OTP verification
                </p>
                <button
                  onClick={handleTuitionPayment}
                  className="btn-primary w-full"
                >
                  Start Payment Process
                </button>
              </div>
            </div>

            {/* Backend Testing Card */}
            <div className="clean-card p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                <TestTube className="h-5 w-5" />
                Backend Testing Tools
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={testAddStudent}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                  Test Add Student
                </button>
                <button 
                  onClick={testAddCourse}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
                >
                  <BookOpen className="h-5 w-5" />
                  Test Add Course
                </button>
                <button 
                  onClick={testAddInvoice}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
                >
                  <FileText className="h-5 w-5" />
                  Test Add Invoice
                </button>
                <button 
                  onClick={testAddEnrollment}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
                >
                  <User className="h-5 w-5" />
                  Test Add Enrollment
                </button>
                <button 
                  onClick={testGetAllData}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center gap-3 py-3 disabled:opacity-50"
                >
                  <Database className="h-5 w-5" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-8 p-6 rounded-lg border ${
              message.type === 'success' 
                ? 'status-success' 
                : message.type === 'error' 
                ? 'status-error' 
                : 'status-info'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {message.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {message.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  {message.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                  <span className="font-medium">{message.text}</span>
                </div>
                <button
                  onClick={clearMessage}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Data Overview */}
          <div className={`grid grid-cols-1 gap-6 mb-8 ${currentUser && currentUser.role === 'student' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            <div className="clean-card p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{userData.students.length}</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="clean-card p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">{userData.courses.length}</div>
              <div className="text-sm text-gray-600">Courses</div>
            </div>
            <div className="clean-card p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">{userData.invoices.length}</div>
              <div className="text-sm text-gray-600">Invoices</div>
            </div>
            <div className="clean-card p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">{userData.enrollments.length}</div>
              <div className="text-sm text-gray-600">Enrollments</div>
            </div>
            {currentUser && currentUser.role === 'student' && (
              <div className="clean-card p-6 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2 flex items-center justify-center gap-2">
                  <Receipt className="h-6 w-6" />
                  {currentStudent ? 'My Payments' : '0'}
                </div>
                <div className="text-sm text-gray-600">Payment History</div>
              </div>
            )}
          </div>

          {/* Student Test Buttons */}
          {currentUser && currentUser.role === 'student' && (
            <div className="clean-card p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Test Functions
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Course
                </button>
                <button
                  onClick={() => setShowAddBalanceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Balance
                </button>
              </div>
            </div>
          )}

          {/* Detailed Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students Table */}
            <div className="clean-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Students
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.students.map((student) => (
                      <React.Fragment key={student.id}>
                        <tr>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_code}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{student.department || 'N/A'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => toggleStudentDetails(student.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              {showStudentDetails[student.id] ? 'Hide Details' : 'Show Details'}
                            </button>
                          </td>
                        </tr>
                        {showStudentDetails[student.id] && (
                          <tr>
                            <td colSpan="4" className="px-3 py-2 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                                  <div className="space-y-1">
                                    <div><span className="font-medium">Student ID:</span> {student.id}</div>
                                    <div><span className="font-medium">User ID:</span> {student.user_id}</div>
                                    <div><span className="font-medium">Phone:</span> {student.phone || 'N/A'}</div>
                                    <div><span className="font-medium">Balance:</span> {formatCurrency(student.balance || 0)}</div>
                                    <div><span className="font-medium">Status:</span> 
                                      <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                                        student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {student.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Login Credentials</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="font-medium">Email:</span>
                                      <div className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded mt-1">
                                        {`student${student.id}@test.com`}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="font-medium">Password:</span>
                                      <div className="flex items-center mt-1">
                                        <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                          {showPassword ? 'test123456' : '••••••••'}
                                        </span>
                                        <button
                                          onClick={togglePasswordVisibility}
                                          className="ml-2 text-gray-500 hover:text-gray-700"
                                        >
                                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                      💡 Email được tạo theo format: student{student.id}@test.com
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {userData.students.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">No students found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Courses Table */}
            <div className="clean-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee/Credit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.courses.map((course) => (
                      <tr key={course.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{course.course_code}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{course.course_name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(course.tuition_fee_per_credit)}</td>
                      </tr>
                    ))}
                    {userData.courses.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">No courses found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invoices and Enrollments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Invoices Table */}
            <div className="clean-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.student_id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {userData.invoices.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">No invoices found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enrollments Table */}
            <div className="clean-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Enrollments
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{enrollment.student_id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{enrollment.course_code}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{enrollment.semester} {enrollment.year}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            enrollment.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                            enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {enrollment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {userData.enrollments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">No enrollments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment History Section - Only show for students */}
          {currentUser && currentUser.role === 'student' && currentStudent && (
            <div className="mt-8">
              <PaymentHistory studentId={currentStudent.id} />
            </div>
          )}
        </div>
      </main>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <AddCourseModal 
          onClose={() => setShowAddCourseModal(false)}
          onSuccess={() => {
            setShowAddCourseModal(false);
            loadUserData();
            loadCurrentUserInfo();
          }}
          currentStudent={currentStudent}
        />
      )}

      {/* Add Balance Modal */}
      {showAddBalanceModal && (
        <AddBalanceModal 
          onClose={() => setShowAddBalanceModal(false)}
          onSuccess={() => {
            setShowAddBalanceModal(false);
            loadCurrentUserInfo();
          }}
          currentStudent={currentStudent}
        />
      )}
    </div>
  );
}

export default Dashboard;
