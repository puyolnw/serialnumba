import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AttendanceConfirmation = () => {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCheckins, setSelectedCheckins] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPendingCheckins();
  }, [currentPage]);

  const fetchPendingCheckins = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/pending?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.data.success) {
        setCheckins(response.data.data.checkins);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      setError('Failed to load pending check-ins');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSingle = async (checkinId) => {
    try {
      setConfirming(true);
      setMessage('');
      setError('');
      
      const response = await api.post('/attendance/confirm', { checkin_id: checkinId });
      
      if (response.data.success) {
        setMessage(`Attendance confirmed for ${response.data.data.identifier_value}`);
        fetchPendingCheckins(); // Refresh the list
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
      setError(error.response?.data?.message || 'Failed to confirm attendance');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmBulk = async () => {
    if (selectedCheckins.length === 0) {
      setError('Please select at least one check-in to confirm');
      return;
    }

    try {
      setConfirming(true);
      setMessage('');
      setError('');
      
      const response = await api.post('/attendance/confirm-bulk', { 
        checkin_ids: selectedCheckins 
      });
      
      if (response.data.success) {
        setMessage(`Confirmed ${response.data.data.confirmed.length} check-ins`);
        setSelectedCheckins([]);
        fetchPendingCheckins(); // Refresh the list
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
      setError(error.response?.data?.message || 'Failed to confirm attendance');
    } finally {
      setConfirming(false);
    }
  };

  const handleSelectCheckin = (checkinId) => {
    setSelectedCheckins(prev => 
      prev.includes(checkinId) 
        ? prev.filter(id => id !== checkinId)
        : [...prev, checkinId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCheckins.length === checkins.length) {
      setSelectedCheckins([]);
    } else {
      setSelectedCheckins(checkins.map(c => c.id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Confirmation</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.totalItems || 0} pending check-ins
        </div>
      </div>
      
      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {checkins.length > 0 && (
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedCheckins.length === checkins.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Select All</span>
            </label>
            <span className="text-sm text-gray-600">
              {selectedCheckins.length} selected
            </span>
          </div>
          <button
            onClick={handleConfirmBulk}
            disabled={confirming || selectedCheckins.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Confirming...' : `Confirm Selected (${selectedCheckins.length})`}
          </button>
        </div>
      )}

      {/* Check-ins Table */}
      {checkins.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identifier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checkins.map((checkin) => (
                  <tr key={checkin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCheckins.includes(checkin.id)}
                        onChange={() => handleSelectCheckin(checkin.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {checkin.activity.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkin.activity.hours_awarded} hours
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {checkin.identifier_value}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkin.identifier_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(checkin.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleConfirmSingle(checkin.id)}
                        disabled={confirming}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Check-ins</h3>
          <p className="text-gray-500">
            All check-ins have been confirmed or there are no pending check-ins.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceConfirmation;
