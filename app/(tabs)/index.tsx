import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useValen } from '../../src/context/ValenContext';

const { width } = Dimensions.get('window');
const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const FADE_BLUE = 'rgba(0, 122, 255, 0.15)';
const FADE_MINT = 'rgba(0, 191, 165, 0.15)';

// --- PREMIUM NEURAL STATUS HEADER ---
const NeuralStatusHeader = ({ profile }) => {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const nextLevelXP = level * 1000;
  const progress = (xp % 1000) / 1000;

  const getRankName = (lvl: number) => {
    if (lvl >= 10) return "Global Titan";
    if (lvl >= 5) return "Executive Strategist";
    if (lvl >= 2) return "Focus Sentinel";
    return "Initial Novice";
  };

  return (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.statusCard}>
      <View style={styles.statusTop}>
        <View>
          <Text style={styles.rankLabel}>CURRENT RANK</Text>
          <Text style={styles.rankName}>{getRankName(level)}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      </View>
      
      <View style={styles.xpTrackContainer}>
        <View style={[styles.xpFill, { width: `${progress * 100}%` }]} />
      </View>
      
      <View style={styles.statusFooter}>
        <Text style={styles.xpDetailText}>{xp} <Text style={{color: TEXT_GREY}}>/ {nextLevelXP} XP</Text></Text>
        <Text style={styles.nextRankHint}>ASCENDING...</Text>
      </View>
    </Animated.View>
  );
};

// --- ANIMATED SVG RING COMPONENT ---
const PremiumRing = ({ progress, size, strokeWidth, activeColor, trackColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.exp),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - animatedProgress.value * circumference;
    return { strokeDashoffset };
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={activeColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} animatedProps={animatedProps}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenterSmall}>
        <Text style={styles.ringPercentTextSmall}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { 
    profile, tasks, folders, modules, addTask, toggleTaskCompletion,
    visions, updateVisionProgress,
    religiousActivities, fitnessActivities,
    toggleFaithCompletion, toggleFitnessCompletion
  } = useValen();
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [fullCalendarVisible, setFullCalendarVisible] = useState(false); 
  
  // --- DYNAMIC GREETING LOGIC ---
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  }, [today]);

  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  
  const weekDates = useMemo(() => {
    const current = new Date();
    const week = [];
    current.setDate(current.getDate() - current.getDay());
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  }, []);

  const monthDays = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
    const padding = Array(firstDay).fill(null);
    return [...padding, ...days];
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskFolder, setTaskFolder] = useState('Personal');
  const [taskPriority, setTaskPriority] = useState('Medium');

  const selectedDayName = useMemo(() => {
    const dateObj = weekDates.find(d => d.getDate() === selectedDate) || today;
    const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return shortDays[dateObj.getDay()];
  }, [selectedDate, weekDates]);

  // --- RING LOGIC (Automatically resets via Context lastResetDate logic) ---
  const academicProgress = useMemo(() => {
    const focusMinutesClocked = profile?.dailyFocusMinutes || 0;
    const dailyGoalMinutes = (profile?.dailyFocusGoalHours || 3) * 60; 
    return Math.min(focusMinutesClocked / dailyGoalMinutes, 1);
  }, [profile]);

  const disciplineProgress = useMemo(() => {
    const dTasks = tasks.filter(t => t.dueDate === selectedDate);
    const academicNudges = modules.filter(m => m.dailyNudge === true);
    const dashboardFaith = religiousActivities.filter(a => a.subType === 'reminder' && a.days?.includes(selectedDayName));
    const dashboardFitness = fitnessActivities.filter(a => a.subType === 'reminder' && a.days?.includes(selectedDayName));
    const dailyDisciplines = visions.filter(v => v.type === 'Discipline' && v.reminder === true);

    const totalItems = dTasks.length + academicNudges.length + dashboardFaith.length + dashboardFitness.length + dailyDisciplines.length;
    if (totalItems === 0) return 0;

    const completedCount = 
      dTasks.filter(t => t.completed).length +
      academicNudges.filter(m => m.completedToday).length +
      dashboardFaith.filter(a => a.completed).length +
      dashboardFitness.filter(a => a.completed).length +
      dailyDisciplines.filter(v => v.progress === 100).length;

    return completedCount / totalItems;
  }, [tasks, modules, religiousActivities, fitnessActivities, visions, selectedDate, selectedDayName]);

  const pillarStats = useMemo(() => {
    const totalHours = modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0);
    const academicPower = Math.min(totalHours / 40, 1);
    const faithPower = religiousActivities.length > 0 ? religiousActivities.filter(a => a.completed).length / religiousActivities.length : 0;
    const fitnessPower = fitnessActivities.length > 0 ? fitnessActivities.filter(a => a.completed).length / fitnessActivities.length : 0;
    const visionPower = visions.length > 0 ? (visions.reduce((acc, v) => acc + (v.progress || 0), 0) / (visions.length * 100)) : 0;

    return [
      { label: 'Academic', val: academicPower, color: '#007AFF' },
      { label: 'Fitness', val: fitnessPower, color: MINT_GREEN },
      { label: 'Faith', val: faithPower, color: '#FF9500' },
      { label: 'Vision', val: visionPower, color: '#AF52DE' },
    ];
  }, [modules, religiousActivities, fitnessActivities, visions]);

  const academicNudges = useMemo(() => modules.filter(m => m.dailyNudge === true), [modules]);
  const dashboardFaith = useMemo(() => religiousActivities.filter(a => a.subType === 'reminder' && a.days?.includes(selectedDayName)), [religiousActivities, selectedDayName]);
  const dashboardFitness = useMemo(() => fitnessActivities.filter(a => a.subType === 'reminder' && a.days?.includes(selectedDayName)), [fitnessActivities, selectedDayName]);
  const dailyDisciplines = useMemo(() => visions.filter(v => v.type === 'Discipline' && v.reminder === true), [visions]);
  
  // --- DAILY AGENDA FILTERING WITH OVERDUE LOGIC ---
  const dailyTasks = useMemo(() => {
    // Current day tasks
    const currentTasks = tasks.filter(t => t.dueDate === selectedDate);
    
    // Overdue tasks: Not completed AND (Due date is in the past OR (Due date is today but time has passed if applicable))
    // Note: Since dueDate is stored as a number (Day of month), we compare it to current Day
    const overdueTasks = tasks.filter(t => 
      !t.completed && 
      t.dueDate < today.getDate() && 
      selectedDate === today.getDate() // Only show overdue tasks when looking at "Today"
    );

    // Merge them and ensure no duplicates
    const combined = [...overdueTasks, ...currentTasks];
    return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [tasks, selectedDate, today]);

  const handleSaveTask = async () => {
    if (!taskTitle) return;
    await addTask({ title: taskTitle, folder: taskFolder, priority: taskPriority, dueDate: selectedDate });
    setTaskTitle('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{profile?.name || 'Valen User'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={() => router.push('/profile')}>
             <Ionicons name="person" size={20} color={MINT_GREEN} />
          </TouchableOpacity>
        </View>

        {/* 1. CALENDAR BLOCK */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>{currentMonthName} {currentYear}</Text>
            <TouchableOpacity onPress={() => setFullCalendarVisible(!fullCalendarVisible)} style={styles.fullCalendarBtn}>
                <Text style={styles.fullCalendarText}>{fullCalendarVisible ? 'Close' : 'Full Month'}</Text>
                <Ionicons name={fullCalendarVisible ? "chevron-up" : "chevron-down"} size={12} color={MINT_GREEN} />
            </TouchableOpacity>
          </View>

          {!fullCalendarVisible ? (
            <View style={styles.daysRow}>
                {weekDates.map((dateObj, index) => {
                const d = dateObj.getDate();
                const isToday = d === today.getDate() && dateObj.getMonth() === today.getMonth();
                return (
                    <TouchableOpacity key={index} onPress={() => setSelectedDate(d)} style={[styles.dayItem, selectedDate === d && styles.selectedDay, isToday && selectedDate !== d && styles.todayHighlight]}>
                    <Text style={[styles.dayLetter, selectedDate === d && { color: '#FFF' }]}>{['S','M','T','W','T','F','S'][index]}</Text>
                    <Text style={[styles.dayDate, selectedDate === d && { color: '#FFF' }]}>{d}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>
          ) : (
            <View style={styles.monthGrid}>
                {['S','M','T','W','T','F','S'].map((day, idx) => (
                    <View key={`header-${day}-${idx}`} style={styles.gridHeader}><Text style={styles.gridHeaderText}>{day}</Text></View>
                ))}
                {monthDays.map((day, idx) => (
                    <TouchableOpacity key={`day-${idx}`} disabled={!day} onPress={() => { setSelectedDate(day!); setFullCalendarVisible(false); }} style={[styles.gridDay, day === selectedDate && styles.gridDaySelected, day === today.getDate() && day !== selectedDate && styles.gridDayToday]}>
                        <Text style={[styles.gridDayText, day === selectedDate && { color: '#FFF' }, !day && { opacity: 0 }]}>{day}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* 2. TWO RINGS BLOCK */}
        <View style={styles.ringsWrapper}>
          <View style={styles.ringCard}>
             <PremiumRing progress={academicProgress} size={90} strokeWidth={14} activeColor="#007AFF" trackColor={FADE_BLUE} />
             <Text style={styles.ringLabel}>Academic</Text>
             <Text style={styles.ringSubLabel}>{Math.round(profile?.dailyFocusMinutes || 0)}m / {(profile?.dailyFocusGoalHours || 3)}h</Text>
          </View>

          <View style={styles.ringCard}>
             <PremiumRing progress={disciplineProgress} size={90} strokeWidth={14} activeColor={MINT_GREEN} trackColor={FADE_MINT} />
             <Text style={styles.ringLabel}>Disciplines</Text>
             <Text style={styles.ringSubLabel}>Daily Tasks</Text>
          </View>
        </View>

        {/* 3. NEURAL STATUS BLOCK */}
        <NeuralStatusHeader profile={profile} />

        {/* DAILY DISCIPLINES BLOCK */}
        {(dailyDisciplines.length > 0 || dashboardFaith.length > 0 || dashboardFitness.length > 0 || academicNudges.length > 0) && (
          <View style={styles.agendaCard}>
            <View style={styles.agendaHeader}>
              <Text style={styles.agendaTitle}>Daily Disciplines</Text>
              <Ionicons name="flash" size={18} color={MINT_GREEN} />
            </View>
            {academicNudges.map((module) => (
              <View key={module.id} style={styles.taskItem}>
                <View style={[styles.checkbox, module.completedToday && styles.checkboxChecked, !module.completedToday && {borderColor: '#DDD', backgroundColor: '#F9F9F9'}]} >
                  {module.completedToday ? <Ionicons name="checkmark" size={14} color="#FFF" /> : <Ionicons name="lock-closed" size={10} color="#CCC" />}
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.taskText, module.completedToday && styles.taskTextDone]}>Study {module.name}</Text>
                  {!module.completedToday && <Text style={{fontSize: 10, color: TEXT_GREY}}>Complete focus session to unlock</Text>}
                </View>
                <View style={[styles.priorityTag, { backgroundColor: '#F0F7FF' }]}><Text style={[styles.priorityText, { color: '#007AFF' }]}>Academic</Text></View>
              </View>
            ))}
            {dailyDisciplines.map((discipline) => (
              <View key={discipline.id} style={styles.taskItem}>
                <TouchableOpacity style={[styles.checkbox, discipline.progress === 100 && styles.checkboxChecked]} onPress={() => updateVisionProgress(discipline.id, discipline.progress === 100 ? 0 : 100)} >
                  {discipline.progress === 100 && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
                <Text style={[styles.taskText, discipline.progress === 100 && styles.taskTextDone]}>{discipline.title}</Text>
                <View style={[styles.priorityTag, { backgroundColor: '#F0FAF9' }]}><Text style={[styles.priorityText, { color: MINT_GREEN }]}>Goal</Text></View>
              </View>
            ))}
            {dashboardFaith.map((item) => (
              <View key={item.id} style={styles.taskItem}>
                <TouchableOpacity style={[styles.checkbox, item.completed && styles.checkboxChecked]} onPress={() => toggleFaithCompletion(item.id, item.completed)}>
                  {item.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
                <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>{item.text}</Text>
                <View style={[styles.priorityTag, { backgroundColor: '#E0F2F1' }]}><Text style={[styles.priorityText, { color: MINT_GREEN }]}>Faith</Text></View>
              </View>
            ))}
            {dashboardFitness.map((item) => (
              <View key={item.id} style={styles.taskItem}>
                <TouchableOpacity style={[styles.checkbox, item.completed && styles.checkboxChecked]} onPress={() => toggleFitnessCompletion(item.id, item.completed)}>
                  {item.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
                <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>{item.title}</Text>
                <View style={[styles.priorityTag, { backgroundColor: '#F1F8E9' }]}><Text style={[styles.priorityText, { color: MINT_GREEN }]}>Fitness</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* DAILY AGENDA */}
        <View style={styles.agendaCard}>
          <View style={styles.agendaHeader}>
            <Text style={styles.agendaTitle}>Daily Agenda</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle" size={24} color={MINT_GREEN} />
            </TouchableOpacity>
          </View>
          {dailyTasks.map((task) => {
            const isOverdue = !task.completed && task.dueDate < today.getDate();
            return (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity style={[styles.checkbox, task.completed && styles.checkboxChecked]} onPress={() => toggleTaskCompletion(task.id, task.completed)}>
                  {task.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>{task.title}</Text>
                  {isOverdue && <Text style={{ fontSize: 10, color: '#FF4B4B', fontWeight: '800' }}>OVERDUE</Text>}
                </View>
                <View style={[styles.priorityTag, { backgroundColor: isOverdue ? '#FFE5E5' : (task.priority === 'Urgent' ? '#FFE5E5' : '#F5F5F0') }]}>
                  <Text style={[styles.priorityText, { color: isOverdue || task.priority === 'Urgent' ? '#FF4B4B' : TEXT_GREY }]}>
                    {isOverdue ? 'CRITICAL' : task.priority}
                  </Text>
                </View>
              </View>
            );
          })}
          {dailyTasks.length === 0 && <Text style={styles.emptyAgenda}>No tasks. Add one to close your ring!</Text>}
        </View>

        {/* PILLAR BALANCE */}
        <View style={styles.analyticsSummaryCard}>
          <View style={styles.agendaHeader}>
            <Text style={styles.agendaTitle}>Pillar Balance</Text>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <Ionicons name="stats-chart" size={18} color={MINT_GREEN} />
            </TouchableOpacity>
          </View>
          <View style={styles.pillarContainer}>
            {pillarStats.map((pillar, idx) => (
              <View key={idx} style={styles.pillarRow}>
                <Text style={styles.pillarLabel}>{pillar.label}</Text>
                <View style={styles.pillarTrack}>
                  <View style={[styles.pillarFill, { width: `${pillar.val * 100}%`, backgroundColor: pillar.color }]} />
                </View>
                <Text style={styles.pillarPercent}>{Math.round(pillar.val * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* TASK MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task • {selectedDate}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={28} color="#DDD" /></TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} placeholder="What needs to be done?" value={taskTitle} onChangeText={setTaskTitle} autoFocus placeholderTextColor={TEXT_GREY} />
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
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  
  statusCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  rankLabel: { color: TEXT_GREY, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  rankName: { color: TEXT_DARK, fontSize: 18, fontWeight: '900' },
  levelBadge: { backgroundColor: MINT_GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  xpTrackContainer: { height: 5, backgroundColor: '#F5F5F0', borderRadius: 2.5, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: MINT_GREEN, borderRadius: 2.5 },
  statusFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  xpDetailText: { color: TEXT_DARK, fontSize: 11, fontWeight: '700' },
  nextRankHint: { color: MINT_GREEN, fontSize: 10, fontWeight: '800' },

  calendarCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  fullCalendarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FAF9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  fullCalendarText: { fontSize: 12, color: MINT_GREEN, fontWeight: '700' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', padding: 10, borderRadius: 16, width: 42 },
  selectedDay: { backgroundColor: MINT_GREEN },
  todayHighlight: { borderWidth: 1, borderColor: MINT_GREEN },
  dayLetter: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginBottom: 4 },
  dayDate: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  ringsWrapper: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  ringCard: { flex: 1, backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  ringCenterSmall: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPercentTextSmall: { fontSize: 16, fontWeight: '900', color: TEXT_DARK },
  ringLabel: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  ringSubLabel: { fontSize: 10, color: TEXT_GREY, fontWeight: '600', marginTop: 2 },
  agendaCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
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
  analyticsSummaryCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  pillarContainer: { marginTop: 5 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pillarLabel: { width: 65, fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  pillarTrack: { flex: 1, height: 6, backgroundColor: '#F5F5F0', borderRadius: 3, overflow: 'hidden', marginHorizontal: 10 },
  pillarFill: { height: '100%', borderRadius: 3 },
  pillarPercent: { width: 30, fontSize: 10, fontWeight: '800', color: TEXT_GREY },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD_WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  modalInput: { fontSize: 22, fontWeight: '600', color: TEXT_DARK, marginBottom: 25 },
  saveBtn: { backgroundColor: MINT_GREEN, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginTop: 10 },
  gridHeader: { width: (width - 80) / 7, alignItems: 'center', marginBottom: 10 },
  gridHeaderText: { fontSize: 10, fontWeight: '800', color: TEXT_GREY },
  gridDay: { width: (width - 80) / 7, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderRadius: 10 },
  gridDaySelected: { backgroundColor: MINT_GREEN },
  gridDayToday: { borderWidth: 1, borderColor: MINT_GREEN },
  gridDayText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK }
});