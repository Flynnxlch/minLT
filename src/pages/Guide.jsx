import { useState, useEffect, useMemo } from 'react';
import ContentHeader from '../components/ui/ContentHeader';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import { useBulletin } from '../context/BulletinContext';

const CATEGORY_ORDER = ['Peraturan', 'Pedoman', 'Pemberitahuan'];

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatPublishedDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const monthName = MONTH_NAMES_ID[date.getMonth()] || '-';
  const year = String(date.getFullYear());

  return `${day} ${monthName} ${year}`;
}

function normalizeCategory(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('peraturan')) return 'Peraturan';
  if (c.includes('pedoman')) return 'Pedoman';
  return 'Pemberitahuan';
}

function categoryBadgeClass(category) {
  if (category === 'Peraturan') return 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-900/30 dark:text-red-300';
  if (category === 'Pedoman') return 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300';
  return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
}

export default function Guide() {
  const { markAsRead } = useBulletin();
  const [updates, setUpdates] = useState([]);
  const [activeUpdateId, setActiveUpdateId] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('Peraturan');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUpdates = async (signal) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest(API_ENDPOINTS.regulations.getAll, { signal });
      if (signal?.aborted) return;
      const raw = data?.updates ?? [];
      const transformed = raw
        .map((update, index) => {
          const publishedAt = update.publishedAt ?? update.published_at;
          const category = normalizeCategory(update.category);
          const id = update.id ?? `${publishedAt || 'update'}-${index}`;
          return {
            id: String(id),
            title: update.title ?? '',
            category,
            type: String(update.contentType ?? update.content_type ?? 'text').toLowerCase(),
            content: update.content ?? '',
            publishedAt,
            link: update.link ?? null,
          };
        })
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      setUpdates(transformed);
      setActiveUpdateId((previousId) => {
        if (!transformed.length) return null;
        if (transformed.some((item) => item.id === previousId)) return previousId;
        return transformed[0].id;
      });
      if (transformed.length > 0) {
        setExpandedCategory(normalizeCategory(transformed[0].category));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error loading regulation updates:', err);
      if (!signal?.aborted) setError(err.message || 'Gagal memuat update');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadUpdates(controller.signal);
    return () => controller.abort();
  }, []);

  // Mark the currently viewed bulletin as read so notification count decreases
  useEffect(() => {
    if (activeUpdateId) {
      markAsRead(activeUpdateId);
    }
  }, [activeUpdateId, markAsRead]);

  const activeUpdate = useMemo(() => {
    return updates.find((update) => update.id === activeUpdateId) || null;
  }, [updates, activeUpdateId]);

  const groupedUpdates = useMemo(() => {
    const grouped = {
      Peraturan: [],
      Pedoman: [],
      Pemberitahuan: [],
    };

    updates.forEach((update) => {
      grouped[normalizeCategory(update.category)].push(update);
    });

    return grouped;
  }, [updates]);

  return (
    <>
      <ContentHeader
        title="Buletin Pemberitahuan Terbaru"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Panduan' },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="w-full lg:w-72 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pemberitahuan Terbaru</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pemberitahuan terbaru adalah yang dipakai</p>
          </div>

          <nav className="p-2 space-y-1">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Memuat tanggal update...
              </div>
            )}

            {!isLoading && !error && updates.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Belum ada update.
              </div>
            )}

            {!isLoading && !error && CATEGORY_ORDER.map((category) => {
              const items = groupedUpdates[category];
              if (!items.length) return null;

              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory((prev) => (prev === category ? null : category))}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-white dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(category)}`}>
                        {category}
                      </span>
                      <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-xs text-gray-500 dark:text-gray-400`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-2 space-y-1">
                      {items.map((update) => (
                        <button
                          key={update.id}
                          type="button"
                          onClick={() => setActiveUpdateId(update.id)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
                            activeUpdateId === update.id
                              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border-l-4 border-blue-600 dark:border-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <i className="bi bi-calendar-event text-xs" />
                            <span className="text-sm">{formatPublishedDate(update.publishedAt)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <i className="bi bi-star-fill text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                 Pemberitahuan Terbaru
                </h2>
              </div>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isLoading && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Memuat update peraturan...
                  </p>
                </div>
              )}

              {!isLoading && error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Kesalahan: {error}
                  </p>
                </div>
              )}

              {!isLoading && !error && !activeUpdate && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum ada update peraturan terbaru.
                  </p>
                </div>
              )}

              {!isLoading && !error && activeUpdate && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800/50 not-prose">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${categoryBadgeClass(activeUpdate.category)}`}>
                      {activeUpdate.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPublishedDate(activeUpdate.publishedAt)}
                    </span>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {activeUpdate.title}
                  </h4>

                  {activeUpdate.type === 'text' ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {activeUpdate.content}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <img
                        src={activeUpdate.content}
                        alt={activeUpdate.title}
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}

                  {activeUpdate.link && activeUpdate.link.trim() && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={activeUpdate.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="bi bi-link-45deg"></i>
                        <span>Baca selengkapnya</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
