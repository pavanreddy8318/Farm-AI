/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'watering' | 'fertilizer' | 'maintenance' | 'general' | 'system';
  cropName?: string;
  timestamp: string;
  read: boolean;
}

export interface ActiveReminder {
  id: string;
  cropName: string;
  taskTitle: string;
  type: 'watering' | 'fertilizer' | 'maintenance';
  stageName: string;
  delaySeconds: number;
  triggerTime: string; // ISO string
}

interface NotificationContextType {
  notifications: AppNotification[];
  reminders: ActiveReminder[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  browserPermission: 'default' | 'granted' | 'denied';
  requestBrowserPermission: () => Promise<void>;
  addNotification: (title: string, message: string, type: AppNotification['type'], cropName?: string) => void;
  scheduleReminder: (
    cropName: string, 
    taskTitle: string, 
    type: ActiveReminder['type'], 
    stageName: string, 
    delaySeconds: number
  ) => void;
  cancelReminder: (id: string) => void;
  clearAllNotifications: () => void;
  markAllAsRead: () => void;
  activeToast: AppNotification | null;
  setActiveToast: (toast: AppNotification | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// dual-tone chime synthesizer
function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play pleasant high-quality dual tone chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
    osc2.frequency.exponentialRampToValueAtTime(392.00, ctx.currentTime + 0.15); // G4
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('[FarmAI Notifications] Web Audio playback blocked or failed:', err);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reminders, setReminders] = useState<ActiveReminder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserPermission, setBrowserPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Keep references to active timers so we can cancel them or run them
  const timerRefs = useRef<Record<string, any>>({});

  // Sync state with localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('farmai_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to parse saved notifications', e);
      }
    }

    const savedReminders = localStorage.getItem('farmai_reminders');
    if (savedReminders) {
      try {
        const parsed: ActiveReminder[] = JSON.parse(savedReminders);
        // Re-schedule outstanding reminders that are in the future
        const now = new Date();
        const active: ActiveReminder[] = [];

        parsed.forEach((rem) => {
          const triggerDate = new Date(rem.triggerTime);
          const remainingMs = triggerDate.getTime() - now.getTime();

          if (remainingMs > 0) {
            active.push(rem);
            // Setup timeout
            const timer = setTimeout(() => {
              triggerNotification(rem);
            }, remainingMs);
            timerRefs.current[rem.id] = timer;
          }
        });
        setReminders(active);
      } catch (e) {
        console.error('Failed to parse saved reminders', e);
      }
    }

    // Check browser notification permission safely
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission as any);
    }

    // Clean up all timeouts on unmount
    return () => {
      Object.values(timerRefs.current).forEach((timer: any) => clearTimeout(timer));
    };
  }, []);

  // Save updates to localStorage
  const saveNotifications = (newNotifs: AppNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('farmai_notifications', JSON.stringify(newNotifs));
  };

  const saveReminders = (newRems: ActiveReminder[]) => {
    setReminders(newRems);
    localStorage.setItem('farmai_reminders', JSON.stringify(newRems));
  };

  // Safe wrapper for requesting browser notification permission
  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('System browser notifications not supported in this client.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission as any);
    } catch (err) {
      console.warn('Failed to request notification permission in sandbox:', err);
    }
  };

  // Internal trigger helper
  const triggerNotification = (reminder: ActiveReminder) => {
    const title = `⚠️ Alarm: ${reminder.cropName}`;
    let message = '';
    
    if (reminder.type === 'watering') {
      message = `Time to execute Irrigation: ${reminder.taskTitle}`;
    } else if (reminder.type === 'fertilizer') {
      message = `Nutritional action needed: ${reminder.taskTitle}`;
    } else {
      message = `Maintenance required: ${reminder.taskTitle}`;
    }

    addNotification(title, message, reminder.type, reminder.cropName);

    // Remove from active list
    setReminders((prev) => {
      const updated = prev.filter((r) => r.id !== reminder.id);
      localStorage.setItem('farmai_reminders', JSON.stringify(updated));
      return updated;
    });

    if (timerRefs.current[reminder.id]) {
      delete timerRefs.current[reminder.id];
    }
  };

  // Trigger an immediate notification
  const addNotification = (title: string, message: string, type: AppNotification['type'], cropName?: string) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      type,
      cropName,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // 1. Play synthesize dual-tone chime if audio enabled
    if (soundEnabled) {
      playNotificationSound();
    }

    // 2. Browser native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Native notification trigger failed in iframe sandbox:', err);
      }
    }

    // 3. Set Active Toast for floating overlay slide-in alert
    setActiveToast(newNotif);

    // 4. Save to history
    saveNotifications([newNotif, ...notifications]);
  };

  // Schedule a future reminder
  const scheduleReminder = (
    cropName: string, 
    taskTitle: string, 
    type: ActiveReminder['type'], 
    stageName: string, 
    delaySeconds: number
  ) => {
    const id = `rem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const triggerTime = new Date(Date.now() + delaySeconds * 1000).toISOString();

    const newReminder: ActiveReminder = {
      id,
      cropName,
      taskTitle,
      type,
      stageName,
      delaySeconds,
      triggerTime,
    };

    // Cancel existing timer if exact same task already scheduled to prevent duplicate alerts
    const existing = reminders.find((r) => r.cropName === cropName && r.taskTitle === taskTitle && r.type === type);
    if (existing) {
      cancelReminder(existing.id);
    }

    // Set standard browser timeout
    const timer = setTimeout(() => {
      triggerNotification(newReminder);
    }, delaySeconds * 1000);

    timerRefs.current[id] = timer;
    saveReminders([...reminders.filter((r) => !(r.cropName === cropName && r.taskTitle === taskTitle && r.type === type)), newReminder]);
  };

  // Cancel a scheduled reminder
  const cancelReminder = (id: string) => {
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
    saveReminders(reminders.filter((r) => r.id !== id));
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        reminders,
        soundEnabled,
        setSoundEnabled,
        browserPermission,
        requestBrowserPermission,
        addNotification,
        scheduleReminder,
        cancelReminder,
        clearAllNotifications,
        markAllAsRead,
        activeToast,
        setActiveToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
