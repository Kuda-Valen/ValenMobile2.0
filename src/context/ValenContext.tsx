import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db, VALEN_APP_ID } from '../services/firebase';

interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  currentPhase: 'Study' | 'Break';
}

interface ValenContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  timerState: TimerState;
  startFocusSession: (config: { duration: number }) => void;
  pauseFocusSession: () => void;
  logout: () => Promise<void>;
}

const ValenContext = createContext<ValenContextType | undefined>(undefined);

export const ValenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timer Engine State
  const [timerState, setTimerState] = useState<TimerState>({
    timeRemaining: 1500, // 25 mins default
    isRunning: false,
    currentPhase: 'Study',
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Auth & Profile Listeners (Keep existing logic)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileDoc = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
    return onSnapshot(profileDoc, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });
  }, [user]);

  // 2. THE TIMER ENGINE LOGIC
  const startFocusSession = (config: { duration: number }) => {
    setTimerState((prev) => ({ ...prev, isRunning: true }));
    
    // Clear any existing interval to prevent "speeding up"
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeRemaining <= 0) {
          clearInterval(timerRef.current!);
          Alert.alert("Focus Complete!", "Time for a well-deserved break.");
          return { ...prev, isRunning: false, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  const pauseFocusSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  };

  const logout = () => auth.signOut();

  return (
    <ValenContext.Provider value={{ 
      user, profile, loading, timerState, 
      startFocusSession, pauseFocusSession, logout 
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