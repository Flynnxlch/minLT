import { useState, useEffect } from 'react';
import { Card } from '../widgets';

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function UserRequest({ onApprove, onReject }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Load registration requests from localStorage
    const stored = localStorage.getItem('minlt:registration-requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Add id if missing
        const withIds = parsed.map((req, idx) => ({
          ...req,
          id: req.id || `req-${Date.now()}-${idx}`,
        }));
        setRequests(withIds);
      } catch {
        setRequests([]);
      }
    }
  }, []);

  const handleApprove = (requestId) => {
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    // Update localStorage
    localStorage.setItem('minlt:registration-requests', JSON.stringify(updated));
    onApprove?.(requestId);
  };

  const handleReject = (requestId) => {
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    // Update localStorage
    localStorage.setItem('minlt:registration-requests', JSON.stringify(updated));
    onReject?.(requestId);
  };

  return (
    <Card title="User Registration Requests" collapsible>
      {requests.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No pending registration requests.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Cabang</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">NIP</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Requested At</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-gray-100 dark:border-[var(--color-card-border-dark)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{request.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.cabang}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.nip}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(request.requestedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors shadow-sm"
                        title="Approve Request"
                      >
                        <i className="bi bi-check-circle"></i>
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm"
                        title="Reject Request"
                      >
                        <i className="bi bi-x-circle"></i>
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

