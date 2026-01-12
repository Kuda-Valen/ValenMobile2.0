import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth, db, VALEN_APP_ID } from '../../src/services/firebase';

const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // New for sign-up
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuthentication = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get today's date in YYYY-MM-DD format for the initial reset marker
        const today = new Date().toISOString().split('T')[0];

        const profileDocRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');
        
        // INITIALIZING FULL PROFILE FOR ANALYTICS READINESS
        await setDoc(profileDocRef, {
          name: username,
          profession: '',
          photoURL: '',
          selectedFeatures: ['tasks', 'academic'],
          email: user.email,
          createdAt: serverTimestamp(),
          // CRITICAL FIELDS FOR DAILY RINGS & ANALYTICS
          lastResetDate: today, 
          dailyFocusMinutes: 0,
          archetype: 'The Novice',
          totalFocusHours: 0,
        });
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        
        <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Join Valen Today!'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to access your personalized assistant.' : 'Set up your account in a few simple steps.'}
        </Text>

        {!isLogin && (
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            value={username} 
            onChangeText={setUsername} 
          />
        )}
        
        <TextInput 
          style={styles.input} 
          placeholder="Email address" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />

        {isLogin && (
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.mainBtn} onPress={handleAuthentication} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.mainBtnText}>{isLogin ? 'Sign In' : 'Next: Profession & Features'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: CARD_WHITE, width: '90%', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { color: '#666', textAlign: 'center', marginBottom: 25, fontSize: 14 },
  input: { width: '100%', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', height: 50, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#4A90E2', fontSize: 12 },
  mainBtn: { backgroundColor: MINT_GREEN, width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 20 },
  switchText: { color: '#666', fontSize: 13 }
});