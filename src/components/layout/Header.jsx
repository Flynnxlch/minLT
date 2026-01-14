import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogoutConfirmModal from '../ui/LogoutConfirmModal';
import UserIcon from '../ui/UserIcon';

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleProfile = () => {
    navigate('/profile');
    setUserMenuOpen(false);
  };

  // Keep icon/state in sync even if user exits fullscreen via ESC
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    handleFsChange();
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const closeAllDropdowns = () => {
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-1030 flex items-center h-(--header-height) px-4 bg-white dark:bg-[var(--color-card-bg-dark)] border-b border-gray-200 dark:border-[var(--color-card-border-dark)] shadow-sm transition-colors duration-300">
      {/* Left side nav items */}
      <nav className="flex items-center gap-3">
        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list text-2xl"></i>
        </button>

        {/* Navigation links - hidden on mobile */}
        <button
          onClick={() => navigate('/')}
          className="hidden md:block px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white no-underline transition-colors"
        >
          Risk
        </button>
        <button
          onClick={() => navigate('/?mode=user')}
          className="hidden md:block px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white no-underline transition-colors"
        >
          User
        </button>
      </nav>

      {/* Right side nav items */}
      <nav className="flex items-center gap-2 ml-auto">
        {/* Search button */}
        <button className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors">
          <i className="bi bi-search text-lg"></i>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <i className={`bi text-lg ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
        </button>

        {/* User menu dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="flex items-center gap-2 px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
              <i className={`bi bi-chevron-down text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-xl border border-gray-200 dark:border-[var(--color-card-border-dark)] z-50 overflow-hidden">
                  {/* User header */}
                  <div className="bg-gradient-to-br from-[#0c9361] to-[#0a7a4f] text-white p-5 text-center">
                    <div className="relative inline-block mb-3">
                      <div className="w-20 h-20 rounded-full mx-auto shadow-lg border-4 border-white/20 bg-white/20 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-white" fill="currentColor" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <p className="font-semibold text-lg mb-1">{user.name}</p>
                    <p className="text-sm opacity-90 mb-1">{user.role || 'User'}</p>
                    <p className="text-xs opacity-75">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfile}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <i className="bi bi-person-circle text-xl text-gray-500 dark:text-gray-400"></i>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Profile</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View and edit your profile</p>
                      </div>
                      <i className="bi bi-chevron-right text-gray-400"></i>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navigate to settings
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <i className="bi bi-gear text-xl text-gray-500 dark:text-gray-400"></i>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Settings</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your preferences</p>
                      </div>
                      <i className="bi bi-chevron-right text-gray-400"></i>
                    </button>

                    <div className="border-t border-gray-200 dark:border-[var(--color-card-border-dark)] my-1"></div>

                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <i className="bi bi-box-arrow-right text-xl"></i>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Sign Out</p>
                        <p className="text-xs text-red-500 dark:text-red-400">Logout from your account</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}

