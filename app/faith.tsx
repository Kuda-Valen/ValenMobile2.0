import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

export default function FaithScreen() {
  const router = useRouter();
  const { religiousActivities, addReligiousActivity, deleteReligiousActivity, toggleFaithCompletion, profile } = useValen();

  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E0E0E0',
    vaultBg: isDark ? '#1A1A17' : '#EBEBE6',
  };

  const MINT_GREEN = '#00BFA5';

  // MODAL & REMINDER FORM STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderType, setReminderType] = useState('Pray');
  const [specificName, setSpecificName] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([]);

  // BIBLE STUDY FORM STATE
  const [studyChapters, setStudyChapters] = useState('');
  const [studyReflection, setStudyReflection] = useState('');

  const daysList = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const presets = ['Pray', 'Bible Study', 'Meditate', 'Gratitude', 'Other'];

  const reminders = religiousActivities.filter(a => a.subType === 'reminder');
  const studies = religiousActivities.filter(a => a.subType === 'bible-study');

  const handleToggleDay = (index: number) => {
    setSelectedDayIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const saveReminder = async () => {
    const finalTitle = reminderType === 'Other' 
      ? specificName 
      : `${reminderType}${specificName ? ': ' + specificName : ''}`;

    const daysToSave = selectedDayIndices.map(i => daysList[i]);

    await addReligiousActivity({
      subType: 'reminder',
      text: finalTitle,
      days: daysToSave,
      time: reminderTime,
      completed: false
    });

    setModalVisible(false);
    setSpecificName('');
    setReminderTime('08:00');
    setSelectedDayIndices([]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={24} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>Faith & Spirit</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: REMINDERS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Daily Reminders</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addSmallBtn, { backgroundColor: isDark ? 'rgba(0, 191, 165, 0.1)' : '#F0FAF9' }]}>
            <Ionicons name="add" size={20} color={MINT_GREEN} />
            <Text style={styles.addSmallText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.remindersList}>
          {reminders.length > 0 ? reminders.map((item) => (
            <View key={item.id} style={[styles.reminderCard, { backgroundColor: theme.card }]}>
              <TouchableOpacity 
                style={styles.checkmark}
                onPress={() => toggleFaithCompletion(item.id, item.completed)}
              >
                <Ionicons 
                  name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={26} 
                  color={item.completed ? MINT_GREEN : (isDark ? "#444" : "#DDD")} 
                />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderText, { color: theme.textDark }, item.completed && styles.textStrike]}>{item.text}</Text>
                <Text style={[styles.reminderSubText, { color: theme.textGrey }]}>{item.time} • {item.days?.join(', ')}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteReligiousActivity(item.id)}>
                <Ionicons name="trash-outline" size={18} color={theme.textGrey} />
              </TouchableOpacity>
            </View>
          )) : (
            <Text style={[styles.emptyText, { color: theme.textGrey }]}>No reminders set yet.</Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* SECTION 2: BIBLE STUDY LOG */}
        <Text style={[styles.sectionTitle, { color: theme.textDark, marginBottom: 15 }]}>Bible Study Vault</Text>
        
        <View style={[styles.studyInputCard, { backgroundColor: theme.vaultBg }]}>
          <TextInput 
            style={[styles.studyInput, { backgroundColor: theme.card, color: theme.textDark }]} 
            placeholder="What are you studying? (e.g. Romans 8)" 
            placeholderTextColor={theme.textGrey}
            value={studyChapters}
            onChangeText={setStudyChapters}
          />
          <TextInput 
            style={[styles.studyInput, { backgroundColor: theme.card, color: theme.textDark, height: 80, paddingTop: 15 }]} 
            placeholder="Key takeaways..." 
            placeholderTextColor={theme.textGrey}
            multiline
            value={studyReflection}
            onChangeText={setStudyReflection}
          />
          <TouchableOpacity 
            style={[styles.logBtn, { backgroundColor: isDark ? MINT_GREEN : theme.textDark }]}
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
            <Text style={[styles.logBtnText, isDark && { color: '#000' }]}>Log Study Session</Text>
          </TouchableOpacity>
        </View>

        {studies.map((study) => (
          <View key={study.id} style={[styles.historyCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.historyVerse, { color: theme.textDark }]}>{study.chaptersVerses}</Text>
            <Text style={[styles.historyRef, { color: isDark ? '#CCC' : '#444' }]}>{study.reflection}</Text>
            <Text style={[styles.historyDate, { color: theme.textGrey }]}>{new Date(study.date).toLocaleDateString()}</Text>
          </View>
        ))}
      </ScrollView>

      {/* CENTERED MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.centerCard, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>Set Reminder</Text>
            
            <Text style={[styles.label, { color: theme.textGrey }]}>Category</Text>
            <View style={styles.presetGrid}>
              {presets.map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setReminderType(p)}
                  style={[styles.presetTile, { backgroundColor: theme.itemBg }, reminderType === p && styles.activePreset]}
                >
                  <Text style={[styles.presetText, { color: theme.textGrey }, reminderType === p && styles.activePresetText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textGrey }]}>{reminderType === 'Other' ? 'Name' : `Specific ${reminderType} Name`}</Text>
            <TextInput 
              style={[styles.customInput, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
              placeholder={reminderType === 'Other' ? "e.g. Fasting" : "e.g. Morning Prayer"}
              placeholderTextColor={theme.textGrey}
              value={specificName}
              onChangeText={setSpecificName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textGrey }]}>Time</Text>
                <View style={[styles.timeContainer, { backgroundColor: theme.itemBg }]}>
                  <Ionicons name="time-outline" size={18} color={MINT_GREEN} />
                  <TextInput 
                    style={[styles.timeInput, { color: theme.textDark }]}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    placeholder="08:00"
                    placeholderTextColor={theme.textGrey}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={[styles.label, { color: theme.textGrey }]}>Frequency</Text>
                <View style={styles.daysRow}>
                  {daysList.map((d, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => handleToggleDay(i)}
                      style={[styles.dayCircle, { backgroundColor: theme.itemBg }, selectedDayIndices.includes(i) && styles.activeDayCircle]}
                    >
                      <Text style={[styles.dayText, { color: theme.textGrey }, selectedDayIndices.includes(i) && styles.activeDayText]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSecondary}>
                <Text style={[styles.btnSecondaryText, { color: theme.textGrey }]}>Cancel</Text>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addSmallText: { color: '#00BFA5', fontWeight: '700', marginLeft: 4 },
  
  remindersList: { marginBottom: 10 },
  reminderCard: { borderRadius: 22, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  checkmark: { paddingRight: 5 },
  reminderText: { fontSize: 16, fontWeight: '700' },
  textStrike: { textDecorationLine: 'line-through', color: '#8E8E93' },
  reminderSubText: { fontSize: 12, marginTop: 2 },
  emptyText: { fontStyle: 'italic', marginBottom: 10 },
  
  divider: { height: 1, marginVertical: 30 },

  studyInputCard: { borderRadius: 28, padding: 15, marginBottom: 25 },
  studyInput: { borderRadius: 18, padding: 15, marginBottom: 10, fontWeight: '600' },
  logBtn: { borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 5 },
  logBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  
  historyCard: { padding: 22, borderRadius: 26, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  historyVerse: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  historyRef: { lineHeight: 22, fontSize: 14, marginBottom: 12 },
  historyDate: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerCard: { width: '100%', borderRadius: 35, padding: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalHeading: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  presetTile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  activePreset: { backgroundColor: '#00BFA5' },
  presetText: { fontWeight: '700', fontSize: 12 },
  activePresetText: { color: '#FFF' },
  customInput: { padding: 14, borderRadius: 15, fontSize: 15, marginBottom: 15, fontWeight: '600' },
  
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, gap: 8 },
  timeInput: { fontSize: 15, fontWeight: '700', width: '100%' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'nowrap' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activeDayCircle: { backgroundColor: '#00BFA5' },
  dayText: { fontWeight: '700', fontSize: 10 },
  activeDayText: { color: '#FFF' },
  
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnSecondary: { flex: 1, padding: 15, alignItems: 'center' },
  btnSecondaryText: { fontWeight: '700' },
  btnPrimary: { flex: 2, backgroundColor: '#00BFA5', padding: 15, borderRadius: 18, alignItems: 'center', elevation: 4, shadowColor: '#00BFA5', shadowOpacity: 0.3, shadowRadius: 10 },
  btnPrimaryText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});