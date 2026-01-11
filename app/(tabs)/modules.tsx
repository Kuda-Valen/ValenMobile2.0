import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
import { useValen } from '../../src/context/ValenContext';

const { width } = Dimensions.get('window');

const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';
const BREAK_BG = '#E0F2F1'; // Softer teal for break phase

const PREMIUM_ICONS = [
  'book', 'calculator', 'flask', 'language', 'code-working', 
  'color-palette', 'globe', 'musical-notes', 'business', 
  'fitness', 'medkit', 'construct', 'layers', 'terminal'
];

const TIMER_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);
const ITEM_HEIGHT = 50;

export default function ModulesScreen() {
  const { 
    modules, 
    addModule, 
    startFocusSession, 
    pauseFocusSession, 
    timerState, 
    resetTimer,
    stopAndSaveSession,
    setTimerConfig,
    setSessionTopic,
    selectModule,
    stopFocusSession // Added to allow clean exit from breaks
  } = useValen();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [activeStudyView, setActiveStudyView] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [sessionSummary, setSessionSummary] = useState('');
  const [newModule, setNewModule] = useState({ 
    name: '', 
    code: '', 
    icon: 'book', 
    dailyNudge: true, 
    targetHours: '1' 
  });

  const pulseValue = useSharedValue(0);

  // Determine Phase
  const isBreak = timerState.currentPhase === 'Break';

  useEffect(() => {
    if (timerState.isRunning) {
      pulseValue.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = withTiming(0);
    }
  }, [timerState.isRunning]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseValue.value, [0, 1], [1, 0.5]),
    transform: [{ scale: interpolate(pulseValue.value, [0, 1], [1, 1.03]) }]
  }));

  useEffect(() => {
    if (timerState.activeModuleId) {
      setActiveStudyView(true);
    } else {
      setActiveStudyView(false);
    }
  }, [timerState.activeModuleId]);

  // Handle natural session completion (Natural end of study timer)
  useEffect(() => {
    if (timerState.timeRemaining === 0 && !isBreak && timerState.activeModuleId && !timerState.isRunning) {
        setCelebrationVisible(true);
        setActiveStudyView(false);
    }
  }, [timerState.timeRemaining, timerState.isRunning, isBreak]);

  const handleCreateModule = async () => {
    if(!newModule.name) return;
    await addModule({ ...newModule, hoursDone: 0, completedToday: false });
    setModalVisible(false);
    setNewModule({ name: '', code: '', icon: 'book', dailyNudge: true, targetHours: '1' });
  };

  const handleFinishCelebration = async () => {
    // We pass the summary to the context function
    await stopAndSaveSession(sessionSummary);
    setCelebrationVisible(false);
    setSessionSummary('');
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = isNaN(seconds) ? 0 : seconds;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeModule = useMemo(() => {
    return modules.find(m => m.id === timerState.activeModuleId);
  }, [timerState.activeModuleId, modules]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const value = TIMER_VALUES[index];
    if (value && !timerState.isRunning && !timerState.isPomodoro) {
      setTimerConfig(false, value);
    }
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
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Total Study Time</Text>
            <Text style={styles.summaryValue}>
              {modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0).toFixed(1)} 
              <Text style={{ fontSize: 18, color: TEXT_GREY }}> hrs</Text>
            </Text>
          </View>
          <View style={styles.summaryCircle}>
            <Ionicons name="stats-chart" size={24} color={MINT_GREEN} />
          </View>
        </View>

        {timerState.activeModuleId && (
          <TouchableOpacity style={styles.liveFocusCard} onPress={() => setActiveStudyView(true)}>
            <View style={styles.liveFocusInfo}>
              <View style={[styles.liveIconBg, isBreak && { backgroundColor: MINT_GREEN }]}>
                <Ionicons name={isBreak ? "cafe" : (activeModule?.icon as any || 'book')} size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.liveModuleName}>{isBreak ? "Break Time" : activeModule?.name}</Text>
                <Text style={styles.liveStatus}>
                    {isBreak ? "Recharging mind..." : (timerState.isRunning ? 'Deep focus active' : 'Focus paused')}
                </Text>
              </View>
            </View>
            <Animated.View style={[styles.liveTimerBadge, timerState.isRunning && animatedPulseStyle]}>
              <Text style={[styles.liveTimerText, isBreak && { color: MINT_GREEN }]}>
                {formatTime(timerState.timeRemaining)}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        )}

        <View style={styles.grid}>
          {modules.map((m) => (
            <TouchableOpacity key={m.id} style={styles.moduleCard} onPress={() => selectModule(m.id)}>
              <View style={styles.moduleHeader}>
                <View style={styles.iconBg}><Ionicons name={m.icon as any || 'book'} size={18} color={MINT_GREEN} /></View>
                {m.dailyNudge && <Ionicons name="notifications-outline" size={16} color={MINT_GREEN} />}
              </View>
              <Text style={styles.moduleName} numberOfLines={1}>{m.name}</Text>
              <View style={styles.moduleFooter}>
                <View style={styles.progressMini}>
                  <View style={[styles.progressMiniFill, { width: `${Math.min(((m.hoursDone || 0)/20)*100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{m.hoursDone?.toFixed(1) || 0}h clocked</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.moduleCard, styles.dashed]} onPress={() => setModalVisible(true)}>
             <Ionicons name="add" size={32} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- FOCUS MODE MODAL --- */}
      <Modal visible={activeStudyView} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.focusContainer, isBreak && { backgroundColor: BREAK_BG }]}>
          <View style={styles.focusHeader}>
            <TouchableOpacity onPress={() => setActiveStudyView(false)}>
              <Ionicons name="chevron-down" size={30} color={TEXT_DARK} />
            </TouchableOpacity>
            <Text style={[styles.focusTitle, isBreak && { color: MINT_GREEN, fontWeight: '900' }]}>
                {isBreak ? 'RECHARGE' : 'DEEP WORK'}
            </Text>
            <View style={{width: 30}} />
          </View>

          <View style={styles.focusContent}>
            <View style={[styles.focusIconCircle, isBreak && { borderColor: MINT_GREEN, borderWidth: 3 }]}>
              <Ionicons 
                name={isBreak ? "cafe-outline" : (activeModule?.icon as any || 'book')} 
                size={50} 
                color={isBreak ? MINT_GREEN : TEXT_DARK} 
              />
            </View>
            <Text style={styles.focusModuleName}>
                {isBreak ? 'Time to Recharge' : (activeModule?.name || 'Session')}
            </Text>
            
            {!timerState.isRunning && !timerState.isPomodoro && !isBreak ? (
                <View style={styles.wheelContainer}>
                    <View style={styles.wheelHighlight} />
                    <FlatList
                        data={TIMER_VALUES}
                        keyExtractor={(item) => item.toString()}
                        snapToInterval={ITEM_HEIGHT}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={onScroll}
                        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                        renderItem={({ item }) => (
                            <View style={styles.wheelItem}><Text style={styles.wheelText}>{item} min</Text></View>
                        )}
                    />
                </View>
            ) : (
                <View style={styles.timerWrapper}>
                  <Animated.Text style={[styles.timerDigits, timerState.isRunning && animatedPulseStyle, isBreak && { color: MINT_GREEN }]}>
                    {formatTime(timerState.timeRemaining)}
                  </Animated.Text>
                  <Text style={styles.timerSubText}>
                      {isBreak ? 'Rest your eyes & hydrate' : (timerState.isPomodoro ? 'POMODORO FLOW' : 'CUSTOM SESSION')}
                  </Text>
                </View>
            )}

            {!isBreak && (
                <Animated.View entering={FadeIn} style={styles.topicCard}>
                    <Text style={styles.label}>Focus Objective</Text>
                    <TextInput 
                        style={styles.topicInput} 
                        placeholder="Current focus..." 
                        placeholderTextColor={TEXT_GREY} 
                        value={timerState.topic} 
                        onChangeText={setSessionTopic}
                    />
                </Animated.View>
            )}

            {isBreak && (
                <Animated.View entering={ZoomIn} style={styles.breakCard}>
                    <Text style={styles.breakText}>Your study session has been logged. Stand up, stretch, and take a deep breath.</Text>
                    <TouchableOpacity 
                        style={styles.skipBreakBtn} 
                        onPress={() => resetTimer()} // Custom logic in Context can reset to study
                    >
                        <Text style={styles.skipBreakText}>Skip Break</Text>
                        <Ionicons name="play-skip-forward" size={16} color={MINT_GREEN} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {!timerState.isRunning && !isBreak && (
              <View style={styles.modeToggleRow}>
                <TouchableOpacity style={[styles.modeBtn, timerState.isPomodoro && styles.activeModeBtn]} onPress={() => setTimerConfig(true, 25)}>
                  <Text style={[styles.modeBtnText, timerState.isPomodoro && styles.activeModeText]}>Pomodoro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, !timerState.isPomodoro && styles.activeModeBtn]} onPress={() => setTimerConfig(false, 60)}>
                  <Text style={[styles.modeBtnText, !timerState.isPomodoro && styles.activeModeText]}>Custom</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.secBtn} onPress={resetTimer}>
                <Ionicons name="refresh-outline" size={28} color={TEXT_GREY} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mainPlayBtn, isBreak && { backgroundColor: MINT_GREEN }]} 
                onPress={timerState.isRunning ? pauseFocusSession : () => startFocusSession()}
              >
                <Ionicons name={timerState.isRunning ? "pause" : "play"} size={40} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secBtn} 
                onPress={() => { 
                    if (isBreak) stopFocusSession();
                    else { stopAndSaveSession(); setCelebrationVisible(true); } 
                }}
              >
                <Ionicons name="stop" size={28} color="#FF4B4B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shieldNotice}>
                <Ionicons name="shield-checkmark" size={14} color={isBreak ? MINT_GREEN : TEXT_GREY} />
                <Text style={styles.shieldText}>Focus Shield Active</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* --- CELEBRATION MODAL --- */}
      <Modal visible={celebrationVisible} animationType="fade" transparent>
        <View style={styles.celebrationOverlay}>
          <Animated.View entering={ZoomIn.duration(500)} style={styles.celebrationCard}>
            <View style={styles.confettiIcon}>
              <Ionicons name="trophy" size={50} color={MINT_GREEN} />
            </View>
            <Text style={styles.celebrationTitle}>Session Complete!</Text>
            <Text style={styles.celebrationSub}>You've moved closer to your academic goals. What did you achieve?</Text>
            
            <TextInput 
                style={styles.summaryInput} 
                placeholder="Brief summary of your study session..." 
                multiline
                value={sessionSummary}
                onChangeText={setSessionSummary}
                placeholderTextColor={TEXT_GREY}
            />

            <View style={styles.motivationBox}>
                <Ionicons name="bulb-outline" size={16} color={MINT_GREEN} />
                <Text style={styles.motivationText}>"Consistency is the hardware of success."</Text>
            </View>

            <TouchableOpacity style={styles.celebrationBtn} onPress={handleFinishCelebration}>
              <Text style={styles.celebrationBtnText}>Log Achievement</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* --- ADD MODULE MODAL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetIndicator} />
            <Text style={styles.modalTitle}>New Module</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Module Name" 
                value={newModule.name} 
                onChangeText={(t) => setNewModule({...newModule, name: t})} 
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconList}>
              {PREMIUM_ICONS.map(icon => (
                <TouchableOpacity 
                    key={icon} 
                    onPress={() => setNewModule({...newModule, icon})} 
                    style={[styles.iconChoice, newModule.icon === icon && styles.activeIcon]}
                >
                    <Ionicons name={icon as any} size={22} color={newModule.icon === icon ? '#FFF' : TEXT_GREY} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateModule}>
                <Text style={styles.saveBtnText}>Activate Module</Text>
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
  summaryCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 25, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: TEXT_GREY, fontWeight: '600' },
  summaryValue: { fontSize: 32, fontWeight: '900', color: TEXT_DARK, marginTop: 4 },
  summaryCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: { backgroundColor: CARD_WHITE, width: (width - 55) / 2, height: 150, borderRadius: 24, padding: 18, marginBottom: 15, justifyContent: 'space-between' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  iconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center' },
  moduleName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  moduleFooter: { gap: 8 },
  progressMini: { height: 4, backgroundColor: '#F5F5F0', borderRadius: 2, overflow: 'hidden' },
  progressMiniFill: { height: '100%', backgroundColor: MINT_GREEN },
  progressText: { fontSize: 10, fontWeight: '700', color: TEXT_GREY },
  dashed: { borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  
  // Live Focus Card
  liveFocusCard: { backgroundColor: TEXT_DARK, borderRadius: 24, padding: 18, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  liveFocusInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0, 191, 165, 0.2)', justifyContent: 'center', alignItems: 'center' },
  liveModuleName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  liveStatus: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  liveTimerBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  liveTimerText: { color: MINT_GREEN, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },

  // Focus Mode Modal
  focusContainer: { flex: 1, backgroundColor: CREAM_BG },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  focusTitle: { fontSize: 12, fontWeight: '800', color: TEXT_GREY, letterSpacing: 2 },
  focusContent: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 20 },
  focusIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  focusModuleName: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginTop: 15 },
  timerWrapper: { height: 150, marginVertical: 20, justifyContent: 'center', alignItems: 'center' },
  timerDigits: { fontSize: 84, fontWeight: '900', color: TEXT_DARK, fontVariant: ['tabular-nums'] },
  timerSubText: { fontSize: 13, color: MINT_GREEN, fontWeight: '700', letterSpacing: 1 },
  wheelContainer: { height: 150, marginVertical: 20, width: '100%', alignItems: 'center' },
  wheelHighlight: { position: 'absolute', top: ITEM_HEIGHT, height: ITEM_HEIGHT, width: '80%', backgroundColor: '#EBEBE6', borderRadius: 12, opacity: 0.5 },
  wheelItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  wheelText: { fontSize: 28, fontWeight: '800', color: TEXT_DARK },
  topicCard: { backgroundColor: CARD_WHITE, width: '100%', padding: 20, borderRadius: 24, marginBottom: 20 },
  topicInput: { fontSize: 18, fontWeight: '600', color: TEXT_DARK, marginTop: 10 },
  
  // Break Phase UI
  breakCard: { backgroundColor: CARD_WHITE, width: '100%', padding: 25, borderRadius: 24, marginBottom: 25, alignItems: 'center' },
  breakText: { fontSize: 14, color: TEXT_DARK, textAlign: 'center', fontWeight: '500', lineHeight: 22, marginBottom: 15 },
  skipBreakBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F0FAF9' },
  skipBreakText: { fontSize: 14, fontWeight: '700', color: MINT_GREEN },

  modeToggleRow: { flexDirection: 'row', backgroundColor: '#EBEBE6', borderRadius: 16, padding: 4, marginBottom: 25 },
  modeBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  activeModeBtn: { backgroundColor: CARD_WHITE, elevation: 2 },
  modeBtnText: { fontWeight: '700', color: TEXT_GREY },
  activeModeText: { color: TEXT_DARK },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  mainPlayBtn: { width: 84, height: 84, borderRadius: 42, backgroundColor: TEXT_DARK, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  secBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  shieldNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 6 },
  shieldText: { fontSize: 11, fontWeight: '700', color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
  sheetIndicator: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK, marginBottom: 20 },
  input: { backgroundColor: '#F5F5F0', padding: 20, borderRadius: 18, width: '100%', marginBottom: 20, fontSize: 16, fontWeight: '600' },
  iconList: { marginBottom: 30 },
  iconChoice: { width: 55, height: 55, borderRadius: 15, backgroundColor: '#F5F5F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeIcon: { backgroundColor: MINT_GREEN },
  saveBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },

  celebrationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  celebrationCard: { backgroundColor: CARD_WHITE, borderRadius: 32, padding: 30, alignItems: 'center', width: '100%' },
  confettiIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  celebrationTitle: { fontSize: 24, fontWeight: '900', color: TEXT_DARK, marginBottom: 10 },
  celebrationSub: { fontSize: 14, color: TEXT_GREY, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  summaryInput: { backgroundColor: '#F5F5F0', borderRadius: 18, padding: 20, width: '100%', height: 110, fontSize: 15, color: TEXT_DARK, marginBottom: 20, textAlignVertical: 'top' },
  motivationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', padding: 15, borderRadius: 15, width: '100%', marginBottom: 25 },
  motivationText: { fontSize: 13, color: MINT_GREEN, fontWeight: '600', marginLeft: 10, flex: 1, fontStyle: 'italic' },
  celebrationBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  celebrationBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
});