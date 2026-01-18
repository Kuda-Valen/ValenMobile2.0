import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal,
  Platform,
  SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function FitnessScreen() {
  const router = useRouter();
  const { fitnessActivities, addFitnessActivity, deleteFitnessActivity } = useValen();

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fitness & Health</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* BENTO PROGRESS SECTION */}
        <View style={styles.bentoStats}>
            <View style={styles.mainRingCard}>
                <View style={styles.ringPlaceholder}>
                    <Ionicons name="flame" size={30} color={MINT_GREEN} />
                    <Text style={styles.stepsValue}>{stepCount}</Text>
                    <Text style={styles.stepsLabel}>Steps Today</Text>
                </View>
            </View>
            <View style={styles.statsSide}>
                <View style={styles.statBox}>
                    <Text style={styles.smallLabel}>CALORIES</Text>
                    <Text style={styles.statNum}>{caloriesBurned} kcal</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: TEXT_DARK }]}>
                    <Text style={[styles.smallLabel, { color: TEXT_GREY }]}>GOAL</Text>
                    <Text style={[styles.statNum, { color: '#FFF' }]}>10k</Text>
                </View>
            </View>
        </View>

        {/* DAILY ROUTINES */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Routines</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={20} color={MINT_GREEN} />
                <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
        </View>

        {fitnessActivities.map((item) => (
            <View key={item.id} style={styles.routineCard}>
                <View style={styles.iconCircle}>
                    <Ionicons name="fitness-outline" size={20} color={MINT_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.routineTitle}>{item.title}</Text>
                    <Text style={styles.routineSub}>{item.time} • {item.days?.join(', ')}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteFitnessActivity(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={TEXT_GREY} />
                </TouchableOpacity>
            </View>
        ))}
      </ScrollView>

      {/* CENTERED MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.centerCard}>
            <Text style={styles.modalHeading}>New Routine</Text>
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.presetGrid}>
              {presets.map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setCategory(p)}
                  style={[styles.presetTile, category === p && styles.activePreset]}
                >
                  <Text style={[styles.presetText, category === p && styles.activePresetText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Activity Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Legs Day or Park Run"
              placeholderTextColor={TEXT_GREY}
              value={activityName}
              onChangeText={setActivityName}
            />

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Start Time</Text>
                    <TextInput 
                        style={styles.input} 
                        value={time}
                        onChangeText={setTime}
                        placeholder="06:00"
                    />
                </View>
                <View style={{ flex: 2 }}>
                    <Text style={styles.label}>Days</Text>
                    <View style={styles.daysRow}>
                        {daysList.map((d, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.dayCircle, selectedDayIndices.includes(i) && styles.activeDayCircle]}
                                onPress={() => handleToggleDay(i)}
                            >
                                <Text style={[styles.dayText, selectedDayIndices.includes(i) && styles.activeDayText]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSec}>
                <Text style={styles.btnSecText}>Cancel</Text>
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
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  scrollContent: { padding: 20 },

  // Bento Stats
  bentoStats: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  mainRingCard: { flex: 1.2, backgroundColor: CARD_WHITE, borderRadius: 30, height: 180, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  ringPlaceholder: { alignItems: 'center' },
  stepsValue: { fontSize: 32, fontWeight: '900', color: TEXT_DARK, marginTop: 5 },
  stepsLabel: { fontSize: 12, color: TEXT_GREY, fontWeight: '600' },
  statsSide: { flex: 1, gap: 12 },
  statBox: { flex: 1, backgroundColor: CARD_WHITE, borderRadius: 22, padding: 15, justifyContent: 'center' },
  smallLabel: { fontSize: 10, fontWeight: '800', color: TEXT_GREY },
  statNum: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },

  // List
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addText: { color: MINT_GREEN, fontWeight: '700', marginLeft: 4 },
  routineCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center' },
  routineTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  routineSub: { fontSize: 12, color: TEXT_GREY, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  centerCard: { backgroundColor: CARD_WHITE, borderRadius: 35, padding: 25 },
  modalHeading: { fontSize: 22, fontWeight: '900', color: TEXT_DARK, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', marginBottom: 10 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  presetTile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F0' },
  activePreset: { backgroundColor: MINT_GREEN },
  presetText: { fontWeight: '700', color: TEXT_GREY },
  activePresetText: { color: '#FFF' },
  input: { backgroundColor: '#F5F5F0', padding: 15, borderRadius: 15, fontSize: 16, marginBottom: 15, fontWeight: '600', color: TEXT_DARK },
  row: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { backgroundColor: TEXT_DARK },
  dayText: { fontSize: 10, fontWeight: '700', color: TEXT_GREY },
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
    color: TEXT_GREY, 
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