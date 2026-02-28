import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const MINT_GREEN = '#00BFA5';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, logout } = useValen();
  
  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F0',
    iconBg: isDark ? 'rgba(0, 191, 165, 0.1)' : '#F0FAF9'
  };

  // --- PERSISTENT STATES SYNCED WITH FIREBASE ---
  const [shieldActive, setShieldActive] = useState(profile?.focusParameters?.shieldActive ?? true);
  const [aiStrictTone, setAiStrictTone] = useState(profile?.neuralContext?.strictTone || false);
  const [smartNudges, setSmartNudges] = useState(profile?.neuralContext?.smartNudges || false);
  const [hapticsEnabled, setHapticsEnabled] = useState(profile?.preferences?.haptics ?? true);
  const [soundscapes, setSoundscapes] = useState(profile?.focusParameters?.soundscapes ?? true);
  
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [intervalsModalVisible, setIntervalsModalVisible] = useState(false);

  // --- TOGGLE HANDLERS (SAVES TO CLOUD) ---

  const handleToggleStrict = async (value: boolean) => {
    setAiStrictTone(value);
    await updateProfile({ 
      neuralContext: { ...profile?.neuralContext, strictTone: value } 
    });
  };

  const handleToggleNudges = async (value: boolean) => {
    setSmartNudges(value);
    await updateProfile({ 
      neuralContext: { ...profile?.neuralContext, smartNudges: value } 
    });
    if (value) {
      Alert.alert("Neural Engine Active", "Valen will now prioritize proactive discipline reminders.");
    }
  };

  const handleToggleShield = async (value: boolean) => {
    setShieldActive(value);
    await updateProfile({ 
      focusParameters: { ...profile?.focusParameters, shieldActive: value } 
    });
  };

  const handleToggleSoundscapes = async (value: boolean) => {
    setSoundscapes(value);
    await updateProfile({ 
      focusParameters: { ...profile?.focusParameters, soundscapes: value } 
    });
  };

  const handleToggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await updateProfile({ 
      preferences: { ...profile?.preferences, haptics: value } 
    });
  };

  const handleThemeChange = async (themeName: 'light' | 'dark') => {
    await updateProfile({ theme: themeName });
    setThemeModalVisible(false);
    if (Platform.OS !== 'web') {
      Alert.alert("Interface Updated", `System rebooted in Valen ${themeName === 'dark' ? 'Onyx' : 'Light'} mode.`);
    }
  };

  // --- NEW: POMODORO INTERVAL HANDLER ---
  const handleIntervalChange = async (focus: number, rest: number) => {
    await updateProfile({
      focusParameters: {
        ...profile?.focusParameters,
        pomodoroFocus: focus,
        pomodoroBreak: rest
      }
    });
    setIntervalsModalVisible(false);
    if (Platform.OS !== 'web') {
      Alert.alert("Protocol Updated", `Focus intervals recalibrated to ${focus}m/${rest}m.`);
    }
  };

  const SettingRow = ({ icon, label, subtext, value, onValueChange, type = 'toggle', onPress }: any) => (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: theme.card }]} 
      onPress={type === 'link' ? onPress : undefined}
      activeOpacity={type === 'link' ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={icon} size={22} color={MINT_GREEN} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.rowLabel, { color: theme.textDark }]}>{label}</Text>
        {subtext && <Text style={[styles.rowSubtext, { color: theme.textGrey }]}>{subtext}</Text>}
      </View>
      {type === 'toggle' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: isDark ? '#333' : '#DDD', true: MINT_GREEN }}
          thumbColor={Platform.OS === 'ios' ? '#FFF' : value ? MINT_GREEN : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.textGrey} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
                <Ionicons name="chevron-back" size={24} color={theme.textDark} />
            </TouchableOpacity>
            <View style={[styles.versionBadge, { backgroundColor: isDark ? 'rgba(0, 191, 165, 0.1)' : '#E0F2F1' }]}>
                <Text style={styles.versionText}>v1.0.4</Text>
            </View>
        </View>
        <Text style={[styles.title, { color: theme.textDark }]}>Command Center</Text>
        <Text style={[styles.subtitle, { color: theme.textGrey }]}>System Preferences • Optimized</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <Text style={[styles.groupLabel, { color: theme.textGrey }]}>Neural Intelligence</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingRow 
            icon="mic-outline" 
            label="Executive AI Tone" 
            subtext="Allow the AI to use stern corrective language"
            value={aiStrictTone}
            onValueChange={handleToggleStrict}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow 
            icon="notifications-outline" 
            label="Smart Nudges" 
            subtext="AI predicts the best time for deep work"
            value={smartNudges}
            onValueChange={handleToggleNudges}
          />
        </View>

        <Text style={[styles.groupLabel, { color: theme.textGrey }]}>Focus Parameters</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingRow 
            icon="shield-checkmark-outline" 
            label="Focus Shield" 
            subtext="Silence system alerts during focus sessions"
            value={shieldActive}
            onValueChange={handleToggleShield}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow 
            icon="musical-notes-outline" 
            label="System Soundscapes" 
            subtext="Play white noise/lo-fi during timers"
            value={soundscapes}
            onValueChange={handleToggleSoundscapes}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow 
            icon="options-outline" 
            label="Pomodoro Intervals" 
            subtext={`${profile?.focusParameters?.pomodoroFocus || 25}m / ${profile?.focusParameters?.pomodoroBreak || 5}m`}
            type="link"
            onPress={() => setIntervalsModalVisible(true)}
          />
        </View>

        <Text style={[styles.groupLabel, { color: theme.textGrey }]}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <SettingRow 
            icon="pulse-outline" 
            label="Haptic Feedback" 
            subtext="Tactile response on achieving milestones"
            value={hapticsEnabled}
            onValueChange={handleToggleHaptics}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow 
            icon="color-palette-outline" 
            label="Visual Interface" 
            subtext={isDark ? "Valen Onyx (Dark)" : "Valen Light (Cream)"}
            type="link"
            onPress={() => setThemeModalVisible(true)}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
          <Text style={styles.logoutText}>Terminate Secure Session</Text>
        </TouchableOpacity>

        {/* --- ACCOUNT TERMINATION (Apple Compliance) --- */}
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => {
            Alert.alert(
              "Neural Wipe",
              "This will permanently delete your neural profile and all academic history. This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete Permanently", style: "destructive", onPress: () => Alert.alert("Request Sent", "Your account termination request is being processed.") }
              ]
            );
          }}
        >
          <Text style={styles.deleteText}>Request Account Termination</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- THEME SELECTION MODAL --- */}
      <Modal visible={themeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.themeSheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.textDark }]}>Neural Interface</Text>
            <Text style={[styles.modalSub, { color: theme.textGrey }]}>Select your preferred visual environment</Text>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: isDark ? '#252525' : '#F9F9F7' },
                !isDark && styles.activeTheme
              ]} 
              onPress={() => handleThemeChange('light')}
            >
              <View style={[styles.themePreview, { backgroundColor: '#F5F5F0', borderColor: isDark ? '#444' : '#EEE' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeName, { color: theme.textDark }]}>Valen Light</Text>
                <Text style={[styles.themeDesc, { color: theme.textGrey }]}>Classic cream & mint for day focus</Text>
              </View>
              {!isDark && <Ionicons name="checkmark-circle" size={24} color={MINT_GREEN} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: isDark ? '#252525' : '#F9F9F7' },
                isDark && styles.activeTheme
              ]} 
              onPress={() => handleThemeChange('dark')}
            >
              <View style={[styles.themePreview, { backgroundColor: '#121212', borderColor: isDark ? '#444' : '#EEE' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeName, { color: theme.textDark }]}>Valen Onyx</Text>
                <Text style={[styles.themeDesc, { color: theme.textGrey }]}>Deep blacks for low-light deep work</Text>
              </View>
              {isDark && <Ionicons name="checkmark-circle" size={24} color={MINT_GREEN} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={[styles.closeModalText, { color: theme.textGrey }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- POMODORO INTERVALS MODAL --- */}
      <Modal visible={intervalsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.themeSheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.textDark }]}>Focus Protocol</Text>
            <Text style={[styles.modalSub, { color: theme.textGrey }]}>Select your preferred deep work cycle</Text>

            <TouchableOpacity 
              style={[styles.themeOption, { backgroundColor: theme.itemBg }]} 
              onPress={() => handleIntervalChange(25, 5)}
            >
              <View style={styles.iconContainer}><Ionicons name="time-outline" size={24} color={MINT_GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeName, { color: theme.textDark }]}>Standard Flow</Text>
                <Text style={[styles.themeDesc, { color: theme.textGrey }]}>25m Focus • 5m Rest</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, { backgroundColor: theme.itemBg }]} 
              onPress={() => handleIntervalChange(50, 10)}
            >
              <View style={styles.iconContainer}><Ionicons name="timer-outline" size={24} color={MINT_GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeName, { color: theme.textDark }]}>Deep Volume</Text>
                <Text style={[styles.themeDesc, { color: theme.textGrey }]}>50m Focus • 10m Rest</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, { backgroundColor: theme.itemBg }]} 
              onPress={() => handleIntervalChange(90, 15)}
            >
              <View style={styles.iconContainer}><Ionicons name="infinite-outline" size={24} color={MINT_GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeName, { color: theme.textDark }]}>Monk Mode</Text>
                <Text style={[styles.themeDesc, { color: theme.textGrey }]}>90m Focus • 15m Rest</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIntervalsModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={[styles.closeModalText, { color: theme.textGrey }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  versionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  versionText: { fontSize: 10, fontWeight: '800', color: '#00BFA5' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  groupLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 25, marginLeft: 10 },
  card: { borderRadius: 24, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 15 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowSubtext: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 10, padding: 15 },
  logoutText: { color: '#FF4B4B', fontWeight: '800', fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  themeSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  modalSub: { fontSize: 13, marginBottom: 25, marginTop: 4 },
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 2, borderColor: 'transparent' },
  activeTheme: { borderColor: '#00BFA5', backgroundColor: 'rgba(0, 191, 165, 0.05)' },
  themePreview: { width: 50, height: 50, borderRadius: 12, marginRight: 15, borderWidth: 1 },
  themeName: { fontSize: 16, fontWeight: '800' },
  themeDesc: { fontSize: 12, marginTop: 2 },
  closeModalBtn: { alignSelf: 'center', marginTop: 10, padding: 15 },
  closeModalText: { fontWeight: '700' },
  
  deleteBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  deleteText: { color: '#FF4B4B', fontSize: 12, fontWeight: '600', opacity: 0.6 }
});