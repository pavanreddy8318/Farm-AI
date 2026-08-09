/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, BellRing, X, Volume2, VolumeX, Clock, Trash, 
  Settings, Check, Droplets, Info, Sparkles, CheckSquare, ShieldCheck, Leaf
} from 'lucide-react';
import { useNotifications, AppNotification } from '../context/NotificationContext';

export default function NotificationCenter() {
  const {
    notifications,
    reminders,
    soundEnabled,
    setSoundEnabled,
    browserPermission,
    requestBrowserPermission,
    clearAllNotifications,
    markAllAsRead,
    cancelReminder,
    addNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTestNotification = () => {
    addNotification(
      '💡 Demo Pathology Notification',
      'This is a simulated quick alert reminding you to check tomato foliage for early blight nodes.',
      'general',
      'Tomato'
    );
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'watering':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'fertilizer':
        return <Info className="w-4 h-4 text-emerald-600" />;
      case 'maintenance':
        return <Leaf className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-editorial-sage" />;
    }
  };

  return (
    <div id="notification-center-root" className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="notification-bell-btn"
        className={`relative p-2.5 rounded-none border transition-all ${
          isOpen 
            ? 'bg-editorial-dark border-editorial-dark text-white' 
            : 'bg-white border-editorial-border text-editorial-dark hover:bg-editorial-sand/40'
        }`}
        title="Farming Alarm Center"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
        ) : (
          <Bell className="w-4.5 h-4.5" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[8px] font-sans font-extrabold px-1.5 py-0.5 rounded-none border border-white uppercase tracking-wider shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Main Dropdown Panel */}
      {isOpen && (
        <div 
          id="notification-dropdown-panel" 
          className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-editorial-border shadow-lg z-50 p-4 space-y-4 animate-fade-in text-editorial-dark"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-editorial-border/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm text-editorial-dark">Farm Alarm Console</span>
              {unreadCount > 0 && (
                <span className="text-[8px] font-sans font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[9px] font-sans font-bold uppercase tracking-wider text-editorial-sage hover:text-editorial-dark underline decoration-dotted"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-editorial-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preferences and Config bar */}
          <div className="bg-editorial-sand/35 border border-editorial-border/40 p-2.5 space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="font-sans font-bold uppercase tracking-wider text-editorial-sage">Alert Sounds</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 flex items-center gap-1 font-sans font-bold uppercase tracking-wider text-[9px] border px-2 ${
                  soundEnabled 
                    ? 'bg-editorial-forest/10 border-editorial-forest text-editorial-forest' 
                    : 'bg-neutral-50 border-neutral-300 text-neutral-400'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> Enabled
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" /> Muted
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-sans font-bold uppercase tracking-wider text-editorial-sage">Browser System Alerts</span>
                <span className="text-[8px] text-neutral-400 font-serif leading-none mt-0.5">
                  Permission: {browserPermission}
                </span>
              </div>
              {browserPermission !== 'granted' ? (
                <button
                  onClick={requestBrowserPermission}
                  className="px-2 py-0.5 text-[9px] font-sans font-bold bg-white hover:bg-neutral-50 text-editorial-dark border border-editorial-border uppercase tracking-wider"
                >
                  Request Permission
                </button>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-700 font-sans font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3" /> Activated
                </span>
              )}
            </div>
          </div>

          {/* Tabular Lists: Reminders & Notifications */}
          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {/* 1. Pending Scheduled Reminders */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-editorial-sage block border-b border-editorial-border/30 pb-0.5">
                Upcoming Alarms ({reminders.length})
              </span>
              {reminders.length === 0 ? (
                <p className="text-[10px] text-neutral-400 font-serif italic py-1">
                  No active crop tasks scheduled. Click "Schedule Alarm" next to any calendar stage to try.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {reminders.map((rem) => {
                    const triggerDate = new Date(rem.triggerTime);
                    const secondsLeft = Math.max(0, Math.round((triggerDate.getTime() - Date.now()) / 1000));
                    return (
                      <div 
                        key={rem.id} 
                        className="p-2 border border-editorial-border/60 bg-white hover:border-editorial-dark flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] uppercase tracking-wider bg-editorial-sand text-editorial-dark px-1.5 font-sans font-extrabold">
                              {rem.cropName}
                            </span>
                            <span className="text-[8px] uppercase font-mono text-editorial-sage">
                              {rem.type}
                            </span>
                          </div>
                          <p className="font-serif font-bold text-xs truncate leading-tight text-editorial-dark">
                            {rem.taskTitle}
                          </p>
                          <div className="flex items-center gap-1 text-[8px] text-neutral-400 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            Triggering in {secondsLeft} seconds
                          </div>
                        </div>
                        <button
                          onClick={() => cancelReminder(rem.id)}
                          className="p-1 hover:bg-rose-50 text-rose-700 border border-transparent hover:border-rose-100 transition-all flex-shrink-0"
                          title="Cancel Alarm"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Notification History */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between border-b border-editorial-border/30 pb-0.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-editorial-sage">
                  Farming Log History ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[8px] font-sans font-bold uppercase tracking-wider text-rose-700 hover:underline"
                  >
                    Clear history
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-[10px] text-neutral-400 font-serif italic py-3 text-center">
                  Your foliage and watering logs are pristine and clear.
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-2.5 border text-xs transition-colors relative flex gap-2 ${
                        notif.read 
                          ? 'border-editorial-border/45 bg-neutral-50/50 text-neutral-500' 
                          : 'border-editorial-sage/80 bg-editorial-sand/15 text-editorial-dark font-medium'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-editorial-sage">
                            {notif.cropName || 'FarmAI'}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-400">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-xs leading-snug">
                          {notif.title}
                        </h5>
                        <p className="font-serif text-[11px] leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Trigger Bypass */}
          <div className="border-t border-editorial-border/60 pt-3">
            <button
              onClick={handleTestNotification}
              id="notification-test-trigger-btn"
              className="w-full py-2 bg-editorial-sand hover:bg-editorial-sand/85 border border-editorial-border text-editorial-dark text-[9px] font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-editorial-sage" /> Trigger Test Notification Instantly
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Global floating slide-in toast renderer
export function NotificationToast() {
  const { activeToast, setActiveToast } = useNotifications();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div 
      id="notification-toast-overlay" 
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-editorial-dark text-white border border-neutral-700/60 p-4.5 shadow-xl transition-all duration-300 animate-slide-in flex gap-3"
    >
      <div className="w-9 h-9 rounded-none bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0 mt-0.5">
        <Bell className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-sans font-bold uppercase tracking-[0.2em] text-editorial-cream/70">
            {activeToast.cropName ? `${activeToast.cropName} Advisory` : 'Farming Alert'}
          </span>
          <button 
            onClick={() => setActiveToast(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <h4 className="font-serif font-bold text-sm text-white leading-snug">
          {activeToast.title}
        </h4>
        <p className="text-[11px] text-neutral-300 leading-relaxed font-serif">
          {activeToast.message}
        </p>
      </div>
    </div>
  );
}
