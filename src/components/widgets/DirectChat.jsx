import { useState } from 'react';
import Card from './Card';

const colorClasses = {
  primary: 'bg-[#0d6efd]',
  success: 'bg-[#198754]',
  warning: 'bg-[#ffc107]',
  danger: 'bg-[#dc3545]',
  info: 'bg-[#0dcaf0]',
  secondary: 'bg-[#6c757d]',
};

export default function DirectChat({
  title = 'Direct Chat',
  messages = [],
  contacts = [],
  color = 'primary',
  badge,
  collapsible = true,
  removable = true,
}) {
  const [showContacts, setShowContacts] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      // Handle sending message - in real app, this would call an API
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setShowContacts(false);
    setShowChatPopup(true);
  };

  const handleSeeAllMessages = () => {
    setShowChatPopup(true);
    setSelectedContact(null);
  };

  const tools = (
    <>
      {badge && (
        <span className={`${colorClasses[color]} text-white text-xs px-2 py-0.5 rounded-full mr-2`}>
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={() => setShowContacts(!showContacts)}
        className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
        title="Contacts"
      >
        <i className="bi bi-chat-text-fill"></i>
      </button>
    </>
  );

  const ChatContent = ({ isPopup = false }) => (
    <>
      {/* Messages container */}
      <div className="relative overflow-hidden">
        {/* Chat messages */}
        <div className={`h-64 overflow-y-auto p-4 ${showContacts ? 'invisible' : 'visible'} no-scrollbar`}>
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 mb-4 ${msg.isEnd ? 'flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.avatar}
                  alt={msg.name}
                  className="w-10 h-10 rounded-full shrink-0"
                />
                <div className={`max-w-[70%] ${msg.isEnd ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 text-sm ${msg.isEnd ? 'flex-row-reverse' : ''}`}>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{msg.name}</span>
                    <span className="text-gray-400 dark:text-gray-500">{msg.timestamp}</span>
                  </div>
                  <div 
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.isEnd 
                        ? `${colorClasses[color]} text-white` 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No messages yet. Select a contact to start chatting.
            </div>
          )}
        </div>

        {/* Contacts panel */}
        <div 
          className={`absolute inset-0 bg-white dark:bg-[var(--color-card-bg-dark)] overflow-y-auto no-scrollbar transition-[transform,opacity] duration-300 ease-in-out ${
            showContacts ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[110%] opacity-0 pointer-events-none'
          }`}
        >
          <ul className="divide-y divide-gray-200 dark:divide-[var(--color-card-border-dark)]">
            {contacts.map((contact, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleContactSelect(contact)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{contact.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{contact.date}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{contact.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Card 
        title={title} 
        tools={tools}
        collapsible={collapsible}
        removable={removable}
        bodyClassName="p-0"
        footer={
          <div className="space-y-2">
            <form onSubmit={handleSendMessage}>
              <div className="flex">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type Message ..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className={`px-4 py-2 ${colorClasses[color]} text-white rounded-r-lg hover:opacity-90 transition-opacity`}
                >
                  Send
                </button>
              </div>
            </form>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleSeeAllMessages}
                className="w-full text-center py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline transition-colors"
              >
                See All Messages
              </button>
            )}
          </div>
        }
      >
        <ChatContent />
      </Card>

      {/* Chat Popup Overlay */}
      {showChatPopup && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity"
            onClick={() => setShowChatPopup(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-2xl bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <div className="flex items-center gap-3">
                  {selectedContact && (
                    <>
                      <img
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedContact.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact.lastMessage}</p>
                      </div>
                    </>
                  )}
                  {!selectedContact && (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">All Messages</h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatPopup(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Popup Body */}
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <ChatContent isPopup={true} />
              </div>

              {/* Popup Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <form onSubmit={handleSendMessage}>
                  <div className="flex">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type Message ..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className={`px-4 py-2 ${colorClasses[color]} text-white rounded-r-lg hover:opacity-90 transition-opacity`}
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

