import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Receipt,
  AlertCircle,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

function PaymentHistory({ studentId }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filter, setFilter] = useState({
    method: 'all',
    dateRange: 'all',
    showDetails: false
  });

  useEffect(() => {
    if (studentId) {
      loadPaymentHistory();
    }
  }, [studentId]);

  useEffect(() => {
    applyFilters();
  }, [payments, filter]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`/payments/by-student/${studentId}`);
      setPayments(response.data || []);
    } catch (err) {
      console.error('Error loading payment history:', err);
      setError('Không thể tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Filter by payment method
    if (filter.method !== 'all') {
      filtered = filtered.filter(payment => payment.method === filter.method);
    }

    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const days = filter.dateRange === 'week' ? 7 : filter.dateRange === 'month' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(payment => 
        new Date(payment.payment_date) >= cutoffDate
      );
    }

    setFilteredPayments(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'bank_transfer':
        return <Receipt className="h-4 w-4 text-green-600" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit_card':
        return 'Thẻ tín dụng';
      case 'bank_transfer':
        return 'Chuyển khoản';
      case 'cash':
        return 'Tiền mặt';
      default:
        return method;
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Ngày thanh toán', 'Số tiền', 'Phương thức', 'Mã giao dịch', 'Mã hóa đơn'],
      ...filteredPayments.map(payment => [
        formatDate(payment.payment_date),
        payment.amount_paid,
        getPaymentMethodText(payment.method),
        payment.transaction_code,
        payment.invoice_id
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="clean-card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner mr-3"></div>
          <span className="text-gray-600">Đang tải lịch sử thanh toán...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clean-card p-6">
        <div className="status-error px-6 py-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="clean-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Lịch sử thanh toán
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phương thức thanh toán
          </label>
          <select
            value={filter.method}
            onChange={(e) => setFilter(prev => ({ ...prev, method: e.target.value }))}
            className="input-field"
          >
            <option value="all">Tất cả</option>
            <option value="credit_card">Thẻ tín dụng</option>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng thời gian
          </label>
          <select
            value={filter.dateRange}
            onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
            className="input-field"
          >
            <option value="all">Tất cả</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="quarter">90 ngày qua</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFilter(prev => ({ ...prev, showDetails: !prev.showDetails }))}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
          >
            {filter.showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {filter.showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Tổng giao dịch</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{filteredPayments.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Tổng tiền</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(filteredPayments.reduce((sum, payment) => sum + payment.amount_paid, 0))}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Giao dịch gần nhất</span>
          </div>
          <div className="text-sm font-medium text-purple-900">
            {filteredPayments.length > 0 
              ? formatDate(filteredPayments[0].payment_date)
              : 'Chưa có'
            }
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày thanh toán
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phương thức
              </th>
              {filter.showDetails && (
                <>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã giao dịch
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã hóa đơn
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(payment.payment_date)}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {formatCurrency(payment.amount_paid)}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.method)}
                    {getPaymentMethodText(payment.method)}
                  </div>
                </td>
                {filter.showDetails && (
                  <>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {payment.transaction_code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      #{payment.invoice_id}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={filter.showDetails ? 5 : 3} className="px-3 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-8 w-8 text-gray-400" />
                    Không có giao dịch nào trong khoảng thời gian này
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentHistory;
