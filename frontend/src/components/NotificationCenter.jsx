import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';

// Notification types and their styles
const NOTIFICATION_TYPES = {
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

// Global notification store (simple implementation)
let notificationListeners = [];
let notifications = [];

export const addNotification = (notification) => {
  const newNotif = {
    id: Date.now(),
    timestamp: new Date(),
    read: false,
    ...notification
  };
  notifications = [newNotif, ...notifications].slice(0, 50); // Keep last 50
  notificationListeners.forEach(listener => listener([...notifications]));
  
  // Auto-save to localStorage
  localStorage.setItem('notifications', JSON.stringify(notifications));
};

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      notifications = JSON.parse(saved);
      return notifications;
    }
    return [];
  });

  useEffect(() => {
    // Subscribe to notifications
    const listener = (updatedNotifs) => setNotifs(updatedNotifs);
    notificationListeners.push(listener);
    
    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener);
    };
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    setNotifs([...notifications]);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  };

  const clearAll = () => {
    notifications = [];
    setNotifs([]);
    localStorage.setItem('notifications', JSON.stringify([]));
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown - Positioned upwards from bottom-left */}
          <div className="absolute left-0 bottom-full mb-2 w-80 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-bottom-left animate-in fade-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifs.map(notif => {
                  const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.info;
                  const Icon = typeConfig.icon;
                  
                  return (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                        !notif.read ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-1.5 rounded-lg ${typeConfig.bg}`}>
                          <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">{notif.title}</p>
                          {notif.message && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.message}</p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-1">{formatTime(notif.timestamp)}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
