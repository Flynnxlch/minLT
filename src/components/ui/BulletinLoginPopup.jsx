import { useNavigate } from 'react-router-dom';
import { useBulletin } from '../../context/BulletinContext';
import NotificationPopup from './NotificationPopup';

/**
 * Shown once per login when there are unread bulletins (Pedoman, Peraturan, Panduan).
 * User can go to Buletin or dismiss.
 */
export default function BulletinLoginPopup() {
  const navigate = useNavigate();
  const { showLoginPopup, unreadCount, dismissLoginPopup } = useBulletin();

  const handleGoToBulletin = () => {
    dismissLoginPopup();
    navigate('/guide');
  };

  if (!showLoginPopup) return null;

  const message =
    unreadCount === 1
      ? 'Anda memiliki 1 buletin yang belum dibaca.'
      : `Anda memiliki ${unreadCount} buletin yang belum dibaca.`;

  return (
    <NotificationPopup
      isOpen
      type="confirm"
      title="Buletin Baru"
      message={message}
      confirmText="Lihat Buletin"
      cancelText="Nanti"
      onConfirm={handleGoToBulletin}
      onClose={dismissLoginPopup}
    />
  );
}
