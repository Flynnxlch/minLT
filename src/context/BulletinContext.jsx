import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_ENDPOINTS, apiRequest, getAuthToken } from '../config/api';
import { loadReadIds, saveReadIds } from '../utils/bulletinReadStorage';
import { useAuth } from './AuthContext';

const BulletinContext = createContext(null);

const BADGE_CAP = 99;

function normalizeCategory(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('peraturan')) return 'Peraturan';
  if (c.includes('pedoman')) return 'Pedoman';
  return 'Pemberitahuan';
}

export function BulletinProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [bulletins, setBulletins] = useState([]);
  const [readIds, setReadIds] = useState(() => loadReadIds(userId));
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoadingBulletins, setIsLoadingBulletins] = useState(false);

  const hasShownLoginPopupRef = useRef(false);

  // Keep readIds in sync with user (e.g. after login/logout)
  useEffect(() => {
    setReadIds(loadReadIds(userId));
    if (!userId) {
      hasShownLoginPopupRef.current = false;
    }
  }, [userId]);

  /**
   * Fetch bulletins from regulation_updates (same API as Guide & UpdatePeraturanTerbaru).
   * Accepts optional AbortSignal; ignores result if aborted (e.g. unmount or userId change).
   */
  const fetchBulletins = useCallback(async (signal) => {
    if (!getAuthToken()) return;
    try {
      setIsLoadingBulletins(true);
      const data = await apiRequest(API_ENDPOINTS.regulations.getAll, { signal });
      if (signal?.aborted) return;
      const updates = data?.updates ?? [];
      const transformed = updates
        .map((update, index) => {
          const publishedAt = update.publishedAt ?? update.published_at;
          const category = normalizeCategory(update.category);
          const id = update.id ?? `${publishedAt || 'update'}-${index}`;
          return {
            id: String(id),
            title: update.title ?? '',
            category,
            publishedAt,
          };
        })
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setBulletins(transformed);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('BulletinContext: fetch bulletins failed', err);
      if (!signal?.aborted) setBulletins([]);
    } finally {
      if (!signal?.aborted) setIsLoadingBulletins(false);
    }
  }, []);

  /** Unread count: bulletins that are not in readIds */
  const unreadCount = useMemo(() => {
    return bulletins.filter((b) => !readIds.has(b.id)).length;
  }, [bulletins, readIds]);

  /** Display string for badge: '' when 0, '99+' when > 99, else number */
  const unreadBadgeText = useMemo(() => {
    if (unreadCount <= 0) return '';
    if (unreadCount > BADGE_CAP) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  /** Mark a bulletin as read and persist (id can be number or string from API) */
  const markAsRead = useCallback(
    (bulletinId) => {
      if (bulletinId == null || bulletinId === '') return;
      const idStr = String(bulletinId);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(idStr);
        saveReadIds(userId, next);
        return next;
      });
    },
    [userId]
  );

  /** Dismiss the login popup (do not show again this session) */
  const dismissLoginPopup = useCallback(() => {
    hasShownLoginPopupRef.current = true;
    setShowLoginPopup(false);
  }, []);

  // Fetch bulletins when user is logged in (with abort on unmount / userId change)
  useEffect(() => {
    if (!userId) {
      setBulletins([]);
      return;
    }
    const controller = new AbortController();
    fetchBulletins(controller.signal);
    return () => controller.abort();
  }, [userId, fetchBulletins]);

  // After bulletins loaded and user is logged in: show login popup once if there are unread
  useEffect(() => {
    if (!userId || isLoadingBulletins || bulletins.length === 0) return;
    if (hasShownLoginPopupRef.current) return;
    if (unreadCount <= 0) return;
    setShowLoginPopup(true);
  }, [userId, isLoadingBulletins, bulletins.length, unreadCount]);

  const value = useMemo(
    () => ({
      bulletins,
      readIds,
      unreadCount,
      unreadBadgeText,
      showLoginPopup,
      isLoadingBulletins,
      fetchBulletins,
      markAsRead,
      dismissLoginPopup,
    }),
    [
      bulletins,
      readIds,
      unreadCount,
      unreadBadgeText,
      showLoginPopup,
      isLoadingBulletins,
      fetchBulletins,
      markAsRead,
      dismissLoginPopup,
    ]
  );

  return <BulletinContext.Provider value={value}>{children}</BulletinContext.Provider>;
}

// Hook is intentionally in same file as provider for context access
// eslint-disable-next-line react-refresh/only-export-components
export function useBulletin() {
  const ctx = useContext(BulletinContext);
  if (!ctx) throw new Error('useBulletin must be used within BulletinProvider');
  return ctx;
}
