import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar // Added for theme status bar control
  ,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const MINT_GREEN = '#00BFA5';

export default function FitnessScreen() {
  const router = useRouter();
  const { fitnessActivities, addFitnessActivity, deleteFitnessActivity, profile } = useValen();

  // --- THEME MAPPING (ONLY CHANGE) ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  };

  // STEP SENSOR STATE
  const [stepCount, setStepCount] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');

  // MODAL STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('Gym');
  const [activityName, setActivityName] = useState('');
  const [time, setTime] = useState('06:00');
  
  // FIXED: Logic stores indices [0, 1, 2...] instead of strings ['M', 'T'...] to handle duplicates
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([]);

  const presets = ['Gym', 'Run', 'Walk', 'Yoga', 'Swim', 'Other'];
  const daysList = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // START SENSORS
  useEffect(() => {
    let subscription: any;
    Pedometer.isAvailableAsync().then(
      result => {
        setIsPedometerAvailable(String(result));
        if (result) {
          subscription = Pedometer.watchStepCount(result => {
            setStepCount(result.steps);
          });
        }
      },
      error => setIsPedometerAvailable('Could not get isPedometerAvailable: ' + error)
    );
    return () => subscription && subscription.remove();
  }, []);

  const handleToggleDay = (index: number) => {
    setSelectedDayIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const saveRoutine = async () => {
    // Convert indices back to day strings for database storage
    const daysToSave = selectedDayIndices.map(i => daysList[i]);

    await addFitnessActivity({
      subType: 'reminder',
      category,
      title: activityName || category,
      time,
      days: daysToSave,
      completed: false,
    });
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setActivityName('');
    setSelectedDayIndices([]);
    setCategory('Gym');
    setTime('06:00');
  };

  const caloriesBurned = Math.round(stepCount * 0.04);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={24} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>Fitness & Health</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BENTO PROGRESS SECTION */}
        <View style={styles.bentoStats}>
            <View style={[styles.mainRingCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}>
                <View style={styles.ringPlaceholder}>
                    <Ionicons name="flame" size={30} color={MINT_GREEN} />
                    <Text style={[styles.stepsValue, { color: theme.textDark }]}>{stepCount}</Text>
                    <Text style={[styles.stepsLabel, { color: theme.textGrey }]}>Steps Today</Text>
                </View>
            </View>
            <View style={styles.statsSide}>
                <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}>
                    <Text style={[styles.smallLabel, { color: theme.textGrey }]}>CALORIES</Text>
                    <Text style={[styles.statNum, { color: theme.textDark }]}>{caloriesBurned} kcal</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? '#2A2A2A' : '#1A1A1A' }]}>
                    <Text style={[styles.smallLabel, { color: '#8E8E93' }]}>GOAL</Text>
                    <Text style={[styles.statNum, { color: '#FFF' }]}>10k</Text>
                </View>
            </View>
        </View>

        {/* DAILY ROUTINES */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Daily Routines</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={20} color={MINT_GREEN} />
                <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
        </View>

        {fitnessActivities.map((item) => (
            <View key={item.id} style={[styles.routineCard, { backgroundColor: theme.card }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.itemBg }]}>
                    <Ionicons name="fitness-outline" size={20} color={MINT_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.routineTitle, { color: theme.textDark }]}>{item.title}</Text>
                    <Text style={[styles.routineSub, { color: theme.textGrey }]}>{item.time} • {item.days?.join(', ')}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteFitnessActivity(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={theme.textGrey} />
                </TouchableOpacity>
            </View>
        ))}
      </ScrollView>

      {/* CENTERED MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.centerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>New Routine</Text>
            
            <Text style={[styles.label, { color: theme.textGrey }]}>Category</Text>
            <View style={styles.presetGrid}>
              {presets.map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setCategory(p)}
                  style={[styles.presetTile, { backgroundColor: theme.itemBg }, category === p && styles.activePreset]}
                >
                  <Text style={[styles.presetText, { color: theme.textGrey }, category === p && styles.activePresetText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textGrey }]}>Activity Name</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
              placeholder="e.g. Legs Day or Park Run"
              placeholderTextColor={theme.textGrey}
              value={activityName}
              onChangeText={setActivityName}
            />

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.textGrey }]}>Start Time</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
                        value={time}
                        onChangeText={setTime}
                        placeholder="06:00"
                        placeholderTextColor={theme.textGrey}
                    />
                </View>
                <View style={{ flex: 2 }}>
                    <Text style={[styles.label, { color: theme.textGrey }]}>Days</Text>
                    <View style={styles.daysRow}>
                        {daysList.map((d, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.dayCircle, { backgroundColor: theme.itemBg }, selectedDayIndices.includes(i) && [styles.activeDayCircle, {backgroundColor: isDark ? MINT_GREEN : '#1A1A1A'}]]}
                                onPress={() => handleToggleDay(i)}
                            >
                                <Text style={[styles.dayText, { color: theme.textGrey }, selectedDayIndices.includes(i) && styles.activeDayText]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSec}>
                <Text style={[styles.btnSecText, { color: theme.textGrey }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveRoutine} style={styles.btnPrimSmall}>
                <Text style={styles.btnPrimText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20 },

  // Bento Stats
  bentoStats: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  mainRingCard: { flex: 1.2, borderRadius: 30, height: 180, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  ringPlaceholder: { alignItems: 'center' },
  stepsValue: { fontSize: 32, fontWeight: '900', marginTop: 5 },
  stepsLabel: { fontSize: 12, fontWeight: '600' },
  statsSide: { flex: 1, gap: 12 },
  statBox: { flex: 1, borderRadius: 22, padding: 15, justifyContent: 'center' },
  smallLabel: { fontSize: 10, fontWeight: '800' },
  statNum: { fontSize: 18, fontWeight: '900' },

  // List
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addText: { color: MINT_GREEN, fontWeight: '700', marginLeft: 4 },
  routineCard: { borderRadius: 24, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  routineTitle: { fontSize: 16, fontWeight: '700' },
  routineSub: { fontSize: 12, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  centerCard: { borderRadius: 35, padding: 25 },
  modalHeading: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  presetTile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  activePreset: { backgroundColor: MINT_GREEN },
  presetText: { fontWeight: '700' },
  activePresetText: { color: '#FFF' },
  input: { padding: 15, borderRadius: 15, fontSize: 16, marginBottom: 15, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { },
  dayText: { fontSize: 10, fontWeight: '700' },
  activeDayText: { color: '#FFF' },
  
  modalActions: { 
    flexDirection: 'row', 
    gap: 12, 
    justifyContent: 'flex-end', 
    marginTop: 10 
  },
  btnSec: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    alignItems: 'center' 
  },
  btnSecText: { 
    fontWeight: '700',
    fontSize: 14
  },
  btnPrimSmall: { 
    backgroundColor: MINT_GREEN, 
    paddingVertical: 12, 
    paddingHorizontal: 35, 
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: MINT_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  btnPrimText: { 
    color: '#FFF', 
    fontWeight: '800',
    fontSize: 14
  }
});