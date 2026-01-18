import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  SafeAreaView, ScrollView, StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function GoalsScreen() {
  const router = useRouter();
  const { visions, addVision, deleteVision } = useValen();

  // MODAL STATES
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'Discipline' | 'Vision'>('Discipline');

  // FORM STATES
  const [title, setTitle] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);

  // Expanded and converted to a grid-friendly list
  const presets = [
    { title: 'Read 10 Pages', icon: 'book-outline' },
    { title: 'Plan Tomorrow', icon: 'calendar-outline' },
    { title: 'Deep Work', icon: 'bulb-outline' },
    { title: 'Skin Care', icon: 'water-outline' },
    { title: 'Meditation', icon: 'leaf-outline' },
    { title: 'Cold Shower', icon: 'snow-outline' },
    { title: 'Journaling', icon: 'pencil-outline' },
    { title: 'No Caffeine', icon: 'cafe-outline' },
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Growth Hub</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: CORE DISCIPLINES */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Disciplines</Text>
            <Text style={styles.sectionSub}>Tap a preset to activate or create custom</Text>
        </View>

        {/* UPDATED: 2-COLUMN GRID FOR PRESETS */}
        <View style={styles.presetGrid}>
            {presets.map((p, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.presetCard}
                  onPress={() => { setTitle(p.title); setModalType('Discipline'); setModalVisible(true); }}
                >
                    <View style={styles.presetIconContainer}>
                        <Ionicons name={p.icon as any} size={20} color={MINT_GREEN} />
                    </View>
                    <Text style={styles.presetText} numberOfLines={1}>{p.title}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* ACTIVE DISCIPLINES LIST */}
        <View style={styles.listContainer}>
            <Text style={styles.listHeader}>Active Tracks</Text>
            {disciplines.length > 0 ? disciplines.map(d => (
                <View key={d.id} style={styles.disciplineRow}>
                    <Ionicons name="flash" size={18} color={MINT_GREEN} style={{ marginRight: 12 }} />
                    <Text style={styles.itemText}>{d.title}</Text>
                    {d.reminder && <Ionicons name="notifications-outline" size={14} color={TEXT_GREY} style={{marginRight: 10}} />}
                    <TouchableOpacity onPress={() => deleteVision(d.id)}>
                        <Ionicons name="close-circle" size={22} color="#F5F5F0" />
                    </TouchableOpacity>
                </View>
            )) : (
                <Text style={styles.emptyText}>No disciplines active. Select a preset above.</Text>
            )}
            <TouchableOpacity style={styles.addButton} onPress={() => { setModalType('Discipline'); setModalVisible(true); }}>
                <Text style={styles.addButtonText}>+ Custom Discipline</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* SECTION 2: VISION BOARD */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vision Board</Text>
            <Text style={styles.sectionSub}>Long-term milestones & dreams</Text>
        </View>

        <View style={styles.visionGrid}>
            {longTermVisions.map(v => (
                <View key={v.id} style={styles.visionCard}>
                    <Text style={styles.visionTitle}>{v.title}</Text>
                    <View style={styles.miniProgress}><View style={[styles.miniFill, {width: '10%'}]} /></View>
                    <TouchableOpacity onPress={() => deleteVision(v.id)} style={styles.trashIcon}>
                        <Ionicons name="trash-outline" size={14} color={TEXT_GREY} />
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity 
              style={styles.visionAddCard}
              onPress={() => { setModalType('Vision'); setModalVisible(true); }}
            >
                <Ionicons name="add" size={30} color={TEXT_GREY} />
                <Text style={styles.visionAddText}>New Vision</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL REMAINING THE SAME TO PROTECT LOGIC */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.centerCard}>
            <Text style={styles.modalHeading}>New {modalType}</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder={modalType === 'Discipline' ? "e.g. Morning Walk" : "e.g. Buy a Porsche"}
              placeholderTextColor={TEXT_GREY}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.switchLabel}>Daily Reminder</Text>
                    <Text style={styles.switchSub}>Show on Command Center</Text>
                </View>
                <Switch 
                  value={isReminderEnabled} 
                  onValueChange={setIsReminderEnabled}
                  trackColor={{ false: '#DDD', true: MINT_GREEN }}
                />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnSec}><Text style={styles.btnSecText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.btnPrim}><Text style={styles.btnPrimText}>Activate</Text></TouchableOpacity>
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
  backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  scrollContent: { padding: 20 },

  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  sectionSub: { fontSize: 13, color: TEXT_GREY, fontWeight: '500', marginTop: 2 },

  // UPDATED: PRESET GRID STYLES
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  presetCard: { backgroundColor: CARD_WHITE, width: '48%', padding: 15, borderRadius: 20, marginBottom: 12, alignItems: 'center', flexDirection: 'row', gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  presetIconContainer: { backgroundColor: '#F0FAF9', padding: 8, borderRadius: 10 },
  presetText: { fontWeight: '700', color: TEXT_DARK, fontSize: 12, flex: 1 },

  listContainer: { backgroundColor: CARD_WHITE, borderRadius: 28, padding: 20, marginBottom: 30 },
  listHeader: { fontSize: 11, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  disciplineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F0' },
  itemText: { fontSize: 15, fontWeight: '600', color: TEXT_DARK, flex: 1 },
  emptyText: { textAlign: 'center', color: TEXT_GREY, fontSize: 13, marginVertical: 20 },
  addButton: { paddingVertical: 15, alignItems: 'center', marginTop: 5 },
  addButtonText: { color: MINT_GREEN, fontWeight: '800', fontSize: 14 },

  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 30 },

  visionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  visionCard: { backgroundColor: CARD_WHITE, width: '48%', borderRadius: 24, padding: 20, height: 120, justifyContent: 'space-between' },
  visionTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  miniProgress: { height: 4, backgroundColor: '#F5F5F0', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: MINT_GREEN },
  trashIcon: { alignSelf: 'flex-end' },

  visionAddCard: { width: '48%', height: 120, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  visionAddText: { fontSize: 12, fontWeight: '700', color: TEXT_GREY, marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  centerCard: { backgroundColor: CARD_WHITE, borderRadius: 32, padding: 25 },
  modalHeading: { fontSize: 20, fontWeight: '900', color: TEXT_DARK, textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#F5F5F0', borderRadius: 15, padding: 18, fontSize: 16, fontWeight: '600', marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  switchLabel: { fontWeight: '800', color: TEXT_DARK },
  switchSub: { fontSize: 11, color: TEXT_GREY, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btnSec: { padding: 12 },
  btnSecText: { color: TEXT_GREY, fontWeight: '700' },
  btnPrim: { backgroundColor: MINT_GREEN, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  btnPrimText: { color: '#FFF', fontWeight: '800' }
});