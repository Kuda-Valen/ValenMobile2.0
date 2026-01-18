import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db, VALEN_APP_ID } from '../../src/services/firebase';

const { width } = Dimensions.get('window');
const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // ONBOARDING STEPS: 1 = Auth, 2 = Neural Config (AI Questions), 3 = Visual ID (Photo)
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [focusStyle, setFocusStyle] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('System Requirement', 'Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Recovery Sent', 'Check your inbox for a reset link.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all security fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // SIGN UP - Step 1: Check Email Availability
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          Alert.alert('Integrity Error', 'This email is already archived in our systems.');
          setLoading(false);
          return;
        }
        // Move to Step 2: Questionnaire
        setStep(2);
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const today = new Date().toISOString().split('T')[0];
      const profileDocRef = doc(db, 'artifacts', VALEN_APP_ID, 'users', user.uid, 'profile', 'data');

      await setDoc(profileDocRef, {
        name: username,
        profession: profession,
        photoURL: profileImage || '',
        email: user.email,
        createdAt: serverTimestamp(),
        lastResetDate: today,
        dailyFocusMinutes: 0,
        dailyFocusGoalHours: 4,
        xp: 0,
        level: 1,
        badges: [],
        archetype: 'The Novice',
        totalFocusHours: 0,
        // AI Neural Parameters
        neuralContext: {
            primaryGoal: primaryGoal,
            focusStyle: focusStyle,
            setupDate: today
        }
      });
    } catch (error: any) {
      Alert.alert('System Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        {/* ROUNDED LOGO */}
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />

        {step === 1 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.title}>{isLogin ? 'Authorized Access' : 'Neural Enrollment'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Securely access your Valen Assistant.' : 'Initialize your unique executive profile.'}
            </Text>

            {!isLogin && (
              <TextInput style={styles.input} placeholder="Full Name" value={username} onChangeText={setUsername} />
            )}
            
            <TextInput 
              style={styles.input} 
              placeholder="Email address" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address"
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Request Access Recovery?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mainBtn} onPress={handleAuthentication} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <Text style={styles.mainBtnText}>{isLogin ? 'Initiate Login' : 'Continue to Config'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                {isLogin ? "New user? Enroll here" : "Return to secure login"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
            <Text style={styles.title}>Neural Config</Text>
            <Text style={styles.subtitle}>Help Valen AI understand your trajectory.</Text>

            <Text style={styles.label}>What is your current profession?</Text>
            <TextInput style={styles.input} placeholder="e.g. Software Engineer, Student" value={profession} onChangeText={setProfession} />

            <Text style={styles.label}>Primary Focus Objective?</Text>
            <TextInput style={styles.input} placeholder="e.g. Master React Native, Pass Exams" value={primaryGoal} onChangeText={setPrimaryGoal} />

            <Text style={styles.label}>Focus Style Preference?</Text>
            <View style={styles.choiceRow}>
                {['Deep Work', 'Pomodoro', 'Flow'].map(style => (
                    <TouchableOpacity 
                        key={style} 
                        style={[styles.choiceBtn, focusStyle === style && styles.activeChoice]} 
                        onPress={() => setFocusStyle(style)}
                    >
                        <Text style={[styles.choiceText, focusStyle === style && styles.activeChoiceText]}>{style}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={() => setStep(3)}>
                <Text style={styles.mainBtnText}>Continue to Visual ID</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 3 && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.title}>Visual ID</Text>
            <Text style={styles.subtitle}>Upload a profile photo to finalize your Neural ID.</Text>

            <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarLarge} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="camera" size={40} color={TEXT_GREY} />
                        <Text style={{ fontSize: 10, color: TEXT_GREY, marginTop: 10 }}>SELECT PHOTO</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainBtn} onPress={finalizeOnboarding} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <Text style={styles.mainBtnText}>Finalize Enrollment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(2)} style={styles.switchBtn}>
                <Text style={styles.switchText}>Go back to Config</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: CARD_WHITE, width: '92%', borderRadius: 32, padding: 30, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  
  // LOGO WITH ROUNDED EDGES
  logo: { width: 90, height: 90, marginBottom: 20, borderRadius: 22 },
  
  title: { fontSize: 24, fontWeight: '900', color: TEXT_DARK, letterSpacing: -0.5 },
  subtitle: { color: TEXT_GREY, textAlign: 'center', marginBottom: 25, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  label: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { width: '100%', backgroundColor: '#F8F8F6', borderWidth: 1, borderColor: '#EEE', height: 55, borderRadius: 16, paddingHorizontal: 15, marginBottom: 20, fontSize: 15, fontWeight: '600', color: TEXT_DARK },
  
  choiceRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  choiceBtn: { flex: 1, height: 45, borderRadius: 12, backgroundColor: '#F8F8F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  activeChoice: { backgroundColor: MINT_GREEN, borderColor: MINT_GREEN },
  choiceText: { fontSize: 12, fontWeight: '700', color: TEXT_GREY },
  activeChoiceText: { color: '#FFF' },

  avatarPicker: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F8F8F6', borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginBottom: 30, overflow: 'hidden' },
  avatarLarge: { width: 150, height: 150 },
  avatarPlaceholder: { alignItems: 'center' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: MINT_GREEN, fontSize: 12, fontWeight: '700' },
  mainBtn: { backgroundColor: TEXT_DARK, width: '100%', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  switchBtn: { marginTop: 25 },
  switchText: { color: TEXT_GREY, fontSize: 13, fontWeight: '600' }
});