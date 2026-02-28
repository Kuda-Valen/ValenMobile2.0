import * as Notifications from 'expo-notifications';

export const NotificationService = {
  // 1. Setup Permissions
  requestPermissions: async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
    return status === 'granted';
  },

  // 2. Schedule Task Deadlines
  scheduleTaskReminder: async (taskId: string, title: string, date: Date) => {
    // SURGICAL FIX: Using string 'date' instead of Enum to prevent "undefined" crash
    await Notifications.scheduleNotificationAsync({
      identifier: taskId,
      content: {
        title: "Task Due ⚠️",
        body: `Objective: ${title}. It's time to archive this task.`,
        sound: 'default',
        data: { screen: 'Tasks' },
      },
      trigger: {
        type: 'date',
        date: date,
      } as any,
    });
  },

  // 3. Daily Morning Briefing
  scheduleMorningBriefing: async (userName: string, hour: number = 7) => {
    await Notifications.cancelScheduledNotificationAsync('morning_brief');

    await Notifications.scheduleNotificationAsync({
      identifier: 'morning_brief',
      content: {
        title: `Good morning, ${userName}! ☀️`,
        body: "Your daily agenda is ready. Open Valen to review your trajectory.",
        sound: 'default',
      },
      trigger: {
        type: 'daily',
        hour,
        minute: 0,
      } as any,
    });
  },

  // 4. Academic Persistence Nudge
  scheduleAcademicNudge: async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Academic Momentum 📚",
        body: "You haven't initiated a focus block today. Shall we start with 25 minutes?",
        sound: 'default',
      },
      trigger: {
        type: 'daily',
        hour: 14, // 2 PM
        minute: 0,
      } as any,
    });
  },

  // 5. Cancel Specific Notification
  cancelNotification: async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  // 6. Immediate Alert (for Timers)
  sendImmediateAlert: async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null, // null is still valid for immediate delivery
    });
  },

  // 7. Academic Session Active (Persistent Notification)
  startLiveSessionNotification: async (moduleName: string, minutesRemaining: number, isBreak: boolean) => {
    await Notifications.cancelScheduledNotificationAsync('active_session');
    await Notifications.cancelScheduledNotificationAsync('session_completion_alert');

    const title = isBreak ? "Mind Recharge Active ☕️" : "Deep Work Protocol 🧠";
    const bodyText = isBreak ? `Enjoying your break from ${moduleName}.` : `Focusing on ${moduleName}.`;

    // 1. Send immediate notification
    await Notifications.scheduleNotificationAsync({
      identifier: 'active_session',
      content: {
        title,
        body: `${bodyText} Ends in ${minutesRemaining} minutes.`,
        sticky: true, 
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    // 2. Schedule completion alert
    const seconds = Math.max(minutesRemaining * 60, 1);

    await Notifications.scheduleNotificationAsync({
      identifier: 'session_completion_alert',
      content: {
        title: isBreak ? "Break Over! ⚡️" : "Session Complete! 🏆",
        body: isBreak ? "Ready to initiate the next focus block?" : "Great work. Time for a 5-minute recharge.",
        sound: 'default',
        vibrate: [0, 250, 250, 250],
      },
      trigger: { 
        type: 'timeInterval',
        seconds: seconds,
        repeats: false 
      } as any,
    });
  },

  stopLiveSessionNotification: async () => {
    await Notifications.cancelScheduledNotificationAsync('active_session');
    await Notifications.cancelScheduledNotificationAsync('session_completion_alert');
  }
};