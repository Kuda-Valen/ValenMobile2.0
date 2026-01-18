import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  addDoc, collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp, updateDoc,
  writeBatch
} from 'firebase/firestore';
// Added Storage imports for the Profile Picture fix
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { auth, db, VALEN_APP_ID } from '../services/firebase';
import { NotificationService } from '../services/NotificationService'; // Import added for the live session logic

// Notifications configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  currentPhase: 'Study' | 'Break';
  activeModuleId?: string;
  topic?: string;
  isPomodoro: boolean;
  initialDuration: number;
}

// Success State Interface (Updated to support Level Up and Badges)
interface SuccessState {
  visible: boolean;
  type: 'SESSION_COMPLETE' | 'RINGS_CLOSED' | 'LEVEL_UP';
  data?: any;
}

interface ValenContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  timerState: TimerState;
  tasks: any[];
  folders: any[];
  modules: any[];
  religiousActivities: any[];
  fitnessActivities: any[];
  financialData: { transactions: any[], goals: any[] };
  visions: any[];
  showSuccess: SuccessState;
  closeSuccessModal: () => void;
  startFocusSession: (moduleId?: string) => void; 
  pauseFocusSession: () => void;
  stopFocusSession: () => void;
  stopAndSaveSession: (summary?: string) => Promise<void>;
  resetTimer: () => void;
  setTimerConfig: (isPomodoro: boolean, minutes: number) => void;
  setSessionTopic: (topic: string) => void;
  selectModule: (moduleId: string) => void;
  addTask: (taskData: any) => Promise<void>;
  addFolder: (name: string, icon: string) => Promise<void>;
  addModule: (moduleData: any) => Promise<void>;
  addReligiousActivity: (activity: any) => Promise<void>;
  deleteReligiousActivity: (id: string) => Promise<void>;
  addFitnessActivity: (activity: any) => Promise<void>;
  deleteFitnessActivity: (id: string) => Promise<void>;
  addTransaction: (data: any) => Promise<void>;
  addFinancialGoal: (data: any) => Promise<void>;
  deleteFinancialItem: (id: string, type: 'transactions' | 'goals') => Promise<void>;
  updateGoalProgress: (goalId: string, amount: number) => Promise<void>;
  addVision: (visionData: any) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;
  updateVisionProgress: (id: string, progress: number) => Promise<void>;
  toggleTaskCompletion: (taskId: string, currentStatus: boolean) => Promise<void>;
  toggleFaithCompletion: (id: string, currentStatus: boolean) => Promise<void>;
  toggleFitnessCompletion: (id: string, currentStatus: boolean) => Promise<void>;
  resetModuleDailyStatus: (moduleId: string) => Promise<void>;
  updateModuleSchedule: (moduleId: string, schedule: any) => Promise<void>;
  updateProfile: (data: any, imageUri?: string) => Promise<void>; // Added to interface
  logout: () => Promise<void>;
}

const ValenContext = createContext<ValenContextType | undefined>(undefined);

export const ValenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [religiousActivities, setReligiousActivities] = useState<any[]>([]);
  const [fitnessActivities, setFitnessActivities] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<{ transactions: any[], goals: any[] }>({ transactions: [], goals: [] });
  const [visions, setVisions] = useState<any[]>([]);

  // Gamification State
  const [showSuccess, setShowSuccess] = useState<SuccessState>({ visible: false, type: 'SESSION_COMPLETE' });

  const [timerState, setTimerState] = useState<TimerState>({
    timeRemaining: 1500,
    isRunning: false,
    currentPhase: 'Study',
    isPomodoro: true,
    initialDuration: 1500,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const closeSuccessModal = () => setShowSuccess({ ...showSuccess, visible: false });

  // --- NEW: UPDATE PROFILE FUNCTION ---
  const updateProfile = async (updateData: any, imageUri?: string) => {
    if (!user) return;
    try {
      let photoURL = profile?.photoURL || '';

      // Handle Image Upload to Firebase Storage
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storage = getStorage();
        const storageRef = ref(storage, `users/${user.uid}/profile_pic_${Date.now()}`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }

      const profRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
      await updateDoc(profRef, { 
        ...updateData, 
        photoURL,
        updatedAt: serverTimestamp() 
      });
    } catch (e) {
      console.error("Valen Core Error: Profile update failed: ", e);
      throw e;
    }
  };

  // --- NEW: BADGE CHECKER LOGIC ---
  const checkAndAwardBadges = async (stats: any, currentBadges: string[] = []) => {
    const newBadges = [...currentBadges];
    let earnedNew = false;

    // Deep Diver: Session > 120 mins
    if (stats.lastSessionMins >= 120 && !newBadges.includes('deep_diver')) {
      newBadges.push('deep_diver');
      earnedNew = true;
    }

    // Monk Mode: Daily Focus > 300 mins
    if (stats.dailyFocusMins >= 300 && !newBadges.includes('monk_mode')) {
      newBadges.push('monk_mode');
      earnedNew = true;
    }

    // Midnight Scholar: Focus between 12 AM and 4 AM
    const hour = new Date().getHours();
    if (hour >= 0 && hour <= 4 && !newBadges.includes('midnight_scholar')) {
      newBadges.push('midnight_scholar');
      earnedNew = true;
    }

    if (earnedNew && user) {
      const profRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
      await updateDoc(profRef, { badges: newBadges });
      return true;
    }
    return false;
  };

  // --- MIDNIGHT RESET & NEURAL CONTEXT GENERATOR ---
  const checkDailyReset = async (currentUser: User, currentProfile: any) => {
    if (!currentProfile?.lastResetDate) return;

    const today = new Date().toISOString().split('T')[0];
    const lastReset = currentProfile.lastResetDate;

    if (lastReset !== today) {
      console.log("Valen Core: Synthesizing Daily Neural Context...");
      const batch = writeBatch(db);
      const profileRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', currentUser.uid, 'profile', 'data');
      const snapshotCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', currentUser.uid, 'daily_snapshots');

      try {
        const totalHabits = religiousActivities.length + fitnessActivities.length;
        const completedHabits = religiousActivities.filter(a => a.completed).length + fitnessActivities.filter(a => a.completed).length;
        const disciplineScore = totalHabits > 0 ? (completedHabits / totalHabits) : 0;
        const focusMins = currentProfile?.dailyFocusMinutes || 0;

        const disciplineStatus = disciplineScore >= 0.8 ? "High Discipline" : disciplineScore > 0.4 ? "Moderate Discipline" : "Low Discipline";
        const focusStatus = focusMins >= 120 ? "Deep Academic Volume" : focusMins > 30 ? "Light Focus" : "Negligible Focus";
        
        const neuralSummary = `USER_SESSION_REPORT: Date ${lastReset}. Focus: ${focusMins}m (${focusStatus}). Disciplines: ${completedHabits}/${totalHabits} (${disciplineStatus}). Overall Performance: ${currentProfile.archetype || 'The Novice'}.`;
        
        const snapshotRef = doc(snapshotCol, lastReset);
        batch.set(snapshotRef, {
            date: lastReset,
            focusMinutes: focusMins,
            disciplineScore: disciplineScore,
            neuralContext: neuralSummary,
            archetypeAtTime: currentProfile?.archetype || 'The Novice',
            timestamp: serverTimestamp()
        });

        batch.update(profileRef, {
            dailyFocusMinutes: 0,
            lastResetDate: today
        });

        religiousActivities.forEach(act => {
            const ref = doc(db, 'artifacts', VALEN_APP_ID, 'users', currentUser.uid, 'religious', act.id);
            batch.update(ref, { completed: false });
        });
        fitnessActivities.forEach(act => {
            const ref = doc(db, 'artifacts', VALEN_APP_ID, 'users', currentUser.uid, 'fitness', act.id);
            batch.update(ref, { completed: false });
        });

        await batch.commit();
        console.log("Valen Core: Daily Reset Complete. Context Archived.");
      } catch (e) {
        console.error("Valen Core Error: Reset failed: ", e);
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null); setTasks([]); setFolders([]); setModules([]);
        setReligiousActivities([]); setFitnessActivities([]);
        setFinancialData({ transactions: [], goals: [] }); setVisions([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const profileDoc = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDoc, (snap) => {
      if (snap.exists()) {
          const data = snap.data();
          // Ensure UID is injected into profile state for the ID Card
          setProfile({ ...data, uid: user.uid });
          checkDailyReset(user, data); 
      }
      setLoading(false);
    });

    const taskCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(taskCol, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const folderCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'folders');
    const unsubFolders = onSnapshot(folderCol, (snap) => {
      const folderList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (folderList.length === 0) {
        const defaults = [{ name: 'School', icon: 'book' }, { name: 'Personal', icon: 'person' }, { name: 'Work', icon: 'briefcase' }];
        defaults.forEach(f => addFolder(f.name, f.icon));
      } else {
        setFolders(folderList);
      }
    });

    const moduleCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules');
    const unsubModules = onSnapshot(moduleCol, (snap) => {
      setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const religiousCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious');
    const unsubReligious = onSnapshot(query(religiousCol, orderBy('createdAt', 'desc')), (snap) => {
      setReligiousActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fitnessCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness');
    const unsubFitness = onSnapshot(query(fitnessCol, orderBy('createdAt', 'desc')), (snap) => {
      setFitnessActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const basePath = ['artifacts', VALEN_APP_ID, 'users', user.uid];
    const unsubTrans = onSnapshot(query(collection(db, ...basePath, 'transactions'), orderBy('createdAt', 'desc')), (snap) => {
      const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFinancialData(prev => ({ ...prev, transactions }));
    });

    const unsubGoals = onSnapshot(collection(db, ...basePath, 'fin_goals'), (snap) => {
      const goals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFinancialData(prev => ({ ...prev, goals }));
    });

    const visionsCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'visions');
    const unsubVisions = onSnapshot(query(visionsCol, orderBy('createdAt', 'desc')), (snap) => {
      setVisions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubProfile(); unsubTasks(); unsubFolders(); unsubModules(); unsubReligious();
      unsubFitness(); unsubTrans(); unsubGoals(); unsubVisions();
    };
  }, [user]);

  const addFolder = async (name: string, icon: string) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'folders'), { name, icon, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const addModule = async (moduleData: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules'), { ...moduleData, currentGrade: 0, hoursDone: 0, schedule: [], createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const addTask = async (taskData: any) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks'), { ...taskData, completed: false, createdAt: serverTimestamp() });
  };

  const addReligiousActivity = async (activity: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious'), { ...activity, createdAt: serverTimestamp(), completed: false }); } catch (e) { console.error(e); }
  };

  const deleteReligiousActivity = async (id: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious', id)); } catch (e) { console.error(e); }
  };

  const addFitnessActivity = async (activity: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness'), { ...activity, createdAt: serverTimestamp(), completed: false }); } catch (e) { console.error(e); }
  };

  const deleteFitnessActivity = async (id: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness', id)); } catch (e) { console.error(e); }
  };

  const addTransaction = async (data: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'transactions'), { ...data, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const addFinancialGoal = async (data: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fin_goals'), { ...data, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const deleteFinancialItem = async (id: string, type: 'transactions' | 'goals') => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, type === 'transactions' ? 'transactions' : 'fin_goals', id)); } catch (e) { console.error(e); }
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    if (!user) return;
    try { await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fin_goals', goalId), { current: increment(amount) }); } catch (e) { console.error(e); }
  };

  const addVision = async (data: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'visions'), { ...data, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const deleteVision = async (id: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'visions', id)); } catch (e) { console.error(e); }
  };

  const updateVisionProgress = async (id: string, progress: number) => {
    if (!user) return;
    try { await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'visions', id), { progress }); } catch (e) { console.error(e); }
  };

  const updateModuleSchedule = async (moduleId: string, schedule: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', moduleId), { schedule });
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks', taskId), { completed: !currentStatus, updatedAt: serverTimestamp() });
  };

  const toggleFaithCompletion = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious', id), { completed: !currentStatus });
  };

  const toggleFitnessCompletion = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness', id), { completed: !currentStatus });
  };

  const resetModuleDailyStatus = async (moduleId: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', moduleId), { completedToday: false });
  };

  const selectModule = (moduleId: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState(prev => ({ ...prev, isRunning: false, currentPhase: 'Study', activeModuleId: moduleId, timeRemaining: prev.initialDuration }));
  };

  const setTimerConfig = (isPomodoro: boolean, minutes: number) => {
    setTimerState(prev => ({ ...prev, isPomodoro, currentPhase: 'Study', timeRemaining: minutes * 60, initialDuration: minutes * 60 }));
  };

  const setSessionTopic = (topic: string) => { setTimerState(prev => ({ ...prev, topic })); };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState(prev => ({ ...prev, isRunning: false, currentPhase: 'Study', timeRemaining: prev.initialDuration }));
  };

  const startFocusSession = (moduleId?: string) => {
    setTimerState((prev) => {
      const isRunning = true;
      const activeId = moduleId || prev.activeModuleId;
      
      // Trigger the notification service
      const activeMod = modules.find(m => m.id === activeId);
      NotificationService.startLiveSessionNotification(
          activeMod?.name || 'Session',
          Math.floor(prev.timeRemaining / 60),
          prev.currentPhase === 'Break'
      );

      return { ...prev, isRunning, activeModuleId: activeId };
    });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timerRef.current!);
          if (prev.currentPhase === 'Study') {
            if (Platform.OS !== 'web') { Notifications.scheduleNotificationAsync({ content: { title: "Study Session Complete! ☕️", body: "Time for a 5-minute break. Great work!", sound: true }, trigger: null }); }
            handleSessionEnd(prev);
            return { ...prev, isRunning: true, currentPhase: 'Break', timeRemaining: 300, initialDuration: 300 };
          } else {
            if (Platform.OS !== 'web') { Notifications.scheduleNotificationAsync({ content: { title: "Break Over! 🧠", body: "Ready for another round of focus?", sound: true }, trigger: null }); }
            return { ...prev, isRunning: false, timeRemaining: 0 };
          }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  const stopAndSaveSession = async (summary?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalState = { ...timerState };
    setTimerState(prev => ({ ...prev, isRunning: false, activeModuleId: undefined }));
    await handleSessionEnd(finalState, summary);
  };

  const handleSessionEnd = async (finalState: TimerState, summary?: string) => {
    if (!user || !finalState.activeModuleId || finalState.currentPhase === 'Break') return;
    const secondsSpent = finalState.initialDuration - finalState.timeRemaining;
    const sessionMins = Math.round(secondsSpent / 60);
    if (secondsSpent < 5) return;
    
    try {
      const modRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', finalState.activeModuleId);
      const profRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
      
      const gainedXP = (sessionMins * 10) + 50;
      const currentXP = profile?.xp || 0;
      const currentLevel = profile?.level || 1;
      const newXP = currentXP + gainedXP;
      const nextLevelThreshold = currentLevel * 1000;
      let newLevel = currentLevel;
      let leveledUp = false;

      if (newXP >= nextLevelThreshold) {
        newLevel += 1;
        leveledUp = true;
      }

      await updateDoc(modRef, { hoursDone: increment(secondsSpent / 3600), completedToday: true });
      await updateDoc(profRef, { 
        dailyFocusMinutes: increment(sessionMins),
        xp: newXP,
        level: newLevel,
        totalFocusHours: increment(secondsSpent / 3600)
      });
      
      await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'focus_history'), { 
        moduleId: finalState.activeModuleId, 
        topic: finalState.topic || 'General Study', 
        summary: summary || '', 
        durationSeconds: secondsSpent, 
        xpEarned: gainedXP,
        timestamp: serverTimestamp() 
      });

      const earnedBadge = await checkAndAwardBadges(
        { lastSessionMins: sessionMins, dailyFocusMins: (profile?.dailyFocusMinutes || 0) + sessionMins },
        profile?.badges || []
      );

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const academicGoal = 240; 
      const totalHabits = religiousActivities.length + fitnessActivities.length;
      const completedHabits = religiousActivities.filter(a => a.completed).length + fitnessActivities.filter(a => a.completed).length;

      if (leveledUp) {
        setShowSuccess({ visible: true, type: 'LEVEL_UP', data: { newLevel, xpGained: gainedXP } });
      } else if ((profile?.dailyFocusMinutes || 0) + sessionMins >= academicGoal && completedHabits === totalHabits && totalHabits > 0) {
        setShowSuccess({ visible: true, type: 'RINGS_CLOSED', data: { xpGained: gainedXP } });
      } else {
        setShowSuccess({ 
          visible: true, 
          type: 'SESSION_COMPLETE', 
          data: { 
            minutes: sessionMins, 
            topic: finalState.topic || 'General Study', 
            xpGained: gainedXP,
            badgeEarned: earnedBadge 
          } 
        });
      }

    } catch (e) { console.error(e); }
  };

  const pauseFocusSession = () => { if (timerRef.current) clearInterval(timerRef.current); setTimerState(prev => ({ ...prev, isRunning: false })); };
  const stopFocusSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    NotificationService.stopLiveSessionNotification(); // Stop notifications
    setTimerState(prev => ({ ...prev, isRunning: false, currentPhase: 'Study', timeRemaining: prev.initialDuration, activeModuleId: undefined }));
  };

  const logout = () => auth.signOut();

  return (
    <ValenContext.Provider value={{ 
      user, profile, loading, timerState, tasks, folders, modules, religiousActivities, fitnessActivities, financialData, visions,
      showSuccess, closeSuccessModal,
      startFocusSession, pauseFocusSession, stopFocusSession, stopAndSaveSession, resetTimer, setTimerConfig, setSessionTopic, selectModule,
      addTask, addFolder, addModule, addReligiousActivity, deleteReligiousActivity, addFitnessActivity, deleteFitnessActivity,
      addTransaction, addFinancialGoal, deleteFinancialItem, updateGoalProgress,
      addVision, deleteVision, updateVisionProgress, toggleTaskCompletion, 
      toggleFaithCompletion, toggleFitnessCompletion, resetModuleDailyStatus, updateModuleSchedule, 
      updateProfile, // Exported to provider
      logout 
    }}>
      {children}
    </ValenContext.Provider>
  );
};

export const useValen = () => {
  const context = useContext(ValenContext);
  if (!context) throw new Error("useValen must be used within a provider");
  return context;
};
 

