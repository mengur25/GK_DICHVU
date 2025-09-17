import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ArrowLeft,
  User,
  GraduationCap,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react';

function TuitionPayment() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Form states
  const [payerInfo, setPayerInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    balance: 0
  });
  
  const [tuitionInfo, setTuitionInfo] = useState({
    studentCode: '',
    studentName: '',
    amount: 0
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    availableBalance: 0,
    tuitionAmount: 0,
    agreeTerms: false
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // UI states
  const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);

  // Load payer information on component mount
  useEffect(() => {
    loadPayerInfo();
  }, []);

  const loadPayerInfo = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user info (works for both admin and student)
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập lại');
        return;
      }

      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUser = response.data;

      // Set payer info from current user
      setPayerInfo({
        fullName: currentUser.full_name,
        phone: currentUser.phone || 'N/A',
        email: currentUser.email,
        balance: 0 // Will be updated from service account
      });

      setPaymentInfo({
        availableBalance: 0,
        tuitionAmount: 0,
        agreeTerms: false
      });

      // Get real balance from service account if user is student
      if (currentUser.role === 'student') {
        try {
          const studentRes = await axios.get('/students/profile');
          const student = studentRes.data;
          
          // Use balance from student profile (already includes service account balance)
          const realBalance = student.balance || 0;
          
          setPayerInfo(prev => ({
            ...prev,
            balance: realBalance
          }));
          
          setPaymentInfo(prev => ({
            ...prev,
            availableBalance: realBalance
          }));
        } catch (balanceErr) {
          console.log('Could not load student profile:', balanceErr);
          // Set default balance for demo
          setPayerInfo(prev => ({ ...prev, balance: 2000000 }));
          setPaymentInfo(prev => ({ ...prev, availableBalance: 2000000 }));
        }
      } else {
        // For admin, set demo balance
        setPayerInfo(prev => ({ ...prev, balance: 2000000 }));
        setPaymentInfo(prev => ({ ...prev, availableBalance: 2000000 }));
      }

      // If current user is student, auto-load their info
      if (currentUser.role === 'student') {
        try {
          const studentRes = await axios.get('/students/profile');
          const student = studentRes.data;
          
          setTuitionInfo({
            studentCode: student.student_code,
            studentName: student.full_name,
            amount: 0
          });
          
          // Auto-search for this student's invoices
          await searchStudentInvoices(student.student_code, student.id);
        } catch (studentErr) {
          console.log('Could not auto-load student info:', studentErr);
          // Not a problem for admin users
        }
      }

      setSuccess('Sẵn sàng thanh toán. Nhập mã sinh viên để tìm hóa đơn.');
    } catch (err) {
      console.error('Load payer info error:', err);
      setError('Không thể tải thông tin người thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const searchStudentInvoices = async (studentCode, studentId = null) => {
    try {
      let student;
      
      if (studentId) {
        // We already have student data
        student = { id: studentId };
      } else {
        // Search student by code
        const studentResponse = await axios.get(`/students/by-code/${studentCode}`);
        student = studentResponse.data;
      }

      // Fetch unpaid invoices for this student
      const invoicesResponse = await axios.get(`/invoices/by-student/${student.id}`);
      const unpaidInvoices = invoicesResponse.data.filter(inv => inv.status === 'unpaid');
      
      if (unpaidInvoices.length > 0) {
        const invoice = unpaidInvoices[0]; // Use first unpaid invoice
        setSelectedInvoiceId(invoice.id);
        
        setTuitionInfo(prev => ({
          ...prev,
          studentName: student.full_name || prev.studentName,
          amount: invoice.total_amount
        }));

        setPaymentInfo(prev => ({
          ...prev,
          tuitionAmount: invoice.total_amount
        }));

        setSuccess(`Tìm thấy hóa đơn chưa thanh toán: ${formatCurrency(invoice.total_amount)}`);
        setError('');
      } else {
        setError('Không tìm thấy hóa đơn chưa thanh toán cho sinh viên này');
        setTuitionInfo(prev => ({
          ...prev,
          studentName: student.full_name || '',
          amount: 0
        }));
        setSelectedInvoiceId(null);
      }
    } catch (err) {
      console.error('Search student invoices error:', err);
      setError('Không tìm thấy sinh viên với mã này hoặc lỗi tải hóa đơn');
      setTuitionInfo(prev => ({
        ...prev,
        studentName: '',
        amount: 0
      }));
      setSelectedInvoiceId(null);
    }
  };

  const handleStudentCodeChange = (studentCode) => {
    setTuitionInfo(prev => ({ ...prev, studentCode }));
    
    // Auto-search when student code is complete (e.g., 6+ characters)
    if (studentCode.length >= 6) {
      searchStudentInvoices(studentCode);
    } else {
      // Clear data when code is too short
      setTuitionInfo(prev => ({
        ...prev,
        studentName: '',
        amount: 0
      }));
      setSelectedInvoiceId(null);
      setError('');
      setSuccess('');
    }
  };

  const isFormValid = () => {
    return (
      selectedInvoiceId &&
      tuitionInfo.studentCode &&
      tuitionInfo.studentName &&
      tuitionInfo.amount > 0 &&
      paymentInfo.agreeTerms &&
      tuitionInfo.amount <= (paymentInfo.availableBalance || Infinity)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError('Vui lòng điền đầy đủ thông tin và chấp nhận điều khoản');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Request OTP using selected invoice
      await axios.post('/payments/request', {
        invoice_id: selectedInvoiceId,
        student_code: tuitionInfo.studentCode,
        student_name: tuitionInfo.studentName,
        amount_paid: tuitionInfo.amount,
        method: 'bank_transfer',
        agree_terms: true
      });

      setStep(2);
      const expiry = new Date(Date.now() + 5 * 60 * 1000);
      setOtpExpiry(expiry);
      setSuccess('Mã OTP đã được gửi đến email của bạn');
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Confirm payment with OTP and selected invoice
      await axios.post(
        '/payments/confirm',
        {
          invoice_id: selectedInvoiceId,
          student_code: tuitionInfo.studentCode,
          student_name: tuitionInfo.studentName,
          amount_paid: tuitionInfo.amount,
          method: 'bank_transfer',
          agree_terms: true
        },
        { params: { otp } }
      );

      setStep(3);
      setSuccess('Thanh toán thành công! Email xác nhận đã được gửi.');

      setPayerInfo((prev) => ({
        ...prev,
        balance: Math.max(0, (prev.balance || 0) - tuitionInfo.amount)
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');

      // resend uses query param for invoice_id
      await axios.post('/payments/resend', null, { params: { invoice_id: selectedInvoiceId } });

      const expiry = new Date(Date.now() + 5 * 60 * 1000);
      setOtpExpiry(expiry);
      setSuccess('Mã OTP mới đã được gửi');
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể gửi lại mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="clean-card p-8 text-center hover:clean-card-hover">
            <div className="mx-auto h-20 w-20 bg-green-600 rounded-full flex items-center justify-center mb-6 success-check">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your transaction has been processed successfully. A confirmation email has been sent to your registered address.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setSuccess('');
                  setError('');
                }}
                className="btn-secondary w-full"
              >
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-payment">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Tuition Payment
            </h1>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-payment">
        <div className="container-payment">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payer Information Section */}
              <div className="form-section">
                <h2 className="form-section-title">
                  <div className="form-section-icon">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  Payer Information
                </h2>
                <div className="responsive-form">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={payerInfo.fullName}
                      disabled
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={payerInfo.phone}
                      disabled
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={payerInfo.email}
                      disabled
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Tuition Information Section */}
              <div className="form-section">
                <h2 className="form-section-title">
                  <div className="form-section-icon">
                    <GraduationCap className="h-5 w-5 text-gray-600" />
                  </div>
                  Tuition Information
                </h2>
                <div className="responsive-form">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={tuitionInfo.studentCode}
                          onChange={(e) => handleStudentCodeChange(e.target.value)}
                          placeholder="Enter Student ID (e.g., SVDEMO001)"
                          className="input-field pr-10"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Target className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => searchStudentInvoices(tuitionInfo.studentCode)}
                        disabled={!tuitionInfo.studentCode || loading}
                        className="btn-secondary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={tuitionInfo.studentName}
                      disabled
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tuition Amount
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(tuitionInfo.amount)}
                      disabled
                      className="input-field"
                    />
                  </div>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-6">
                    <div className="loading-spinner mr-3"></div>
                    <span className="text-gray-600">Loading student information...</span>
                  </div>
                )}
              </div>

              {/* Payment Information Section */}
              <div className="form-section">
                <h2 className="form-section-title">
                  <div className="form-section-icon">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  Payment Information
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Balance
                      </label>
                      <div className="balance-display">
                        {formatCurrency(payerInfo.balance)}
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tuition Amount
                      </label>
                      <div className="payment-amount">
                        {formatCurrency(tuitionInfo.amount)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        Important Notes
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Full payment required
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Amount must ≤ Available balance
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          OTP verification required
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={paymentInfo.agreeTerms}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          agreeTerms: e.target.checked
                        }))}
                        className="mt-1 h-5 w-5 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                        I agree to the <span className="text-blue-600 underline cursor-pointer hover:text-blue-500">terms and conditions</span> of the system
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="status-error px-6 py-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="status-success px-6 py-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" />
                    {success}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className="btn-primary px-12 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-6 w-6 mr-3" />
                      Confirm Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto">
              <div className="clean-card p-8 hover:clean-card-hover">
                <div className="text-center mb-8">
                  <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    OTP Verification
                  </h2>
                  <p className="text-gray-600">
                    OTP has been sent to: <strong className="text-blue-600">nguyentansangxd@gmail.com</strong>
                  </p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      OTP Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="input-field otp-input"
                      maxLength={6}
                      required
                    />
                  </div>

                  {otpExpiry && (
                    <div className="text-center text-sm text-gray-500">
                      Valid until: <strong className="text-yellow-600">{formatTime(otpExpiry)}</strong>
                    </div>
                  )}

                  {error && (
                    <div className="status-error px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="status-success px-4 py-3 rounded-lg">
                      {success}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={!otp || loading}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Confirm Payment
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="btn-secondary w-full"
                    >
                      Resend OTP
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-secondary w-full"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Go Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TuitionPayment;
