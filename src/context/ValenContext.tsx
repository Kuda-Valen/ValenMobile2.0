import * as Haptics from 'expo-haptics';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  addDoc, collection, doc,
  increment,
  onSnapshot, serverTimestamp, updateDoc
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
  startFocusSession: (config: { duration: number, moduleId?: string, topic?: string }) => void;
  pauseFocusSession: () => void;
  stopFocusSession: () => void; // Added for premium control
  addTask: (taskData: any) => Promise<void>;
  addFolder: (name: string, icon: string) => Promise<void>;
  addModule: (moduleData: any) => Promise<void>;
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

    return () => { unsubProfile(); unsubTasks(); unsubFolders(); unsubModules(); };
  }, [user]);

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

  const addTask = async (taskData: any) => {
    if (!user) return;
    const taskCol = collection(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'tasks');
    await addDoc(taskCol, { ...taskData, completed: false, createdAt: serverTimestamp() });
  };

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
    
    // Increment hours in module AND daily minutes in profile
    await updateDoc(modRef, { hoursDone: increment(0.42) }); // ~25 mins
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
      user, profile, loading, timerState, tasks, folders, modules,
      startFocusSession, pauseFocusSession, stopFocusSession, addTask, addFolder, addModule, toggleTaskCompletion, updateModuleSchedule, logout 
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