import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useValen } from '../../src/context/ValenContext';

const { width } = Dimensions.get('window');

// THEME CONSTANTS
const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function ModulesScreen() {
  const { modules, addModule, startFocusSession, updateModuleSchedule } = useValen();
  const [modalVisible, setModalVisible] = useState(false);
  const [studyModal, setStudyModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  
  const [newModule, setNewModule] = useState({ name: '', code: '' });
  const [topic, setTopic] = useState('');

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    let currentSched = selectedModule?.schedule || [];
    if (currentSched.some((s: any) => s.day === day)) {
      currentSched = currentSched.filter((s: any) => s.day !== day);
    } else {
      currentSched.push({ day });
    }
    updateModuleSchedule(selectedModule.id, currentSched);
  };

  const handleStartStudy = () => {
    startFocusSession({ duration: 25, moduleId: selectedModule.id, topic: topic });
    setStudyModal(false);
    setTopic('');
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
        <View style={styles.gpaCard}>
          <Text style={styles.gpaLabel}>Total Time Studied</Text>
          <Text style={styles.gpaValue}>{modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0).toFixed(1)} <Text style={{fontSize: 20}}>hrs</Text></Text>
          <View style={styles.gpaProgressBase}><View style={[styles.gpaProgressFill, { width: `40%` }]} /></View>
        </View>

        <View style={styles.grid}>
          {modules.map((m) => (
            <TouchableOpacity key={m.id} style={styles.moduleCard} onPress={() => { setSelectedModule(m); setStudyModal(true); }}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleCode}>{m.code}</Text>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); setSelectedModule(m); setScheduleModal(true); }}>
                   <Ionicons name="calendar" size={18} color={m.schedule?.length > 0 ? MINT_GREEN : "#DDD"} />
                </TouchableOpacity>
              </View>
              <Text style={styles.moduleName}>{m.name}</Text>
              <View style={styles.moduleFooter}>
                <Text style={styles.creditsText}>{m.hoursDone?.toFixed(1) || 0}/20 hrs</Text>
                <Ionicons name="play-circle" size={24} color={MINT_GREEN} />
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.moduleCard, styles.dashed]} onPress={() => setModalVisible(true)}>
             <Ionicons name="school-outline" size={32} color="#CCC" /><Text style={styles.addModuleText}>New Module</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SCHEDULE MODAL */}
      <Modal visible={scheduleModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { height: 500 }]}>
            <Text style={styles.modalTitle}>Study Schedule: {selectedModule?.code}</Text>
            <Text style={{color: TEXT_GREY, marginBottom: 20}}>Select days to be reminded to study.</Text>
            <View style={{ width: '100%' }}>
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

      {/* MODAL: START STUDY SESSION */}
      <Modal visible={studyModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Study {selectedModule?.code}</Text>
            <TextInput style={styles.input} placeholder="What topic are we focusing on?" value={topic} onChangeText={setTopic} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleStartStudy}>
              <Text style={styles.saveBtnText}>Start Pomodoro (25m)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStudyModal(false)} style={{marginTop: 15}}><Text style={{color: '#AAA'}}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD MODULE */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Add New Module</Text>
            <TextInput style={styles.input} placeholder="Module Name" value={newModule.name} onChangeText={(t) => setNewModule({...newModule, name: t})} />
            <TextInput style={styles.input} placeholder="Module Code" value={newModule.code} onChangeText={(t) => setNewModule({...newModule, code: t})} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => { if(newModule.name) addModule(newModule); setModalVisible(false); }}>
              <Text style={styles.saveBtnText}>Create Module</Text>
            </TouchableOpacity>
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
  gpaCard: { backgroundColor: TEXT_DARK, borderRadius: 24, padding: 25, marginBottom: 20 },
  gpaLabel: { fontSize: 14, color: TEXT_GREY, fontWeight: '600' },
  gpaValue: { fontSize: 42, fontWeight: '900', color: '#FFF' },
  gpaProgressBase: { height: 6, backgroundColor: '#333', borderRadius: 3, marginTop: 15 },
  gpaProgressFill: { height: 6, backgroundColor: MINT_GREEN, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: { backgroundColor: CARD_WHITE, width: (width - 55) / 2, height: 160, borderRadius: 24, padding: 20, marginBottom: 15, justifyContent: 'space-between' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleCode: { fontSize: 10, fontWeight: '800', color: TEXT_GREY },
  moduleName: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, marginTop: 10 },
  moduleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeBadge: { backgroundColor: '#F0FAF9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradeText: { fontSize: 11, fontWeight: '700', color: MINT_GREEN },
  creditsText: { fontSize: 11, color: TEXT_GREY, fontWeight: '600' },
  dashed: { borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addModuleText: { color: '#CCC', fontWeight: '700', marginTop: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: 400, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 5, color: TEXT_DARK },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 12, borderRadius: 12, marginBottom: 4 },
  dayRowText: { fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  input: { backgroundColor: '#F5F5F0', padding: 15, borderRadius: 12, marginBottom: 15, width: '100%' },
  saveBtn: { backgroundColor: MINT_GREEN, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});