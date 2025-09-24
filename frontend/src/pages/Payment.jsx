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
  Target,
  LayoutDashboard
} from 'lucide-react';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEYS = ['access_token', 'authToken', 'token'];

function Payment() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const storedEmail = localStorage.getItem('email') || '';
  useEffect(() => {
    const token = TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  const [payerInfo, setPayerInfo] = useState({
    fullName: '',
    phone: '',
    email: storedEmail,
    balance: 0,
    service_account: { balance: 0 }
  });

  const [tuitionInfo, setTuitionInfo] = useState({
    studentCode: '',
    studentName: '',
    amount: 0
  });

  const [paymentInfo, setPaymentInfo] = useState({
    availableBalance: 0,
    tuitionAmount: 0,
    agreeTerms: false,
    method: 'bank_transfer'
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);

  const handleAuthError = (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      try { logout(); } catch (_) { }
      navigate('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    loadPayerInfo();
  }, []);

  const loadPayerInfo = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await axios.get('/students/profile').catch(() => null);
      const currentUser = res?.data;

      if (!currentUser) {
        const alt = await axios.get('/students/profile').catch(() => null);
        if (alt?.data) {
          const u = alt.data;
          setPayerInfo({
            fullName: u.full_name || '',
            phone: u.phone || '',
            email: u.email || storedEmail || '',
            service_account: currentUser.service_account || { balance: 0 }

          });
        } else {
          setError('Please login again');
          return;
        }
      } else {
        setPayerInfo({
          fullName: currentUser.full_name || currentUser.fullName || '',
          phone: currentUser.phone || 'N/A',
          email: currentUser.email || storedEmail || '',
          balance: 0
        });
      }

      setPaymentInfo({
        availableBalance: currentUser.service_account?.balance || 0,
        tuitionAmount: 0,
        agreeTerms: false
      });


      const role = currentUser?.role || (await axios.get('/students/profile').then(r => r.data.role).catch(() => null));

      if (role === 'student' || role?.toLowerCase?.() === 'student') {
        try {
          const studentRes = await axios.get('/students/profile');
          const student = studentRes.data;
          const realBalance = student.balance || 0;

          setPayerInfo(prev => ({ ...prev, balance: realBalance, email: student.email || prev.email }));
          setPaymentInfo(prev => ({ ...prev, availableBalance: realBalance }));

          setTuitionInfo(prev => ({
            ...prev,
            studentCode: student.student_code || prev.studentCode,
            studentName: student.full_name || prev.studentName,
            amount: 0
          }));

          await searchStudentInvoices(student.student_code, student.id);
        } catch (err) {
          // fallback demo balance
          setPayerInfo(prev => ({ ...prev }));
          setPaymentInfo(prev => ({ ...prev }));
        }
      } else {
        // admin/demo
        setPayerInfo(prev => ({ ...prev }));
        setPaymentInfo(prev => ({ ...prev }));
      }

      setSuccess('Enter the student code to pay.');
    } catch (err) {
      if (handleAuthError(err)) return;
      console.error('Load payer info error:', err);
      setError('Can not loading');
    } finally {
      setLoading(false);
    }
  };

  const searchStudentInvoices = async (studentCode, studentId = null) => {
    try {
      setLoading(true);
      setError('');
      let student;

      if (studentId) {
        student = { id: studentId, student_code: tuitionInfo.studentCode, full_name: tuitionInfo.studentName };
      } else {
        const studentResponse = await axios.get(`/students/by-code/${encodeURIComponent(studentCode)}`);
        student = studentResponse.data;
      }

      const invoicesResponse = await axios.get(`/invoices/by-student/${student.id}`);
      const unpaid = (invoicesResponse.data || []).filter(inv => inv.status === 'unpaid');

      if (unpaid.length > 0) {
        const invoice = unpaid[0];
        setSelectedInvoiceId(invoice.id);

        setTuitionInfo(prev => ({
          ...prev,
          studentName: student.full_name || prev.studentName,
          amount: invoice.total_amount
        }));

        setPaymentInfo(prev => ({ ...prev, tuitionAmount: invoice.total_amount }));
        setSuccess(`Invoice found: ${formatCurrency(invoice.total_amount * 1000)}`);
        setError('');
      } else {
        setError('Invoice not found');
        setTuitionInfo(prev => ({ ...prev, studentName: student.full_name || '', amount: 0 }));
        setSelectedInvoiceId(null);
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      console.error('Search invoices error:', err);
      setError('Can not find student by student ID or something wrong while loading invoice');
      setTuitionInfo(prev => ({ ...prev, studentName: '', amount: 0 }));
      setSelectedInvoiceId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentCodeChange = (studentCode) => {
    setTuitionInfo(prev => ({ ...prev, studentCode }));
    if (studentCode.length >= 4) searchStudentInvoices(studentCode);
    else {
      setTuitionInfo(prev => ({ ...prev, studentName: '', amount: 0 }));
      setSelectedInvoiceId(null);
      setError('');
      setSuccess('');
    }
  };

  const isFormValid = () => {
    return (selectedInvoiceId &&
      tuitionInfo.studentCode &&
      tuitionInfo.studentName &&
      tuitionInfo.amount > 0 &&
      paymentInfo.method
      && paymentInfo.agreeTerms
    )
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Please agree the terms and condition before taking payment');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post('/payments/request', {
        invoice_id: selectedInvoiceId,
        student_code: tuitionInfo.studentCode,
        student_name: tuitionInfo.studentName,
        amount_paid: tuitionInfo.amount,
        method: 'bank_transfer',
        agree_terms: true
      });

      setStep(2); // chuyển sang màn hình OTP
      setOtpExpiry(new Date(Date.now() + 2 * 60 * 1000)); // 5 phút
      setSuccess('OTP đã được gửi đến email, vui lòng kiểm tra');
      setError('');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.response?.data?.detail || 'Không gửi được OTP');
    } finally {
      setLoading(false);
    }
  };


  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post('/payments/confirm',
        {
          invoice_id: selectedInvoiceId,
          student_code: tuitionInfo.studentCode,
          student_name: tuitionInfo.studentName,
          amount_paid: tuitionInfo.amount,
          method: paymentInfo.method,
          agree_terms: true
        },
        { params: { otp } }
      );

      if (paymentInfo.method === 'service_account') {
        setStep(3);
        return;
      }


      const res = await axios.post('/vnpay/create', {
        invoice_id: selectedInvoiceId,
        amount: tuitionInfo.amount,
        return_url: `${window.location.origin}/vnpay-return`
      });

      const { paymentUrl } = res.data;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setError('Can not get link');
      }
    } catch (err) {
      console.error('OTP verify / confirm error:', err);
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };


  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');

      await axios.post('/payments/resend', null, { params: { invoice_id: selectedInvoiceId } });
      setOtpExpiry(new Date(Date.now() + 2 * 60));
      setSuccess('New OTP sent');
    } catch (err) {
      if (handleAuthError(err)) return;
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.detail || 'Can not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatTime = (date) => date ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="clean-card p-8 text-center hover:clean-card-hover">
            <div className="mx-auto h-20 w-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-8">Your transaction has been processed successfully. A confirmation email has been sent.</p>
            <div className="space-y-4">
              <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Return to Dashboard</button>
              <button onClick={() => { setStep(1); setOtp(''); setSuccess(''); setError(''); }} className="btn-secondary w-full">Make Another Payment</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-payment">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => {
                const role = localStorage.getItem('role');

                if (role == 'admin') {
                  navigate('/admin-dashboard');
                } else {
                  navigate('/dashboard');
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
            </button>

            <h1 className="text-2xl font-bold text-gray-900">Tuition Payment</h1>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <main className="main-payment">
        <div className="container-payment max-w-6xl mx-auto px-4">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="form-section">
                <h2 className="form-section-title flex items-center gap-2"><User className="h-5 w-5 text-gray-600" /> Payer Information</h2>
                <div className="responsive-form grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" value={payerInfo.fullName} disabled className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="tel" value={payerInfo.phone} disabled className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input type="email" value={payerInfo.email} disabled className="input-field" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2 className="form-section-title flex items-center gap-2"><GraduationCap className="h-5 w-5 text-gray-600" /> Tuition Information</h2>
                <div className="responsive-form grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student ID <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="text" value={tuitionInfo.studentCode} onChange={(e) => handleStudentCodeChange(e.target.value)} placeholder="52300000" className="input-field pr-10" required />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Target className="h-5 w-5 text-gray-400" /></div>
                      </div>
                      <button type="button" onClick={() => searchStudentInvoices(tuitionInfo.studentCode)} disabled={!tuitionInfo.studentCode || loading} className="btn-secondary px-6">Search</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                    <input type="text" value={tuitionInfo.studentName} disabled className="input-field" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Amount</label>
                    <input type="text" value={formatCurrency(tuitionInfo.amount * 1000)} disabled className="input-field" />
                  </div>
                </div>

                {loading && <div className="flex items-center justify-center py-6"><div className="loading-spinner mr-3" /> <span className="text-gray-600">Loading...</span></div>}
              </div>

              <div className="form-section">
                <h2 className="form-section-title flex items-center gap-2"><CreditCard className="h-5 w-5 text-gray-600" /> Payment Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Available Balance</label>
                      <div className="balance-display">
                        {formatCurrency((paymentInfo.availableBalance ?? payerInfo.service_account?.balance ?? payerInfo.balance) * 1000)}
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Amount</label>
                      <div className="payment-amount">{formatCurrency(tuitionInfo.amount * 1000)}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-green-600" /> Important Notes</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Full payment required</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> OTP verification required</li>
                      </ul>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-9">
                      <input type="checkbox" id="agreeTerms" checked={paymentInfo.agreeTerms} onChange={(e) => setPaymentInfo(prev => ({ ...prev, agreeTerms: e.target.checked }))} className="mt-1 h-5 w-5 text-black focus:ring-black border-gray-300 rounded" />
                      <label htmlFor="agreeTerms" className="text-sm text-gray-700">I agree to the <span className="text-blue-600 underline cursor-pointer">terms and conditions</span></label>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="method"
                            value="bank_transfer"
                            checked={paymentInfo.method === 'bank_transfer'}
                            onChange={() => setPaymentInfo(prev => ({ ...prev, method: 'bank_transfer' }))}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Bank Transfer / External</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="method"
                            value="service_account"
                            checked={paymentInfo.method === 'service_account'}
                            onChange={() => setPaymentInfo(prev => ({ ...prev, method: 'service_account' }))}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Service Account (use available balance)</span>
                        </label>
                      </div>
                      {paymentInfo.method === 'service_account' && (
                        <div className="text-xs text-gray-500 mt-2">
                          Available: {formatCurrency((paymentInfo.availableBalance ?? payerInfo.service_account?.balance ?? payerInfo.balance) * 1000)}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {error && <div className="status-error px-6 py-4 rounded-lg"><div className="flex items-center gap-3"><AlertCircle className="h-5 w-5" />{error}</div></div>}
              {success && <div className="status-success px-6 py-4 rounded-lg"><div className="flex items-center gap-3"><CheckCircle className="h-5 w-5" />{success}</div></div>}

              <div className="flex justify-center">
                <button type="submit" disabled={!isFormValid() || loading} className="btn-primary px-12 py-4 text-xl disabled:opacity-50">
                  {loading ? (<><div className="loading-spinner mr-3" /> Processing...</>) : (<div className='flex item-center'><Shield className="h-6 w-6 mr-3" /> Confirm Transaction</div>)}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto">
              <div className="clean-card p-8 hover:clean-card-hover">
                <div className="text-center mb-8">
                  <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6"><Shield className="h-10 w-10 text-white" /></div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">OTP Verification</h2>
                  <p className="text-gray-600">OTP has been sent to your registered email</p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">OTP Code</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" className="input-field otp-input" maxLength={6} required />
                  </div>

                  {otpExpiry && <div className="text-center text-sm text-gray-500">Valid until: <strong className="text-yellow-600">{formatTime(otpExpiry)}</strong></div>}
                  {error && <div className="status-error px-4 py-3 rounded-lg">{error}</div>}
                  {success && <div className="status-success px-4 py-3 rounded-lg">{success}</div>}

                  <div className="space-y-4">
                    <button type="submit" disabled={!otp || loading} className="btn-primary w-full">{loading ? 'Verifying...' : 'Confirm Payment'}</button>
                    <button type="button" onClick={handleResendOTP} disabled={loading} className="btn-secondary w-full">Resend OTP</button>
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full"><div className="flex item-center justify-center" ><ArrowLeft /> Go Back</div></button>
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

export default Payment;
