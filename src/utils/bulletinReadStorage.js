/**
 * Persist which bulletins the user has read (per user).
 * Used by BulletinContext only.
 */

export const BULLETIN_READ_STORAGE_PREFIX = 'minlt:bulletin:read:';

export function loadReadIds(userId) {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(BULLETIN_READ_STORAGE_PREFIX + userId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadIds(userId, readIds) {
  if (!userId) return;
  try {
    localStorage.setItem(BULLETIN_READ_STORAGE_PREFIX + userId, JSON.stringify([...readIds]));
  } catch {
    // ignore
  }
}
