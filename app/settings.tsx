import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
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
  const { profile, updateProfile, logout } = useValen();
  
  // Local states for functional settings
  const [shieldActive, setShieldActive] = useState(true);
  const [aiStrictTone, setAiStrictTone] = useState(profile?.neuralContext?.strictTone || false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundscapes, setSoundscapes] = useState(true);

  const handleToggleStrict = async (value: boolean) => {
    setAiStrictTone(value);
    await updateProfile({ 
      neuralContext: { ...profile?.neuralContext, strictTone: value } 
    });
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
        <Text style={styles.title}>Command Center</Text>
        <Text style={styles.subtitle}>System Version 1.0.4 • Optimized</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* GROUP 1: NEURAL ADAPTATION */}
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

        {/* GROUP 2: FOCUS ENGINE */}
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

        {/* GROUP 3: DATA INTEGRITY */}
        <Text style={styles.groupLabel}>Data & Privacy</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="cloud-download-outline" 
            label="Export Neural Data" 
            subtext="Download performance report (PDF)"
            type="link"
            onPress={() => Alert.alert("Data Export", "Compiling archive...")}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="trash-outline" 
            label="Clear Local Cache" 
            subtext="Purge temporary analytics data"
            type="link"
            onPress={handleClearData}
          />
        </View>

        {/* GROUP 4: SYSTEM PREFERENCES */}
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
            subtext="Valen Default (Cream/Mint)"
            type="link"
          />
        </View>

        {/* DANGER ZONE */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
          <Text style={styles.logoutText}>Terminate Secure Session</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Valen Intelligence © 2026. Data encrypted in transit.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { padding: 25, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '900', color: TEXT_DARK },
  subtitle: { fontSize: 12, color: MINT_GREEN, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  groupLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: TEXT_GREY, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 25,
    marginLeft: 10
  },
  card: { 
    backgroundColor: CARD_WHITE, 
    borderRadius: 24, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18,
    backgroundColor: CARD_WHITE
  },
  iconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: '#F0FAF9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  textContainer: { flex: 1, marginLeft: 15 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  rowSubtext: { fontSize: 11, color: TEXT_GREY, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F5F5F0', marginHorizontal: 15 },

  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 40, 
    gap: 10,
    padding: 15
  },
  logoutText: { color: '#FF4B4B', fontWeight: '800', fontSize: 15 },
  footerText: { 
    textAlign: 'center', 
    fontSize: 10, 
    color: TEXT_GREY, 
    marginTop: 30, 
    fontWeight: '600' 
  }
});