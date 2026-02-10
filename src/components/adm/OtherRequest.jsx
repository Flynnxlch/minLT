import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import { Card } from '../widgets';

function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

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

function typeBadgeClass(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('admin')) return 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
  if (t.includes('password')) return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
  return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

/** Display text for detail: PASSWORD_RESET shows fixed label, else raw detail (if not JSON). */
function getDetailDisplay(request) {
  const t = String(request.type || '').toLowerCase();
  if (t.includes('password')) return 'Permintaan reset kata sandi';
  const d = request.detail;
  if (typeof d !== 'string') return '—';
  try {
    JSON.parse(d);
    return '—';
  } catch {
    return d;
  }
}

export default function OtherRequest({ onApprove, onReject }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(API_ENDPOINTS.requests.other.getAll);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat permintaan');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await apiRequest(API_ENDPOINTS.requests.other.approve(requestId), { method: 'POST' });
      await fetchRequests();
      onApprove?.(requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await apiRequest(API_ENDPOINTS.requests.other.reject(requestId), { method: 'POST' });
      await fetchRequests();
      onReject?.(requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menolak');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => (r.status || '').toLowerCase() === 'pending');

  return (
    <Card title="Permintaan Lainnya">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          <i className="bi bi-exclamation-circle-fill shrink-0"></i>
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 flex items-center justify-center gap-2">
          <i className="bi bi-arrow-repeat animate-spin"></i>
          Memuat...
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Tidak ada permintaan yang tertunda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-(--color-card-border-dark)">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Jenis</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Pengguna</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Detail</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Diminta Pada</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => {
                const name = request.user?.name ?? '—';
                const email = request.user?.email ?? '—';
                const isProcessing = processingId === request.id;
                return (
                  <tr
                    key={request.id}
                    className="border-b border-gray-100 dark:border-(--color-card-border-dark) hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(request.type)}`}>
                        {request.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white" title={name}>
                          {truncateText(name, 20)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{getDetailDisplay(request)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(request.requestedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Setujui Permintaan"
                        >
                          {isProcessing ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-check-circle"></i>}
                          <span className="hidden sm:inline">Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Tolak Permintaan"
                        >
                          <i className="bi bi-x-circle"></i>
                          <span className="hidden sm:inline">Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
