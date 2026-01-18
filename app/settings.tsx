import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';
const CARD_WHITE = '#FFFFFF';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, logout } = useValen();
  
  const [shieldActive, setShieldActive] = useState(true);
  const [aiStrictTone, setAiStrictTone] = useState(profile?.neuralContext?.strictTone || false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundscapes, setSoundscapes] = useState(true);
  
  // Modal State for Theme
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const handleToggleStrict = async (value: boolean) => {
    setAiStrictTone(value);
    await updateProfile({ 
      neuralContext: { ...profile?.neuralContext, strictTone: value } 
    });
  };

  const handleThemeChange = async (themeName: 'light' | 'dark') => {
    await updateProfile({ theme: themeName });
    setThemeModalVisible(false);
    Alert.alert("Interface Updated", `System rebooted in Valen ${themeName === 'dark' ? 'Onyx' : 'Light'} mode.`);
  };

  const handleClearData = () => {
    Alert.alert(
      "Neural Reset",
      "This will clear your local performance history. Archetype and Rank will remain. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => console.log("Data Cleared") }
      ]
    );
  };

  const SettingRow = ({ icon, label, subtext, value, onValueChange, type = 'toggle', onPress }: any) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={type === 'link' ? onPress : undefined}
      activeOpacity={type === 'link' ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color={MINT_GREEN} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtext && <Text style={styles.rowSubtext}>{subtext}</Text>}
      </View>
      {type === 'toggle' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: '#DDD', true: MINT_GREEN }}
          thumbColor={Platform.OS === 'ios' ? '#FFF' : value ? MINT_GREEN : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={TEXT_GREY} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
            </TouchableOpacity>
            <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v1.0.4</Text>
            </View>
        </View>
        <Text style={styles.title}>Command Center</Text>
        <Text style={styles.subtitle}>System Preferences • Optimized</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <Text style={styles.groupLabel}>Neural Intelligence</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="mic-outline" 
            label="Executive AI Tone" 
            subtext="Allow the AI to use stern corrective language"
            value={aiStrictTone}
            onValueChange={handleToggleStrict}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="notifications-outline" 
            label="Smart Nudges" 
            subtext="AI predicts the best time for deep work"
            value={true}
          />
        </View>

        <Text style={styles.groupLabel}>Focus Parameters</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="shield-checkmark-outline" 
            label="Focus Shield" 
            subtext="Silence system alerts during focus sessions"
            value={shieldActive}
            onValueChange={setShieldActive}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="musical-notes-outline" 
            label="System Soundscapes" 
            subtext="Play white noise/lo-fi during timers"
            value={soundscapes}
            onValueChange={setSoundscapes}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="options-outline" 
            label="Pomodoro Intervals" 
            type="link"
            onPress={() => Alert.alert("Timer Setup", "Standard: 25m/5m. Long: 50m/10m.")}
          />
        </View>

        <Text style={styles.groupLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="pulse-outline" 
            label="Haptic Feedback" 
            subtext="Tactile response on achieving milestones"
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="color-palette-outline" 
            label="Visual Interface" 
            subtext={profile?.theme === 'dark' ? "Valen Onyx (Dark)" : "Valen Light (Cream)"}
            type="link"
            onPress={() => setThemeModalVisible(true)}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
          <Text style={styles.logoutText}>Terminate Secure Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- THEME SELECTION MODAL --- */}
      <Modal visible={themeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.themeSheet}>
            <Text style={styles.modalTitle}>Neural Interface</Text>
            <Text style={styles.modalSub}>Select your preferred visual environment</Text>

            <TouchableOpacity 
              style={[styles.themeOption, profile?.theme !== 'dark' && styles.activeTheme]} 
              onPress={() => handleThemeChange('light')}
            >
              <View style={[styles.themePreview, { backgroundColor: CREAM_BG }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.themeName}>Valen Light</Text>
                <Text style={styles.themeDesc}>Classic cream & mint for day focus</Text>
              </View>
              {profile?.theme !== 'dark' && <Ionicons name="checkmark-circle" size={24} color={MINT_GREEN} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, profile?.theme === 'dark' && styles.activeTheme]} 
              onPress={() => handleThemeChange('dark')}
            >
              <View style={[styles.themePreview, { backgroundColor: '#121212' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.themeName}>Valen Onyx</Text>
                <Text style={styles.themeDesc}>Deep blacks for low-light deep work</Text>
              </View>
              {profile?.theme === 'dark' && <Ionicons name="checkmark-circle" size={24} color={MINT_GREEN} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { padding: 25, paddingTop: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  versionBadge: { backgroundColor: '#E0F2F1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  versionText: { fontSize: 10, fontWeight: '800', color: MINT_GREEN },
  title: { fontSize: 28, fontWeight: '900', color: TEXT_DARK },
  subtitle: { fontSize: 12, color: TEXT_GREY, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  groupLabel: { fontSize: 11, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 25, marginLeft: 10 },
  card: { backgroundColor: CARD_WHITE, borderRadius: 24, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: CARD_WHITE },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 15 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  rowSubtext: { fontSize: 11, color: TEXT_GREY, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F5F5F0', marginHorizontal: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 10, padding: 15 },
  logoutText: { color: '#FF4B4B', fontWeight: '800', fontSize: 15 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  themeSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: TEXT_DARK },
  modalSub: { fontSize: 13, color: TEXT_GREY, marginBottom: 25, marginTop: 4 },
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F9F9F7' },
  activeTheme: { borderColor: MINT_GREEN, backgroundColor: '#F0FAF9' },
  themePreview: { width: 50, height: 50, borderRadius: 12, marginRight: 15, borderWidth: 1, borderColor: '#EEE' },
  themeName: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  themeDesc: { fontSize: 12, color: TEXT_GREY, marginTop: 2 },
  closeModalBtn: { alignSelf: 'center', marginTop: 10, padding: 15 },
  closeModalText: { color: TEXT_GREY, fontWeight: '700' }
});