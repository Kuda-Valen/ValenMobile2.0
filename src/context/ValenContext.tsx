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
  serverTimestamp, updateDoc
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { auth, db, VALEN_APP_ID } from '../services/firebase';

// Configure notifications to show when app is in foreground
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

  const [timerState, setTimerState] = useState<TimerState>({
    timeRemaining: 1500,
    isRunning: false,
    currentPhase: 'Study',
    isPomodoro: true,
    initialDuration: 1500,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        setProfile(null);
        setTasks([]);
        setFolders([]);
        setModules([]);
        setReligiousActivities([]);
        setFitnessActivities([]);
        setFinancialData({ transactions: [], goals: [] });
        setVisions([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const profileDoc = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDoc, (snap) => {
      if (snap.exists()) setProfile(snap.data());
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
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious'), { ...activity, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
  };

  const deleteReligiousActivity = async (id: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious', id)); } catch (e) { console.error(e); }
  };

  const addFitnessActivity = async (activity: any) => {
    if (!user) return;
    try { await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness'), { ...activity, createdAt: serverTimestamp() }); } catch (e) { console.error(e); }
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

  // --- TIMER LOGIC ---
  const selectModule = (moduleId: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      currentPhase: 'Study',
      activeModuleId: moduleId,
      timeRemaining: prev.initialDuration
    }));
  };

  const setTimerConfig = (isPomodoro: boolean, minutes: number) => {
    setTimerState(prev => ({ 
      ...prev, 
      isPomodoro, 
      currentPhase: 'Study',
      timeRemaining: minutes * 60, 
      initialDuration: minutes * 60 
    }));
  };

  const setSessionTopic = (topic: string) => {
    setTimerState(prev => ({ ...prev, topic }));
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    // If resetting from a break, go back to study
    setTimerState(prev => ({ 
      ...prev, 
      isRunning: false, 
      currentPhase: 'Study',
      timeRemaining: prev.initialDuration 
    }));
  };

  const startFocusSession = (moduleId?: string) => {
    setTimerState((prev) => ({ 
      ...prev, 
      isRunning: true, 
      activeModuleId: moduleId || prev.activeModuleId 
    }));
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timerRef.current!);
          
          if (prev.currentPhase === 'Study') {
            // Study ended -> Auto transition to Break
            if (Platform.OS !== 'web') {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: "Study Session Complete! ☕️",
                  body: "Time for a 5-minute break. Great work!",
                  sound: true,
                },
                trigger: null,
              });
            }
            handleSessionEnd(prev);
            return { 
                ...prev, 
                isRunning: true, // Auto-start the break
                currentPhase: 'Break', 
                timeRemaining: 300, // 5 minute break
                initialDuration: 300 
            };
          } else {
            // Break ended
            if (Platform.OS !== 'web') {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: "Break Over! 🧠",
                  body: "Ready for another round of focus?",
                  sound: true,
                },
                trigger: null,
              });
            }
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
    if (secondsSpent < 5) return;

    try {
      const modRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', finalState.activeModuleId);
      const profRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
      
      await updateDoc(modRef, { hoursDone: increment(secondsSpent / 3600), completedToday: true });
      await updateDoc(profRef, { dailyFocusMinutes: increment(secondsSpent / 60) });

      await addDoc(collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'focus_history'), {
        moduleId: finalState.activeModuleId,
        topic: finalState.topic || 'General Study',
        summary: summary || '',
        durationSeconds: secondsSpent,
        timestamp: serverTimestamp()
      });

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { console.error(e); }
  };

  const pauseFocusSession = () => { if (timerRef.current) clearInterval(timerRef.current); setTimerState(prev => ({ ...prev, isRunning: false })); };
  const stopFocusSession = () => { if (timerRef.current) clearInterval(timerRef.current); setTimerState(prev => ({ ...prev, isRunning: false, currentPhase: 'Study', timeRemaining: prev.initialDuration, activeModuleId: undefined })); };

  const logout = () => auth.signOut();

  return (
    <ValenContext.Provider value={{ 
      user, profile, loading, timerState, tasks, folders, modules, religiousActivities, fitnessActivities, financialData, visions,
      startFocusSession, pauseFocusSession, stopFocusSession, stopAndSaveSession, resetTimer, setTimerConfig, setSessionTopic, selectModule,
      addTask, addFolder, addModule, addReligiousActivity, deleteReligiousActivity, addFitnessActivity, deleteFitnessActivity,
      addTransaction, addFinancialGoal, deleteFinancialItem, updateGoalProgress,
      addVision, deleteVision, updateVisionProgress, toggleTaskCompletion, 
      toggleFaithCompletion, toggleFitnessCompletion, resetModuleDailyStatus, updateModuleSchedule, logout 
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