import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  SafeAreaView, ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const MINT_GREEN = '#00BFA5';

export default function GoalsScreen() {
  const router = useRouter();
  const { visions, addVision, deleteVision, profile } = useValen();

  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F0',
    divider: isDark ? '#333' : '#E0E0E0'
  };

  // MODAL STATES
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'Discipline' | 'Vision'>('Discipline');

  // FORM STATES
  const [title, setTitle] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);

  const presets = [
    { title: 'Read 10 Pages', icon: 'book-outline' },
    { title: 'Plan Tomorrow', icon: 'calendar-outline' },
    { title: 'Deep Work', icon: 'bulb-outline' },
    { title: 'Meditation', icon: 'leaf-outline' },
    { title: 'Journaling', icon: 'pencil-outline' },
    { title: 'No Alcohol', icon: 'wine-outline' },
    { title: 'Limit Screen Time', icon: 'phone-portrait-outline' },
    { title: 'No Junk Food', icon: 'fast-food-outline' },
    { title: 'Wake at 5AM', icon: 'alarm-outline' },
    { title: 'No Caffeine', icon: 'cafe-outline' },
    { title: 'Cold Shower', icon: 'snow-outline' },
    { title: 'Skin Care', icon: 'water-outline' },
  ];

  const handleSave = async () => {
    if (!title) return;
    await addVision({
      title,
      type: modalType,
      reminder: isReminderEnabled,
      completedToday: false,
      progress: 0,
      createdAt: new Date().toISOString()
    });
    setModalVisible(false);
    setTitle('');
  };

  const disciplines = visions.filter(v => v.type === 'Discipline');
  const longTermVisions = visions.filter(v => v.type === 'Vision');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={24} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>Growth Hub</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: CORE DISCIPLINES */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Daily Disciplines</Text>
            <Text style={[styles.sectionSub, { color: theme.textGrey }]}>Tap a preset to activate or create custom</Text>
        </View>

        {/* UPDATED: 2-COLUMN GRID FOR PRESETS */}
        <View style={styles.presetGrid}>
            {presets.map((p, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.presetCard, { backgroundColor: theme.card }]}
                  onPress={() => { setTitle(p.title); setModalType('Discipline'); setModalVisible(true); }}
                >
                    <View style={[styles.presetIconContainer, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]}>
                        <Ionicons name={p.icon as any} size={20} color={MINT_GREEN} />
                    </View>
                    <Text style={[styles.presetText, { color: theme.textDark }]} numberOfLines={1}>{p.title}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* ACTIVE DISCIPLINES LIST */}
        <View style={[styles.listContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.listHeader, { color: theme.textGrey }]}>Active Tracks</Text>
            {disciplines.length > 0 ? disciplines.map(d => (
                <View key={d.id} style={[styles.disciplineRow, { borderBottomColor: theme.border }]}>
                    <Ionicons name="flash" size={18} color={MINT_GREEN} style={{ marginRight: 12 }} />
                    <Text style={[styles.itemText, { color: theme.textDark }]}>{d.title}</Text>
                    {d.reminder && <Ionicons name="notifications-outline" size={14} color={theme.textGrey} style={{marginRight: 10}} />}
                    <TouchableOpacity onPress={() => deleteVision(d.id)}>
                        <Ionicons name="close-circle" size={22} color={theme.bg} />
                    </TouchableOpacity>
                </View>
            )) : (
                <Text style={[styles.emptyText, { color: theme.textGrey }]}>No disciplines active. Select a preset above.</Text>
            )}
            <TouchableOpacity style={styles.addButton} onPress={() => { setModalType('Discipline'); setModalVisible(true); }}>
                <Text style={styles.addButtonText}>+ Custom Discipline</Text>
            </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        {/* SECTION 2: VISION BOARD */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Vision Board</Text>
            <Text style={[styles.sectionSub, { color: theme.textGrey }]}>Long-term milestones & dreams</Text>
        </View>

        <View style={styles.visionGrid}>
            {longTermVisions.map(v => (
                <View key={v.id} style={[styles.visionCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.visionTitle, { color: theme.textDark }]}>{v.title}</Text>
                    <View style={[styles.miniProgress, { backgroundColor: theme.border }]}><View style={[styles.miniFill, {width: '10%'}]} /></View>
                    <TouchableOpacity onPress={() => deleteVision(v.id)} style={styles.trashIcon}>
                        <Ionicons name="trash-outline" size={14} color={theme.textGrey} />
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity 
              style={[styles.visionAddCard, { borderColor: isDark ? '#444' : '#DDD' }]}
              onPress={() => { setModalType('Vision'); setModalVisible(true); }}
            >
                <Ionicons name="add" size={30} color={theme.textGrey} />
                <Text style={[styles.visionAddText, { color: theme.textGrey }]}>New Vision</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL REMAINING THE SAME TO PROTECT LOGIC */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={[styles.centerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalHeading, { color: theme.textDark }]}>New {modalType}</Text>
            
            <TextInput 
              style={[styles.input, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
              placeholder={modalType === 'Discipline' ? "e.g. Morning Walk" : "e.g. Buy a Porsche"}
              placeholderTextColor={theme.textGrey}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <View style={styles.switchRow}>
                <View>
                    <Text style={[styles.switchLabel, { color: theme.textDark }]}>Daily Reminder</Text>
                    <Text style={[styles.switchSub, { color: theme.textGrey }]}>Show on Command Center</Text>
                </View>
                <Switch 
                  value={isReminderEnabled} 
                  onValueChange={setIsReminderEnabled}
                  trackColor={{ false: '#DDD', true: MINT_GREEN }}
                />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSec}><Text style={[styles.btnSecText, { color: theme.textGrey }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.btnPrim}><Text style={styles.btnPrimText}>Activate</Text></TouchableOpacity>
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
  backBtn: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  sectionSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  presetCard: { width: '48%', padding: 15, borderRadius: 20, marginBottom: 12, alignItems: 'center', flexDirection: 'row', gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  presetIconContainer: { padding: 8, borderRadius: 10 },
  presetText: { fontWeight: '700', fontSize: 12, flex: 1 },
  listContainer: { borderRadius: 28, padding: 20, marginBottom: 30 },
  listHeader: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  disciplineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  itemText: { fontSize: 15, fontWeight: '600', flex: 1 },
  emptyText: { textAlign: 'center', fontSize: 13, marginVertical: 20 },
  addButton: { paddingVertical: 15, alignItems: 'center', marginTop: 5 },
  addButtonText: { color: MINT_GREEN, fontWeight: '800', fontSize: 14 },
  divider: { height: 1, marginBottom: 30 },
  visionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  visionCard: { width: '48%', borderRadius: 24, padding: 20, height: 120, justifyContent: 'space-between' },
  visionTitle: { fontSize: 15, fontWeight: '800' },
  miniProgress: { height: 4, borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: MINT_GREEN },
  trashIcon: { alignSelf: 'flex-end' },
  visionAddCard: { width: '48%', height: 120, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  visionAddText: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  centerCard: { borderRadius: 32, padding: 25 },
  modalHeading: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  input: { borderRadius: 15, padding: 18, fontSize: 16, fontWeight: '600', marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  switchLabel: { fontWeight: '800' },
  switchSub: { fontSize: 11, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btnSec: { padding: 12 },
  btnSecText: { fontWeight: '700' },
  btnPrim: { backgroundColor: MINT_GREEN, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  btnPrimText: { color: '#FFF', fontWeight: '800' }
});