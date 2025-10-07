import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Mail, LogOut } from 'lucide-react';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEYS = ['access_token', 'authToken', 'token'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState({
    full_name: '',
    student_code: '',
    email: '',
    phone: '',
    balance: 0,
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [history, setHistory] = useState({
    total_paid_invoices: 0,
    total_amount: 0,
    unique_payers: 0,
    recent_payments: []
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const token = TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/students/profile').catch(() => null);
        if (res?.data) {
          const s = res.data;
          setProfile({
            full_name: s.full_name || s.fullName || '',
            student_code: s.student_code || s.studentCode || '',
            email: s.email || localStorage.getItem('email') || '',
            phone: s.phone || '',
            balance: Number(s.service_account?.balance ?? 0),
            role: s.role || localStorage.getItem('role') || 'student'
          });
        } else {
          const me = await axios.get('/auth/me').catch(() => null);
          if (me?.data) {
            const u = me.data;
            setProfile(prev => ({
              ...prev,
              full_name: u.full_name || u.fullName || '',
              email: u.email || localStorage.getItem('email') || '',
              role: u.role || localStorage.getItem('role') || ''
            }));
          } else {
            setProfile(prev => ({
              ...prev,
              email: localStorage.getItem('email') || '',
              role: localStorage.getItem('role') || ''
            }));
            setError('Can not load profile from server');
          }
        }
      } catch (err) {
        console.error('Load profile error', err);
        setError('There are something wrong while loading profile');
      } finally {
        setLoading(false);
      }
    };


    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const res = await axios.get('/payments/history/summary').catch(() => null);
        if (res?.data) {
          setHistory(res.data);
        }
      } catch (err) {
        console.error('Load payment history error', err);
        setHistoryError('Can not load payment history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadProfile();
    fetchHistory();
  }, []);

  const handleLogout = () => {
    try { logout(); } catch (_) { }
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil((history.recent_payments?.length || 0) / itemsPerPage);

  const paginatedPayments = history.recent_payments?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-4">
        {/* Thông tin người dùng */}
        <div className="clean-card p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">Loading...</div>
          ) : (
            <>
              {error && <div className="status-error px-4 py-3 rounded mb-4">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">Your Information</h3>
                  </div>
                  <p className="text-sm text-gray-700"><strong>Name:</strong> {profile.full_name || '—'}</p>
                  <p className="text-sm text-gray-700"><strong>Student ID:</strong> {profile.student_code || '—'}</p>
                  <p className="text-sm text-gray-700"><strong>Role:</strong> {profile.role || '—'}</p>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">Contact</h3>
                  </div>
                  <p className="text-sm text-gray-700"><strong>Email:</strong> {profile.email || '—'}</p>
                  <p className="text-sm text-gray-700"><strong>Phone:</strong> {profile.phone || '—'}</p>
                  <p className="text-sm text-gray-700 mt-3"><strong>Available Balance:</strong></p>
                  <div className="text-xl font-bold mt-1">{formatCurrency(profile.balance * 1000)}</div>
                </div>
              </div>

              <div className="mt-6">
                <button onClick={() => navigate('/payment')} className="btn-primary">Go to Payments</button>
              </div>
            </>
          )}
        </div>

        {/* Lịch sử thanh toán */}
        <div className="clean-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Payment History Summary</h3>
            <div className="text-sm text-gray-600">{historyLoading ? 'Loading...' : ''}</div>
          </div>

          {historyError && <div className="status-error px-4 py-3 rounded mb-4">{historyError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-white rounded-lg border text-center">
              <div className="text-sm text-gray-500">Paid Invoices</div>
              <div className="text-2xl font-bold">{history.total_paid_invoices ?? 0}</div>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold">{formatCurrency(history.total_amount * 1000)}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recent Payments</h4>
            {history.recent_payments?.length > 0 ? (
              <>
                <ul className="space-y-2">
                  {paginatedPayments.map((it) => (
                    <li key={it.invoice_id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold">Invoice #{it.invoice_id}</div>
                        <div className="text-xs text-gray-500">{it.student_name ?? '—'} (ID: {it.student_id})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(it.amount * 1000)}</div>
                        <div className="text-xs text-gray-500">{it.paid_at ? new Date(it.paid_at).toLocaleString() : ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination controls */}
                <div className="flex justify-center items-center gap-2 mt-3">
                  <button
                    className="btn-secondary px-2 py-1"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn-secondary px-2 py-1"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No transaction recently</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
