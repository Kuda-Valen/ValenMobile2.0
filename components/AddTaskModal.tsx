import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MINT_GREEN = '#00BFA5';

export default function AddTaskModal({ visible, onClose, selectedDate, folders, onSave }: any) {
  const [title, setTitle] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Personal');
  const [priority, setPriority] = useState('Low');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>New Task for Dec {selectedDate}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#DDD" /></TouchableOpacity>
          </View>

          <TextInput 
            style={styles.mainInput} 
            placeholder="What needs to be done?" 
            placeholderTextColor="#AAA"
            autoFocus
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Select Folder</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}>
            {['School', 'Personal', 'Work'].map(f => (
              <TouchableOpacity 
                key={f} 
                onPress={() => setSelectedFolder(f)}
                style={[styles.chip, selectedFolder === f && styles.activeChip]}
              >
                <Text style={[styles.chipText, selectedFolder === f && styles.activeChipText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {['Low', 'Medium', 'Urgent'].map(p => (
              <TouchableOpacity 
                key={p} 
                onPress={() => setPriority(p)}
                style={[styles.pChip, priority === p && { backgroundColor: p === 'Urgent' ? '#FFE5E5' : '#F0F0F0' }]}
              >
                <Text style={[styles.pText, priority === p && { color: p === 'Urgent' ? '#FF4B4B' : MINT_GREEN }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={() => { onSave({ title, folder: selectedFolder, priority, date: selectedDate }); setTitle(''); onClose(); }}
          >
            <Text style={styles.saveText}>Create Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 450 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  mainInput: { fontSize: 22, fontWeight: '600', color: '#1A1A1A', marginBottom: 25 },
  label: { fontSize: 13, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', marginBottom: 10 },
  folderRow: { flexDirection: 'row', marginBottom: 20 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F0', marginRight: 10 },
  activeChip: { backgroundColor: MINT_GREEN },
  chipText: { fontWeight: '600', color: '#666' },
  activeChipText: { color: '#FFF' },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  pChip: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F5F5F0' },
  pText: { fontWeight: '700', color: '#AAA' },
  saveBtn: { backgroundColor: MINT_GREEN, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});