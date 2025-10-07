import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, LayoutDashboard } from 'lucide-react';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function VNPayReturn() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const params = Object.fromEntries(queryParams.entries());

        const res = await axios.get('/vnpay/verify', { params });
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Payment successful');
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Payment failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Error verifying payment');
      }
    };

    verifyPayment();
  }, [location]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="flex items-center justify-center">
          <div className="loading-spinner mr-3" />
          <span className="text-gray-600">Verifying payment...</span>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="clean-card p-8 text-center hover:clean-card-hover">
            <div className="mx-auto h-20 w-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  const role = localStorage.getItem('role');
                  navigate(role === 'admin' ? '/admin-dashboard' : '/dashboard');
                }}
                className="btn-primary w-full"
              >
                <div className="flex items-center justify-center">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Return to Dashboard
                </div>
              </button>
              <button
                onClick={() => navigate('/payment')}
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="clean-card p-8 text-center hover:clean-card-hover">
          <div className="mx-auto h-20 w-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h2>
          <p className="text-gray-600 mb-8">{message}</p>
          <div className="space-y-4">
            <button
              onClick={() => {
                const role = localStorage.getItem('role');
                navigate(role === 'admin' ? '/admin-dashboard' : '/dashboard');
              }}
              className="btn-primary w-full"
            >
              <div className="flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 mr-2" /> Return to Dashboard
              </div>
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="btn-secondary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VNPayReturn;