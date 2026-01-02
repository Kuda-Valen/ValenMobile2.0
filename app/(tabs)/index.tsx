import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Added for navigation
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useValen } from '../../src/context/ValenContext';

// CONSISTENT PREMIUM PALETTE
const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function Dashboard() {
  const router = useRouter(); // Initialize router
  const { profile, timerState, startFocusSession, pauseFocusSession, tasks, folders, modules, addTask, toggleTaskCompletion } = useValen();
  
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskFolder, setTaskFolder] = useState('Personal');
  const [taskPriority, setTaskPriority] = useState('Medium');

  // --- NUDGE LOGIC ---
  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const todayStudyNudge = useMemo(() => {
    return modules.find(m => m.schedule?.some((s: any) => s.day === todayName));
  }, [modules, todayName]);

  const dailyTasks = tasks.filter(t => t.dueDate === selectedDate);
  
  // --- FITNESS RING CALCULATION ---
  const ringProgress = useMemo(() => {
    if (dailyTasks.length === 0) return 0;
    const completedTasks = dailyTasks.filter(t => t.completed).length;
    const taskScore = completedTasks / dailyTasks.length;
    
    // Focus Score based on 2-hour goal
    const totalGoalSeconds = 2 * 60 * 60;
    const focusSecondsClocked = (profile?.dailyFocusMinutes || 0) * 60; 
    const focusScore = Math.min(focusSecondsClocked / totalGoalSeconds, 1);

    return (taskScore * 0.7) + (focusScore * 0.3);
  }, [tasks, selectedDate, profile]);

  const progressPercent = ringProgress;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSaveTask = async () => {
    if (!taskTitle) return;
    await addTask({ title: taskTitle, folder: taskFolder, priority: taskPriority, dueDate: selectedDate });
    setTaskTitle('');
    setModalVisible(false);
  };

  const dates = [28, 29, 30, 31, 1, 2, 3];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER: Profile Navigation Integrated */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{profile?.name || 'Kuda'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarPlaceholder}
            onPress={() => router.push('/profile')} // Navigates to profile screen
          >
             <Ionicons name="person" size={20} color={MINT_GREEN} />
          </TouchableOpacity>
        </View>

        {/* STUDY NUDGE CARD: Procrastination Assistant */}
        {todayStudyNudge && !timerState.isRunning && (
          <TouchableOpacity 
            style={styles.nudgeCard} 
            onPress={() => startFocusSession({ duration: 25, moduleId: todayStudyNudge.id, topic: `Study: ${todayStudyNudge.code}` })}
          >
            <View style={styles.nudgeInfo}>
              <View style={styles.nudgeIcon}><Ionicons name="notifications" size={20} color="#FFF" /></View>
              <View>
                <Text style={styles.nudgeTitle}>Study {todayStudyNudge.code}?</Text>
                <Text style={styles.nudgeSub}>Scheduled for {todayName}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MINT_GREEN} />
          </TouchableOpacity>
        )}

        {/* CALENDAR WIDGET */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>December 2025</Text>
            <Ionicons name="calendar-outline" size={16} color={TEXT_GREY} />
          </View>
          <View style={styles.daysRow}>
            {dates.map((date, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setSelectedDate(date)} 
                style={[styles.dayItem, selectedDate === date && styles.selectedDay]}
              >
                <Text style={[styles.dayLetter, selectedDate === date && { color: '#FFF' }]}>{['S','M','T','W','T','F','S'][index]}</Text>
                <Text style={[styles.dayDate, selectedDate === date && { color: '#FFF' }]}>{date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FOCUS RING: Fitness Style */}
        <View style={styles.focusCard}>
          <View style={styles.ringContainer}>
            <View style={styles.outerRing}>
               <View style={styles.innerRing} />
               <View style={[
                 styles.progressFill, 
                 { 
                   borderTopColor: MINT_GREEN, 
                   borderRightColor: progressPercent > 0.25 ? MINT_GREEN : 'transparent',
                   borderBottomColor: progressPercent > 0.5 ? MINT_GREEN : 'transparent',
                   borderLeftColor: progressPercent > 0.75 ? MINT_GREEN : 'transparent',
                   transform: [{ rotate: `${progressPercent * 360}deg` }] 
                 }
               ]} />
               <View style={styles.ringCenter}>
                  <Text style={styles.percentageText}>{Math.round(progressPercent * 100)}%</Text>
                  <Text style={styles.sessionType}>CLOSED</Text>
               </View>
            </View>
            <View style={styles.focusStats}>
              <Text style={styles.focusTitle}>{timerState.activeModuleId ? "Study Session" : "Focus Timer"}</Text>
              <Text style={styles.timerLive}>{timerState?.isRunning ? formatTime(timerState.timeRemaining) : "25:00"}</Text>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => timerState?.isRunning ? pauseFocusSession() : startFocusSession({ duration: 25 })}
              >
                <Ionicons name={timerState?.isRunning ? "pause" : "play"} size={16} color={MINT_GREEN} />
                <Text style={styles.actionBtnText}>{timerState?.isRunning ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AGENDA CARD */}
        <View style={styles.agendaCard}>
          <View style={styles.agendaHeader}>
            <Text style={styles.agendaTitle}>Daily Agenda</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle" size={24} color={MINT_GREEN} />
            </TouchableOpacity>
          </View>
          {dailyTasks.length > 0 ? dailyTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <TouchableOpacity 
                style={[styles.checkbox, task.completed && styles.checkboxChecked]} 
                onPress={() => toggleTaskCompletion(task.id, task.completed)}
              >
                {task.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </TouchableOpacity>
              <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>{task.title}</Text>
              <View style={[styles.priorityTag, { backgroundColor: task.priority === 'Urgent' ? '#FFE5E5' : '#F5F5F0' }]}>
                <Text style={[styles.priorityText, { color: task.priority === 'Urgent' ? '#FF4B4B' : TEXT_GREY }]}>{task.priority}</Text>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyAgenda}>No tasks. Add one to close your ring!</Text>
          )}
        </View>
      </ScrollView>

      {/* TASK MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task • Dec {selectedDate}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={28} color="#DDD" /></TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} placeholder="What needs to be done?" value={taskTitle} onChangeText={setTaskTitle} autoFocus placeholderTextColor={TEXT_GREY} />
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {['Low', 'Medium', 'Urgent'].map(p => (
                <TouchableOpacity key={p} onPress={() => setTaskPriority(p)} style={[styles.pChip, taskPriority === p && styles.activePChip]}>
                  <Text style={[styles.pText, taskPriority === p && styles.activePText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Select Folder</Text>
            <View style={styles.folderRow}>
              {folders.map(f => (
                <TouchableOpacity key={f.id || f.name} onPress={() => setTaskFolder(f.name)} style={[styles.chip, taskFolder === f.name && styles.activeChip]}>
                  <Text style={[styles.chipText, taskFolder === f.name && {color: '#FFF'}]}>{f.name || f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTask}>
              <Text style={styles.saveText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 13, color: TEXT_GREY, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: TEXT_DARK },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  
  nudgeCard: { backgroundColor: TEXT_DARK, borderRadius: 24, padding: 18, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  nudgeInfo: { flexDirection: 'row', alignItems: 'center' },
  nudgeIcon: { backgroundColor: MINT_GREEN, padding: 8, borderRadius: 12, marginRight: 15 },
  nudgeTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  nudgeSub: { color: TEXT_GREY, fontSize: 12 },

  calendarCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  monthText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', padding: 10, borderRadius: 16, width: 44 },
  selectedDay: { backgroundColor: MINT_GREEN },
  dayLetter: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginBottom: 4 },
  dayDate: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },

  focusCard: { backgroundColor: CARD_WHITE, borderRadius: 28, padding: 25, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  ringContainer: { flexDirection: 'row', alignItems: 'center' },
  outerRing: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  innerRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: CARD_WHITE, zIndex: 2 },
  progressFill: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 10, borderColor: 'transparent', zIndex: 1 },
  ringCenter: { alignItems: 'center', zIndex: 3 },
  percentageText: { fontSize: 22, fontWeight: '900', color: TEXT_DARK },
  sessionType: { fontSize: 8, color: TEXT_GREY, fontWeight: '700', letterSpacing: 1 },
  
  focusStats: { flex: 1, marginLeft: 25 },
  focusTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  timerLive: { fontSize: 16, fontWeight: '600', color: MINT_GREEN, marginVertical: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginTop: 10, backgroundColor: '#F0FAF9', alignSelf: 'flex-start' },
  actionBtnText: { fontWeight: '700', fontSize: 13, marginLeft: 5, color: MINT_GREEN },

  agendaCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15 },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  agendaTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F0' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#EEE', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: MINT_GREEN, borderColor: MINT_GREEN },
  taskText: { fontSize: 15, color: TEXT_DARK, fontWeight: '600', flex: 1 },
  taskTextDone: { textDecorationLine: 'line-through', color: TEXT_GREY },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  emptyAgenda: { textAlign: 'center', color: TEXT_GREY, paddingVertical: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD_WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  modalInput: { fontSize: 22, fontWeight: '600', color: TEXT_DARK, marginBottom: 25 },
  label: { fontSize: 12, color: TEXT_GREY, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pChip: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F5F5F0' },
  activePChip: { backgroundColor: '#F0FAF9', borderWidth: 1, borderColor: MINT_GREEN },
  pText: { fontWeight: '700', color: '#AAA', fontSize: 12 },
  activePText: { color: MINT_GREEN },
  folderRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F0' },
  activeChip: { backgroundColor: MINT_GREEN },
  chipText: { fontWeight: '600', color: '#666' },
  saveBtn: { backgroundColor: MINT_GREEN, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});