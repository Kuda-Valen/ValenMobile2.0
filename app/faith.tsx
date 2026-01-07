import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

// PREMIUM PALETTE
const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function FaithScreen() {
  const router = useRouter();
  const { religiousActivities, addReligiousActivity, deleteReligiousActivity } = useValen();

  // MODAL & REMINDER FORM STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderType, setReminderType] = useState('Pray');
  const [specificName, setSpecificName] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // BIBLE STUDY FORM STATE
  const [studyChapters, setStudyChapters] = useState('');
  const [studyReflection, setStudyReflection] = useState('');

  const daysList = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const presets = ['Pray', 'Bible Study', 'Meditate', 'Gratitude', 'Other'];

  const reminders = religiousActivities.filter(a => a.subType === 'reminder');
  const studies = religiousActivities.filter(a => a.subType === 'bible-study');

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const saveReminder = async () => {
    // Logic: Combine Category + Specific Name
    const finalTitle = reminderType === 'Other' 
      ? specificName 
      : `${reminderType}${specificName ? ': ' + specificName : ''}`;

    await addReligiousActivity({
      subType: 'reminder',
      text: finalTitle,
      days: selectedDays,
      time: reminderTime,
      completed: false
    });

    setModalVisible(false);
    setSpecificName('');
    setReminderTime('08:00');
    setSelectedDays([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faith & Spirit</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: REMINDERS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addSmallBtn}>
            <Ionicons name="add" size={20} color={MINT_GREEN} />
            <Text style={styles.addSmallText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.remindersList}>
          {reminders.length > 0 ? reminders.map((item) => (
            <View key={item.id} style={styles.reminderCard}>
              <TouchableOpacity style={styles.checkmark}>
                <Ionicons 
                  name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={26} 
                  color={item.completed ? MINT_GREEN : "#DDD"} 
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderText, item.completed && styles.textStrike]}>{item.text}</Text>
                <Text style={styles.reminderSubText}>{item.time} • {item.days?.join(', ')}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteReligiousActivity(item.id)}>
                <Ionicons name="trash-outline" size={18} color={TEXT_GREY} />
              </TouchableOpacity>
            </View>
          )) : (
            <Text style={styles.emptyText}>No reminders set yet.</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* SECTION 2: BIBLE STUDY LOG */}
        <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Bible Study Vault</Text>
        
        <View style={styles.studyInputCard}>
          <TextInput 
            style={styles.studyInput} 
            placeholder="What are you studying? (e.g. Romans 8)" 
            placeholderTextColor={TEXT_GREY}
            value={studyChapters}
            onChangeText={setStudyChapters}
          />
          <TextInput 
            style={[styles.studyInput, { height: 80, paddingTop: 15 }]} 
            placeholder="Key takeaways..." 
            placeholderTextColor={TEXT_GREY}
            multiline
            value={studyReflection}
            onChangeText={setStudyReflection}
          />
          <TouchableOpacity 
            style={styles.logBtn}
            onPress={async () => {
              if(!studyChapters) return;
              await addReligiousActivity({
                subType: 'bible-study',
                chaptersVerses: studyChapters,
                reflection: studyReflection,
                date: new Date().toISOString()
              });
              setStudyChapters('');
              setStudyReflection('');
            }}
          >
            <Text style={styles.logBtnText}>Log Study Session</Text>
          </TouchableOpacity>
        </View>

        {studies.map((study) => (
          <View key={study.id} style={styles.historyCard}>
            <Text style={styles.historyVerse}>{study.chaptersVerses}</Text>
            <Text style={styles.historyRef}>{study.reflection}</Text>
            <Text style={styles.historyDate}>{new Date(study.date).toLocaleDateString()}</Text>
          </View>
        ))}
      </ScrollView>

      {/* CENTERED BLUR MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centerCard}
          >
            <Text style={styles.modalHeading}>Set Reminder</Text>
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.presetGrid}>
              {presets.map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setReminderType(p)}
                  style={[styles.presetTile, reminderType === p && styles.activePreset]}
                >
                  <Text style={[styles.presetText, reminderType === p && styles.activePresetText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{reminderType === 'Other' ? 'Name' : `Specific ${reminderType} Name`}</Text>
            <TextInput 
              style={styles.customInput} 
              placeholder={reminderType === 'Other' ? "e.g. Fasting" : "e.g. Morning Prayer"}
              placeholderTextColor={TEXT_GREY}
              value={specificName}
              onChangeText={setSpecificName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time</Text>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={18} color={MINT_GREEN} />
                  <TextInput 
                    style={styles.timeInput}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    placeholder="08:00"
                  />
                </View>
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.daysRow}>
                  {daysList.map((d, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => handleToggleDay(d)}
                      style={[styles.dayCircle, selectedDays.includes(d) && styles.activeDayCircle]}
                    >
                      <Text style={[styles.dayText, selectedDays.includes(d) && styles.activeDayText]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveReminder} style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Set Reminder</Text>
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
  backBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addSmallText: { color: MINT_GREEN, fontWeight: '700', marginLeft: 4 },
  
  remindersList: { marginBottom: 10 },
  reminderCard: { backgroundColor: CARD_WHITE, borderRadius: 22, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  checkmark: { paddingRight: 5 },
  reminderText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  textStrike: { textDecorationLine: 'line-through', color: TEXT_GREY },
  reminderSubText: { fontSize: 12, color: TEXT_GREY, marginTop: 2 },
  emptyText: { color: TEXT_GREY, fontStyle: 'italic', marginBottom: 10 },
  
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 30 },

  studyInputCard: { backgroundColor: '#EBEBE6', borderRadius: 28, padding: 15, marginBottom: 25 },
  studyInput: { backgroundColor: CARD_WHITE, borderRadius: 18, padding: 15, marginBottom: 10, fontWeight: '600', color: TEXT_DARK },
  logBtn: { backgroundColor: TEXT_DARK, borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 5 },
  logBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  
  historyCard: { backgroundColor: CARD_WHITE, padding: 22, borderRadius: 26, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  historyVerse: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  historyRef: { color: '#444', lineHeight: 22, fontSize: 14, marginBottom: 12 },
  historyDate: { fontSize: 11, color: TEXT_GREY, fontWeight: '700', textTransform: 'uppercase' },

  // Centered Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerCard: { backgroundColor: CARD_WHITE, width: '100%', borderRadius: 35, padding: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalHeading: { fontSize: 22, fontWeight: '900', color: TEXT_DARK, textAlign: 'center', marginBottom: 25 },
  label: { fontSize: 11, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  presetTile: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F0' },
  activePreset: { backgroundColor: MINT_GREEN },
  presetText: { fontWeight: '700', color: TEXT_GREY, fontSize: 13 },
  activePresetText: { color: '#FFF' },
  customInput: { backgroundColor: '#F5F5F0', padding: 16, borderRadius: 15, fontSize: 16, marginBottom: 20, fontWeight: '600', color: TEXT_DARK },
  
  row: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F0', padding: 14, borderRadius: 15, gap: 8 },
  timeInput: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, width: '100%' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { backgroundColor: TEXT_DARK },
  dayText: { fontWeight: '700', color: TEXT_GREY, fontSize: 11 },
  activeDayText: { color: '#FFF' },
  
  modalActions: { flexDirection: 'row', gap: 10 },
  btnSecondary: { flex: 1, padding: 18, alignItems: 'center' },
  btnSecondaryText: { fontWeight: '700', color: TEXT_GREY },
  btnPrimary: { flex: 2, backgroundColor: MINT_GREEN, padding: 18, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: MINT_GREEN, shadowOpacity: 0.3, shadowRadius: 10 },
  btnPrimaryText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});