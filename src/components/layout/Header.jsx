import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

// Sample chat contacts (dropdown shows 3 contacts + "See All Messages")
const chatContacts = [
  {
    id: 1,
    name: 'Nora Silvester',
    avatar: '/src/assets/img/user3-128x128.jpg',
    date: 'Yesterday',
    lastMessage: 'Awaiting approval',
  },
  {
    id: 2,
    name: 'John Pierce',
    avatar: '/src/assets/img/user8-128x128.jpg',
    date: '2 days ago',
    lastMessage: 'Sent report draft',
  },
  {
    id: 3,
    name: 'Brad Diesel',
    avatar: '/src/assets/img/user1-128x128.jpg',
    date: '3 days ago',
    lastMessage: 'Please review item 12',
  },
];

// Sample chat messages (popup conversation content)
const chatMessages = [
  {
    name: 'Brad Diesel',
    avatar: '/src/assets/img/user1-128x128.jpg',
    text: 'Need quick review on mitigation plan?',
    timestamp: '10:20 AM',
    isEnd: false,
  },
  {
    name: 'You',
    avatar: '/src/assets/img/user2-160x160.jpg',
    text: 'Checked. Looks good, just add evidence link.',
    timestamp: '10:22 AM',
    isEnd: true,
  },
  {
    name: 'Brad Diesel',
    avatar: '/src/assets/img/user1-128x128.jpg',
    text: 'Will do. Thanks!',
    timestamp: '10:23 AM',
    isEnd: false,
  },
];

// Sample notifications
const notifications = [
  { id: 1, icon: 'bi-envelope', text: '4 new messages', time: '3 mins' },
  { id: 2, icon: 'bi-file-earmark-fill', text: '3 new reports', time: '2 days' },
];

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [selectedChatContact, setSelectedChatContact] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
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
    setMessagesOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  };

  const handleOpenChatContact = (contact) => {
    setSelectedChatContact(contact);
    setMessagesOpen(false);
    setChatPopupOpen(true);
  };

  const handleOpenAllMessages = () => {
    setSelectedChatContact(null);
    setMessagesOpen(false);
    setChatPopupOpen(true);
  };

  const handleCloseChatPopup = () => {
    setChatPopupOpen(false);
    setSelectedChatContact(null);
    setChatMessageText('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    // Placeholder (replace with API later)
    console.log('Sending message:', chatMessageText);
    setChatMessageText('');
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

        {/* Messages dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setMessagesOpen(!messagesOpen);
            }}
            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
          >
            <i className="bi bi-chat-text text-lg"></i>
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-red-500 rounded-full">
              {chatContacts.length}
            </span>
          </button>

          {messagesOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMessagesOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-lg border border-gray-200 dark:border-[var(--color-card-border-dark)] z-50 overflow-hidden">
                {chatContacts.map((contact, index) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleOpenChatContact(contact)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${
                      index !== chatContacts.length - 1 ? 'border-b border-gray-100 dark:border-[var(--color-card-border-dark)]' : ''
                    }`}
                  >
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{contact.name}</h4>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{contact.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{contact.lastMessage}</p>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleOpenAllMessages}
                  className="block w-full text-center py-2 text-sm text-primary dark:text-blue-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-[var(--color-card-border-dark)]"
                >
                  See All Messages
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setNotificationsOpen(!notificationsOpen);
            }}
            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
          >
            <i className="bi bi-bell-fill text-lg"></i>
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-medium text-gray-900 bg-yellow-400 rounded-full">
              15
            </span>
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-lg border border-gray-200 dark:border-[var(--color-card-border-dark)] z-50 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">15 Notifications</span>
                </div>
                {notifications.map((notif, index) => (
                  <a
                    key={notif.id}
                    href="#"
                    className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      index !== notifications.length - 1 ? 'border-b border-gray-100 dark:border-[var(--color-card-border-dark)]' : ''
                    }`}
                  >
                    <i className={`bi ${notif.icon} text-gray-500 dark:text-gray-400`}></i>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{notif.text}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{notif.time}</span>
                  </a>
                ))}
                <a
                  href="#"
                  className="block text-center py-2 text-sm text-primary dark:text-blue-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-[var(--color-card-border-dark)]"
                >
                  See All Notifications
                </a>
              </div>
            </>
          )}
        </div>

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
              <img
                src={user.avatar || '/src/assets/img/user2-160x160.jpg'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
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
                      <img
                        src={user.avatar || '/src/assets/img/user2-160x160.jpg'}
                        alt={user.name}
                        className="w-20 h-20 rounded-full mx-auto shadow-lg border-4 border-white/20"
                      />
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
                      onClick={handleLogout}
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

      {/* Direct Chat Popup Overlay (triggered from navbar dropdown) */}
      {chatPopupOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity" onClick={handleCloseChatPopup} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-2xl bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedChatContact ? (
                    <>
                      <img
                        src={selectedChatContact.avatar}
                        alt={selectedChatContact.name}
                        className="w-10 h-10 rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {selectedChatContact.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {selectedChatContact.lastMessage}
                        </p>
                      </div>
                    </>
                  ) : (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">All Messages</h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseChatPopup}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close chat"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Popup Body */}
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {!selectedChatContact ? (
                  <ul className="divide-y divide-gray-200 dark:divide-[var(--color-card-border-dark)] rounded-lg border border-gray-200 dark:border-[var(--color-card-border-dark)] overflow-hidden">
                    {chatContacts.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedChatContact(contact)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-white truncate">{contact.name}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{contact.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{contact.lastMessage}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`flex gap-3 ${msg.isEnd ? 'flex-row-reverse' : ''}`}>
                        <img src={msg.avatar} alt={msg.name} className="w-10 h-10 rounded-full shrink-0" />
                        <div className={`max-w-[70%] ${msg.isEnd ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 text-sm ${msg.isEnd ? 'flex-row-reverse' : ''}`}>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{msg.name}</span>
                            <span className="text-gray-400 dark:text-gray-500">{msg.timestamp}</span>
                          </div>
                          <div
                            className={`inline-block px-3 py-2 rounded-lg ${
                              msg.isEnd
                                ? 'bg-[#0d6efd] text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popup Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-[var(--color-card-border-dark)]">
                {selectedChatContact ? (
                  <form onSubmit={handleSendMessage}>
                    <div className="flex">
                      <input
                        type="text"
                        value={chatMessageText}
                        onChange={(e) => setChatMessageText(e.target.value)}
                        placeholder="Type Message ..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0d6efd] text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Select a contact to open the conversation.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

