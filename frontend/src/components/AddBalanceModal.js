import React, { useState } from 'react';
import axios from 'axios';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

function AddBalanceModal({ onClose, onSuccess, currentStudent }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const predefinedAmounts = [100000, 500000, 1000000, 2000000, 5000000];

  const handleAddBalance = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current service account
      const accountResponse = await axios.get(`/service-accounts/by-student/${currentStudent.id}`);
      const currentBalance = accountResponse.data.balance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      // Update service account balance
      await axios.put(`/service-accounts/${accountResponse.data.id}`, {
        balance: newBalance
      });
      
      setSuccess(`Successfully added ${parseFloat(amount).toLocaleString()} VND to your account!`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error adding balance:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to add balance');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Balance
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Balance
          </label>
          <div className="p-3 bg-gray-50 rounded-md text-lg font-semibold text-gray-900">
            {currentStudent ? formatCurrency(currentStudent.balance || 0) : '0 VND'}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Add (VND)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
            min="0"
            step="1000"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-2 gap-2">
            {predefinedAmounts.map((predefinedAmount) => (
              <button
                key={predefinedAmount}
                onClick={() => setAmount(predefinedAmount.toString())}
                className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
              >
                {formatCurrency(predefinedAmount)}
              </button>
            ))}
          </div>
        </div>

        {amount && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">
              <p><strong>Adding:</strong> {formatCurrency(parseFloat(amount) || 0)}</p>
              <p><strong>New Balance:</strong> {formatCurrency((currentStudent?.balance || 0) + (parseFloat(amount) || 0))}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAddBalance}
            disabled={loading || !amount || amount <= 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Balance'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddBalanceModal;
