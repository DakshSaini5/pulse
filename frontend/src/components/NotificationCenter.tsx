import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Settings, Info, Activity, AlertCircle } from 'lucide-react';
import { notificationAPI, Notification } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [all, count] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount()
      ]);
      setNotifications(all);
      setUnreadCount(count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead({ stopPropagation: () => {} } as any, notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SYSTEM': return <Settings className="w-4 h-4 text-slate-500" />;
      case 'ALERT': return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'ANALYSIS': return <Activity className="w-4 h-4 text-primary" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-primary/5 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-wider flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs mt-1 font-light">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notification.isRead ? 'bg-primary/[0.02]' : ''}`}
                  >
                    <div className="shrink-0 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white shadow-sm border border-slate-200' : 'bg-slate-100'}`}>
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className={`text-sm truncate font-bold ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap mt-0.5 font-light">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${!notification.isRead ? 'text-slate-600' : 'text-slate-500 font-light'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button 
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 md:opacity-100 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
