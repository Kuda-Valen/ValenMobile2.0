import * as Haptics from 'expo-haptics';
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
import { Alert, Platform } from 'react-native';
import { auth, db, VALEN_APP_ID } from '../services/firebase';

interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  currentPhase: 'Study' | 'Break';
  activeModuleId?: string;
  topic?: string;
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
  fitnessActivities: any[]; // NEW
  startFocusSession: (config: { duration: number, moduleId?: string, topic?: string }) => void;
  pauseFocusSession: () => void;
  stopFocusSession: () => void;
  addTask: (taskData: any) => Promise<void>;
  addFolder: (name: string, icon: string) => Promise<void>;
  addModule: (moduleData: any) => Promise<void>;
  addReligiousActivity: (activity: any) => Promise<void>;
  deleteReligiousActivity: (id: string) => Promise<void>;
  addFitnessActivity: (activity: any) => Promise<void>; // NEW
  deleteFitnessActivity: (id: string) => Promise<void>; // NEW
  toggleTaskCompletion: (taskId: string, currentStatus: boolean) => Promise<void>;
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
  const [fitnessActivities, setFitnessActivities] = useState<any[]>([]); // NEW

  const [timerState, setTimerState] = useState<TimerState>({
    timeRemaining: 1500,
    isRunning: false,
    currentPhase: 'Study',
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setTasks([]);
        setFolders([]);
        setModules([]);
        setReligiousActivities([]);
        setFitnessActivities([]); // Reset NEW
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // 1. Profile Listener
    const profileDoc = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDoc, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });

    // 2. Tasks Listener
    const taskCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(taskCol, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Folders Listener
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

    // 4. Modules Listener
    const moduleCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules');
    const unsubModules = onSnapshot(moduleCol, (snap) => {
      setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Faith/Religious Listener
    const religiousCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious');
    const religiousQuery = query(religiousCol, orderBy('createdAt', 'desc'));
    const unsubReligious = onSnapshot(religiousQuery, (snap) => {
      setReligiousActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 6. Fitness Listener (NEW)
    const fitnessCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness');
    const fitnessQuery = query(fitnessCol, orderBy('createdAt', 'desc'));
    const unsubFitness = onSnapshot(fitnessQuery, (snap) => {
      setFitnessActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubProfile(); 
      unsubTasks(); 
      unsubFolders(); 
      unsubModules(); 
      unsubReligious();
      unsubFitness(); // NEW
    };
  }, [user]);

  // --- ACTIONS ---

  const addFolder = async (name: string, icon: string) => {
    if (!user) return;
    try {
      const folderCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'folders');
      await addDoc(folderCol, { name, icon, createdAt: serverTimestamp() });
    } catch (e) { console.error(e); }
  };

  const addModule = async (moduleData: any) => {
    if (!user) return;
    try {
      const moduleCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules');
      await addDoc(moduleCol, { 
        ...moduleData, 
        currentGrade: 0, 
        hoursDone: 0, 
        schedule: [], 
        createdAt: serverTimestamp() 
      });
    } catch (e) { console.error(e); }
  };

  const addTask = async (taskData: any) => {
    if (!user) return;
    const taskCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks');
    await addDoc(taskCol, { ...taskData, completed: false, createdAt: serverTimestamp() });
  };

  const addReligiousActivity = async (activity: any) => {
    if (!user) return;
    try {
      const col = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious');
      await addDoc(col, { ...activity, createdAt: serverTimestamp() });
    } catch (e) { console.error(e); }
  };

  const deleteReligiousActivity = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'religious', id);
      await deleteDoc(docRef);
    } catch (e) { console.error(e); }
  };

  // NEW: Add Fitness Activity
  const addFitnessActivity = async (activity: any) => {
    if (!user) return;
    try {
      const col = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness');
      await addDoc(col, { ...activity, createdAt: serverTimestamp() });
    } catch (e) { console.error(e); }
  };

  // NEW: Delete Fitness Activity
  const deleteFitnessActivity = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'fitness', id);
      await deleteDoc(docRef);
    } catch (e) { console.error(e); }
  };

  const updateModuleSchedule = async (moduleId: string, schedule: any) => {
    if (!user) return;
    const modRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', moduleId);
    await updateDoc(modRef, { schedule });
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    const taskRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks', taskId);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDoc(taskRef, { completed: !currentStatus, updatedAt: serverTimestamp() });
  };

  // --- TIMER LOGIC ---

  const startFocusSession = (config: { duration: number, moduleId?: string, topic?: string }) => {
    setTimerState((prev) => ({ 
      ...prev, 
      isRunning: true, 
      timeRemaining: config.duration * 60,
      activeModuleId: config.moduleId,
      topic: config.topic 
    }));
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeRemaining <= 0) {
          clearInterval(timerRef.current!);
          handleSessionEnd(prev);
          return { ...prev, isRunning: false, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  const handleSessionEnd = async (finalState: TimerState) => {
    if (!user || !finalState.activeModuleId) return;
    const modRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'modules', finalState.activeModuleId);
    const profRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
    
    await updateDoc(modRef, { hoursDone: increment(0.42) }); 
    await updateDoc(profRef, { dailyFocusMinutes: increment(25) });
    
    Alert.alert("Session Complete", "You just moved your focus ring!");
  };

  const pauseFocusSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  };

  const stopFocusSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState({
      timeRemaining: 1500,
      isRunning: false,
      currentPhase: 'Study',
      activeModuleId: undefined,
      topic: undefined
    });
  };

  const logout = () => auth.signOut();

  return (
    <ValenContext.Provider value={{ 
      user, profile, loading, timerState, tasks, folders, modules, religiousActivities, fitnessActivities,
      startFocusSession, pauseFocusSession, stopFocusSession, addTask, addFolder, addModule, 
      addReligiousActivity, deleteReligiousActivity, addFitnessActivity, deleteFitnessActivity,
      toggleTaskCompletion, updateModuleSchedule, logout 
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