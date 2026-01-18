import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function AddTaskModal({ visible, onClose, folders, onSave, initialFolder }: any) {
  const [title, setTitle] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Personal');
  const [priority, setPriority] = useState('Low');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false); // iOS Logic
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (initialFolder) setSelectedFolder(initialFolder);
  }, [initialFolder, visible]);

  // Handle Date/Time Change
  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowCalendar(false); // Hide for Android after selection
    setDate(currentDate);
  };

  // Android Specific Calendar Trigger
  const showAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      onChange,
      mode: 'date',
      display: 'calendar',
    });
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      folder: selectedFolder,
      priority,
      date: date.getDate(),
      fullDate: date,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <Animated.View entering={FadeInUp} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#DDD" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.mainInput}
            placeholder="What needs to be done?"
            placeholderTextColor={TEXT_GREY}
            autoFocus
            value={title}
            onChangeText={setTitle}
          />

          {/* TIMELINE SECTION */}
          <View style={styles.pickerSection}>
            <Text style={styles.label}>Execution Timeline</Text>
            <View style={styles.pickerRow}>
              {/* Date Button */}
              <TouchableOpacity 
                style={styles.pickerBtn} 
                onPress={Platform.OS === 'android' ? showAndroidPicker : () => setShowCalendar(true)}
              >
                <Ionicons name="calendar" size={20} color={MINT_GREEN} />
                <Text style={styles.pickerBtnText}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>

              {/* iOS Only Inline Calendar Trigger */}
              {showCalendar && Platform.OS === 'ios' && (
                <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />
              )}

              {/* Professional Apple-style Time Spinner (Small & Integrated) */}
              <View style={styles.timePickerContainer}>
                <Ionicons name="time" size={18} color={MINT_GREEN} />
                <DateTimePicker
                  value={date}
                  mode="time"
                  display="compact" // Standard Apple compact scroll
                  is24Hour={true}
                  onChange={onChange}
                  style={styles.nativeTimePicker}
                />
              </View>
            </View>
          </View>

          {/* COLLECTION DROPDOWN */}
          <Text style={styles.label}>Select Collection</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <View style={styles.dropdownInner}>
              <Ionicons name="folder-open" size={20} color={MINT_GREEN} />
              <Text style={styles.dropdownText}>{selectedFolder}</Text>
            </View>
            <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={20} color={TEXT_GREY} />
          </TouchableOpacity>

          {dropdownVisible && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.dropdownMenu}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                {folders.map((f: any) => (
                  <TouchableOpacity 
                    key={f.id} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedFolder(f.name);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={[styles.itemText, selectedFolder === f.name && { color: MINT_GREEN, fontWeight: '800' }]}>{f.name}</Text>
                    {selectedFolder === f.name && <Ionicons name="checkmark-circle" size={18} color={MINT_GREEN} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* PRIORITY SELECTION */}
          <Text style={styles.label}>Set Priority</Text>
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save Task</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 25, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  mainInput: { fontSize: 22, fontWeight: '600', color: TEXT_DARK, marginBottom: 25 },
  label: { fontSize: 11, color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 10 },
  
  pickerSection: { marginBottom: 25 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F0', padding: 12, borderRadius: 16 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 5 },
  pickerBtnText: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },

  timePickerContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nativeTimePicker: { width: 85, height: 40 },

  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F5F0', padding: 18, borderRadius: 18, marginBottom: 10 },
  dropdownInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  dropdownMenu: { backgroundColor: '#F9F9F7', borderRadius: 18, padding: 5, marginBottom: 15, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemText: { fontSize: 14, fontWeight: '600', color: TEXT_GREY },

  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  pChip: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F5F5F0' },
  pText: { fontWeight: '800', color: '#AAA', fontSize: 12 },

  saveBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  saveText: { color: '#FFF', fontSize: 17, fontWeight: '800' }
});