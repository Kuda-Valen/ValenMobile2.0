import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useValen } from '../../src/context/ValenContext';

const { width, height } = Dimensions.get('window');

// THEME CONSTANTS
const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

const PREMIUM_ICONS = ['book', 'calculator', 'flask', 'language', 'code-working', 'color-palette', 'globe', 'musical-notes'];

export default function ModulesScreen() {
  const { modules, addModule, startFocusSession, pauseFocusSession, updateModuleSchedule, timerState } = useValen();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [studyModal, setStudyModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [activeStudyView, setActiveStudyView] = useState(false); // New: Live Timer View
  
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [newModule, setNewModule] = useState({ name: '', code: '', icon: 'book' });
  const [topic, setTopic] = useState('');

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Handle auto-opening the "Live Timer" if a session is started
  useEffect(() => {
    if (timerState.isRunning && timerState.activeModuleId) {
      setActiveStudyView(true);
    }
  }, [timerState.isRunning]);

  const handleStartStudy = () => {
    startFocusSession({ duration: 25, moduleId: selectedModule.id, topic: topic });
    setStudyModal(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Academic</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={MINT_GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FIXED: Now matches other tiles */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Total Study Time</Text>
            <Text style={styles.summaryValue}>
              {modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0).toFixed(1)} 
              <Text style={{fontSize: 18, color: TEXT_GREY}}> hrs</Text>
            </Text>
          </View>
          <View style={styles.summaryCircle}>
            <Ionicons name="stats-chart" size={24} color={MINT_GREEN} />
          </View>
        </View>

        <View style={styles.grid}>
          {modules.map((m) => (
            <TouchableOpacity key={m.id} style={styles.moduleCard} onPress={() => { setSelectedModule(m); setStudyModal(true); }}>
              <View style={styles.moduleHeader}>
                <View style={styles.iconBg}><Ionicons name={m.icon || 'book'} size={18} color={MINT_GREEN} /></View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setSelectedModule(m); setScheduleModal(true); }}>
                   <Ionicons name="calendar" size={18} color={m.schedule?.length > 0 ? MINT_GREEN : "#DDD"} />
                </TouchableOpacity>
              </View>
              <Text style={styles.moduleName} numberOfLines={1}>{m.name}</Text>
              <View style={styles.moduleFooter}>
                <View style={styles.progressMini}>
                  <View style={[styles.progressMiniFill, { width: `${Math.min(((m.hoursDone || 0)/20)*100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{m.hoursDone?.toFixed(1) || 0}h</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.moduleCard, styles.dashed]} onPress={() => setModalVisible(true)}>
             <Ionicons name="add" size={32} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL: LIVE STUDY TIMER (The "Premium" Screen) */}
      <Modal visible={activeStudyView} animationType="slide">
        <SafeAreaView style={styles.timerOverlay}>
          <TouchableOpacity style={styles.closeTimer} onPress={() => setActiveStudyView(false)}>
            <Ionicons name="chevron-down" size={30} color={TEXT_DARK} />
          </TouchableOpacity>
          
          <View style={styles.timerContent}>
            <Text style={styles.timerStatus}>FOCUSING ON</Text>
            <Text style={styles.timerModuleName}>{modules.find(m => m.id === timerState.activeModuleId)?.name || 'Study Session'}</Text>
            <Text style={styles.timerTopic}>"{timerState.topic || 'No topic set'}"</Text>
            
            <View style={styles.timerBigRing}>
                <Text style={styles.timerBigDigits}>{formatTime(timerState.timeRemaining)}</Text>
            </View>

            <View style={styles.timerActions}>
              <TouchableOpacity style={styles.stopBtn} onPress={() => { pauseFocusSession(); setActiveStudyView(false); }}>
                <Ionicons name="stop" size={24} color="#FF4B4B" />
                <Text style={styles.stopText}>Stop</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.pauseBtn} onPress={pauseFocusSession}>
                <Ionicons name={timerState.isRunning ? "pause" : "play"} size={24} color={MINT_GREEN} />
                <Text style={styles.pauseText}>{timerState.isRunning ? "Pause" : "Resume"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL: ADD MODULE WITH ICON PICKER */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>New Module</Text>
            <TextInput style={styles.input} placeholder="Module Name" value={newModule.name} onChangeText={(t) => setNewModule({...newModule, name: t})} />
            
            <Text style={styles.label}>Select Icon</Text>
            <View style={styles.iconPicker}>
              {PREMIUM_ICONS.map(icon => (
                <TouchableOpacity 
                  key={icon} 
                  onPress={() => setNewModule({...newModule, icon})}
                  style={[styles.iconChoice, newModule.icon === icon && styles.activeIcon]}
                >
                  <Ionicons name={icon as any} size={20} color={newModule.icon === icon ? '#FFF' : TEXT_GREY} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => { if(newModule.name) addModule(newModule); setModalVisible(false); }}>
              <Text style={styles.saveBtnText}>Create Module</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SCHEDULE MODAL (Keeping your logic) */}
      <Modal visible={scheduleModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { height: 500 }]}>
            <Text style={styles.modalTitle}>Schedule: {selectedModule?.code}</Text>
            <View style={{ width: '100%', marginTop: 10 }}>
              {weekdays.map(day => {
                const isActive = selectedModule?.schedule?.some((s: any) => s.day === day);
                return (
                  <TouchableOpacity key={day} onPress={() => toggleDay(day)} style={[styles.dayRow, isActive && { backgroundColor: '#F0FAF9' }]}>
                    <Text style={[styles.dayRowText, isActive && { color: MINT_GREEN }]}>{day}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={MINT_GREEN} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setScheduleModal(false)} style={styles.saveBtn}><Text style={styles.saveBtnText}>Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: TEXT_DARK },
  addBtn: { backgroundColor: CARD_WHITE, padding: 8, borderRadius: 12 },
  scrollContent: { padding: 20 },
  
  // Summary Card Fix
  summaryCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 25, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: TEXT_GREY, fontWeight: '600' },
  summaryValue: { fontSize: 32, fontWeight: '900', color: TEXT_DARK, marginTop: 4 },
  summaryCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: { backgroundColor: CARD_WHITE, width: (width - 55) / 2, height: 150, borderRadius: 24, padding: 18, marginBottom: 15, justifyContent: 'space-between' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  iconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  moduleCode: { fontSize: 10, fontWeight: '800', color: TEXT_GREY },
  moduleName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  moduleFooter: { gap: 8 },
  progressMini: { height: 4, backgroundColor: '#F5F5F0', borderRadius: 2, overflow: 'hidden' },
  progressMiniFill: { height: '100%', backgroundColor: MINT_GREEN },
  progressText: { fontSize: 10, fontWeight: '700', color: TEXT_GREY },
  dashed: { borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },

  // Timer View
  timerOverlay: { flex: 1, backgroundColor: CREAM_BG },
  closeTimer: { padding: 20 },
  timerContent: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40 },
  timerStatus: { fontSize: 12, fontWeight: '800', color: MINT_GREEN, letterSpacing: 2 },
  timerModuleName: { fontSize: 28, fontWeight: '900', color: TEXT_DARK, marginTop: 10, textAlign: 'center' },
  timerTopic: { fontSize: 16, color: TEXT_GREY, marginTop: 5 },
  timerBigRing: { width: 250, height: 250, borderRadius: 125, borderWeight: 15, borderColor: MINT_GREEN, borderStyle: 'solid', justifyContent: 'center', alignItems: 'center', marginVertical: 60, backgroundColor: '#FFF', elevation: 10 },
  timerBigDigits: { fontSize: 54, fontWeight: '900', color: TEXT_DARK },
  timerActions: { flexDirection: 'row', gap: 20 },
  stopBtn: { backgroundColor: '#FFE5E5', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  stopText: { color: '#FF4B4B', fontWeight: '800', marginLeft: 10 },
  pauseBtn: { backgroundColor: '#F0FAF9', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  pauseText: { color: MINT_GREEN, fontWeight: '800', marginLeft: 10 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 32, borderTopRightRadius: 32, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 20 },
  input: { backgroundColor: '#F5F5F0', padding: 18, borderRadius: 15, width: '100%', marginBottom: 20 },
  label: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '800', color: TEXT_GREY, marginBottom: 15, textTransform: 'uppercase' },
  iconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30, justifyContent: 'center' },
  iconChoice: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  activeIcon: { backgroundColor: MINT_GREEN },
  saveBtn: { backgroundColor: MINT_GREEN, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 14, borderRadius: 12, marginBottom: 4 },
  dayRowText: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
});