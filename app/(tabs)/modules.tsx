import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; // New Import for Soundscapes
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
import { NotificationService } from '../../src/services/NotificationService';

const { width } = Dimensions.get('window');

// Default Constants (Fallback)
const MINT_GREEN = '#00BFA5';
const ITEM_HEIGHT = 50;

const PREMIUM_ICONS = [
  'book', 'calculator', 'flask', 'language', 'code-working', 
  'color-palette', 'globe', 'musical-notes', 'business', 
  'fitness', 'medkit', 'construct', 'layers', 'terminal'
];

const TIMER_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

// Neural Soundscape Library (Royalty-Free & Copyright Compliant)
const SOUNDSCAPES = [
  { id: 1, name: 'Neural Flow', uri: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808f3030c.mp3' },
  { id: 2, name: 'Deep White Noise', uri: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_8027786435.mp3' },
  { id: 3, name: 'Rain Environment', uri: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_3327d91e6b.mp3' },
  { id: 4, name: 'Lofi Focus Beats', uri: 'https://cdn.pixabay.com/download/audio/2022/03/02/audio_c8c8a7351b.mp3' },
  { id: 5, name: 'Cyberpunk Study', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 6, name: 'Zen Garden', uri: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1469e34e0.mp3' },
  { id: 7, name: 'Academic Ambience', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 8, name: 'Vortex Concentration', uri: 'https://cdn.pixabay.com/download/audio/2023/04/14/audio_9593f6191c.mp3' },
  { id: 9, name: 'Forest Echoes', uri: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_884ca0218b.mp3' },
  { id: 10, name: 'Strategic Rhythm', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

export default function ModulesScreen() {
  const { 
    modules, 
    profile, 
    addModule, 
    startFocusSession, 
    pauseFocusSession, 
    timerState, 
    resetTimer,
    stopAndSaveSession,
    setTimerConfig,
    setSessionTopic,
    selectModule,
    stopFocusSession 
  } = useValen();

  // --- THEME PROGRAMMING ---
  const isDark = profile?.theme === 'dark';
  
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#EEE',
    breakBg: isDark ? '#002B26' : '#E0F2F1'
  };
  
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

  // --- AUDIO STATES ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const pulseValue = useSharedValue(0);
  const isBreak = timerState.currentPhase === 'Break';

  // --- SOUNDSCAPE LOGIC ---
  async function loadAndPlayTrack(index: number) {
    const isSoundscapeEnabled = profile?.focusParameters?.soundscapes ?? true;
    if (!isSoundscapeEnabled || isBreak) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: SOUNDSCAPES[index].uri },
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      setSound(newSound);
      setIsMusicPlaying(true);
    } catch (error) {
      console.log("Valen Audio Error: ", error);
    }
  }

  const toggleMusic = async () => {
    if (!sound) return;
    if (isMusicPlaying) {
      await sound.pauseAsync();
      setIsMusicPlaying(false);
    } else {
      await sound.playAsync();
      setIsMusicPlaying(true);
    }
  };

  const nextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % SOUNDSCAPES.length;
    setCurrentTrackIndex(nextIdx);
    loadAndPlayTrack(nextIdx);
  };

  const prevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + SOUNDSCAPES.length) % SOUNDSCAPES.length;
    setCurrentTrackIndex(prevIdx);
    loadAndPlayTrack(prevIdx);
  };

  async function stopSoundscape() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsMusicPlaying(false);
    }
  }

  useEffect(() => {
    if (timerState.isRunning && !isBreak) {
      if (!sound) loadAndPlayTrack(currentTrackIndex);
    } else {
      stopSoundscape();
    }
    return () => { stopSoundscape(); };
  }, [timerState.isRunning, isBreak]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (timerState.isRunning && timerState.activeModuleId) {
          const activeMod = modules.find(m => m.id === timerState.activeModuleId);
          NotificationService.startLiveSessionNotification(
            activeMod?.name || 'Session',
            Math.floor(timerState.timeRemaining / 60),
            timerState.currentPhase === 'Break'
          );
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [timerState.isRunning, timerState.timeRemaining, timerState.activeModuleId, timerState.currentPhase]);

  const totalHoursClocked = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0);
  }, [modules]);

  const dailyAcademicProgress = useMemo(() => {
    const focusMinutes = profile?.dailyFocusMinutes || 0;
    const goalMinutes = (profile?.dailyFocusGoalHours || 4) * 60;
    return Math.min(focusMinutes / goalMinutes, 1);
  }, [profile]);

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
    setActiveStudyView(!!timerState.activeModuleId);
  }, [timerState.activeModuleId]);

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

  // --- FOCUS PARAMETERS: Focus Shield Hook ---
  const isShieldActive = profile?.focusParameters?.shieldActive ?? true;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textDark }]}>Academic</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.card }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={MINT_GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryLabel, { color: theme.textGrey }]}>Total Academic Volume</Text>
            <Text style={[styles.summaryValue, { color: theme.textDark }]}>
              {totalHoursClocked.toFixed(1)} 
              <Text style={{ fontSize: 18, color: theme.textGrey }}> hrs</Text>
            </Text>
            
            <View style={[styles.dailyGoalTrack, { backgroundColor: theme.itemBg }]}>
                <View style={[styles.dailyGoalFill, { width: `${dailyAcademicProgress * 100}%` }]} />
            </View>
            <Text style={[styles.dailyGoalText, { color: theme.textGrey }]}>
                Today: {Math.round(profile?.dailyFocusMinutes || 0)}m / {profile?.dailyFocusGoalHours || 4}h
            </Text>
          </View>
          <View style={[styles.summaryCircle, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]}>
            <Ionicons name="medal" size={24} color={MINT_GREEN} />
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
            <TouchableOpacity key={m.id} style={[styles.moduleCard, { backgroundColor: theme.card }]} onPress={() => selectModule(m.id)}>
              <View style={styles.moduleHeader}>
                <View style={[styles.iconBg, { backgroundColor: theme.itemBg }]}><Ionicons name={m.icon as any || 'book'} size={18} color={MINT_GREEN} /></View>
                {m.dailyNudge && <Ionicons name="notifications-outline" size={16} color={MINT_GREEN} />}
              </View>
              <Text style={[styles.moduleName, { color: theme.textDark }]} numberOfLines={1}>{m.name}</Text>
              <View style={styles.moduleFooter}>
                <View style={[styles.progressMini, { backgroundColor: theme.itemBg }]}>
                  <View style={[styles.progressMiniFill, { width: `${Math.min(((m.hoursDone || 0)/20)*100, 100)}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.textGrey }]}>{m.hoursDone?.toFixed(1) || 0}h clocked</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.moduleCard, styles.dashed, { borderColor: theme.border }]} onPress={() => setModalVisible(true)}>
             <Ionicons name="add" size={32} color={isDark ? "#444" : "#CCC"} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- FOCUS MODE MODAL --- */}
      <Modal visible={activeStudyView} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.focusContainer, { backgroundColor: isBreak ? theme.breakBg : theme.bg }]}>
          <View style={styles.focusHeader}>
            <TouchableOpacity onPress={() => setActiveStudyView(false)}>
              <Ionicons name="chevron-down" size={30} color={theme.textDark} />
            </TouchableOpacity>
            <Text style={[styles.focusTitle, { color: theme.textGrey }, isBreak && { color: MINT_GREEN, fontWeight: '900' }]}>
                {isBreak ? 'RECHARGE' : 'DEEP WORK'}
            </Text>
            <View style={{width: 30}} />
          </View>

          <View style={styles.focusContent}>
            <View style={[styles.focusIconCircle, { backgroundColor: theme.card }, isBreak && { borderColor: MINT_GREEN, borderWidth: 3 }]}>
              <Ionicons 
                name={isBreak ? "cafe-outline" : (activeModule?.icon as any || 'book')} 
                size={50} 
                color={isBreak ? MINT_GREEN : theme.textDark} 
              />
            </View>
            <Text style={[styles.focusModuleName, { color: theme.textDark }]}>
                {isBreak ? 'Time to Recharge' : (activeModule?.name || 'Session')}
            </Text>
            
            {!timerState.isRunning && !timerState.isPomodoro && !isBreak ? (
                <View style={styles.wheelContainer}>
                    <View style={[styles.wheelHighlight, { backgroundColor: isDark ? '#333' : '#EBEBE6' }]} />
                    <FlatList
                        data={TIMER_VALUES}
                        keyExtractor={(item) => item.toString()}
                        snapToInterval={ITEM_HEIGHT}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={onScroll}
                        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                        renderItem={({ item }) => (
                            <View style={styles.wheelItem}><Text style={[styles.wheelText, { color: theme.textDark }]}>{item} min</Text></View>
                        )}
                    />
                </View>
            ) : (
                <View style={styles.timerWrapper}>
                  <Animated.Text style={[styles.timerDigits, { color: theme.textDark }, timerState.isRunning && animatedPulseStyle, isBreak && { color: MINT_GREEN }]}>
                    {formatTime(timerState.timeRemaining)}
                  </Animated.Text>
                  <Text style={[styles.timerSubText, { color: MINT_GREEN }]}>
                      {isBreak ? 'Rest your eyes & hydrate' : (timerState.isPomodoro ? 'POMODORO FLOW' : 'CUSTOM SESSION')}
                  </Text>
                </View>
            )}

            {/* NEURAL MUSIC PLAYER UI */}
            {!isBreak && timerState.isRunning && profile?.focusParameters?.soundscapes && (
              <Animated.View entering={FadeIn.delay(300)} style={[styles.playerContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.trackName, { color: theme.textDark }]}>
                  <Ionicons name="musical-notes" size={14} color={MINT_GREEN} /> {SOUNDSCAPES[currentTrackIndex].name}
                </Text>
                <View style={styles.playerControls}>
                  <TouchableOpacity onPress={prevTrack}><Ionicons name="play-back" size={24} color={theme.textGrey} /></TouchableOpacity>
                  <TouchableOpacity onPress={toggleMusic} style={styles.playPauseCircle}>
                    <Ionicons name={isMusicPlaying ? "pause" : "play"} size={24} color={MINT_GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={nextTrack}><Ionicons name="play-forward" size={24} color={theme.textGrey} /></TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {!isBreak && (
                <Animated.View entering={FadeIn} style={[styles.topicCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.label, { color: theme.textGrey }]}>Focus Objective</Text>
                    <TextInput 
                        style={[styles.topicInput, { color: theme.textDark }]} 
                        placeholder="Current focus..." 
                        placeholderTextColor={theme.textGrey} 
                        value={timerState.topic} 
                        onChangeText={setSessionTopic}
                    />
                </Animated.View>
            )}

            {isBreak && (
                <Animated.View entering={ZoomIn} style={[styles.breakCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.breakText, { color: theme.textDark }]}>Your study session has been logged. Stand up, stretch, and take a deep breath.</Text>
                    <TouchableOpacity 
                        style={[styles.skipBreakBtn, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]} 
                        onPress={() => resetTimer()} 
                    >
                        <Text style={styles.skipBreakText}>Skip Break</Text>
                        <Ionicons name="play-skip-forward" size={16} color={MINT_GREEN} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {!timerState.isRunning && !isBreak && (
              <View style={[styles.modeToggleRow, { backgroundColor: theme.itemBg }]}>
                <TouchableOpacity 
                  style={[styles.modeBtn, timerState.isPomodoro && [styles.activeModeBtn, { backgroundColor: theme.card }]]} 
                  onPress={() => setTimerConfig(true, profile?.focusParameters?.pomodoroFocus || 25)}
                >
                  <Text style={[styles.modeBtnText, { color: theme.textGrey }, timerState.isPomodoro && { color: theme.textDark }]}>Pomodoro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, !timerState.isPomodoro && [styles.activeModeBtn, { backgroundColor: theme.card }]]} onPress={() => setTimerConfig(false, 60)}>
                  <Text style={[styles.modeBtnText, { color: theme.textGrey }, !timerState.isPomodoro && { color: theme.textDark }]}>Custom</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.controlsRow}>
              <TouchableOpacity style={[styles.secBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={resetTimer}>
                <Ionicons name="refresh-outline" size={28} color={theme.textGrey} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mainPlayBtn, { backgroundColor: isDark ? '#FFF' : '#1A1A1A' }, isBreak && { backgroundColor: MINT_GREEN }]} 
                onPress={timerState.isRunning ? pauseFocusSession : () => startFocusSession()}
              >
                <Ionicons name={timerState.isRunning ? "pause" : "play"} size={40} color={isDark && !isBreak ? "#121212" : "#FFF"} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={() => { 
                    if (isBreak) stopFocusSession();
                    else { stopAndSaveSession(); setCelebrationVisible(true); } 
                }}
              >
                <Ionicons name="stop" size={28} color="#FF4B4B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shieldNotice}>
                <Ionicons name={isShieldActive ? "shield-checkmark" : "shield-outline"} size={14} color={isBreak ? MINT_GREEN : theme.textGrey} />
                <Text style={[styles.shieldText, { color: theme.textGrey }]}>
                    {isShieldActive ? "Focus Shield Active" : "Shield Offline"}
                </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* --- CELEBRATION MODAL --- */}
      <Modal visible={celebrationVisible} animationType="fade" transparent>
        <View style={styles.celebrationOverlay}>
          <Animated.View entering={ZoomIn.duration(500)} style={[styles.celebrationCard, { backgroundColor: theme.card }]}>
            <View style={[styles.confettiIcon, { backgroundColor: isDark ? 'rgba(0,191,165,0.1)' : '#F0FAF9' }]}>
              <Ionicons name="trophy" size={50} color={MINT_GREEN} />
            </View>
            <Text style={[styles.celebrationTitle, { color: theme.textDark }]}>Session Complete!</Text>
            <Text style={[styles.celebrationSub, { color: theme.textGrey }]}>You've moved closer to your academic goals. What did you achieve?</Text>
            
            <TextInput 
                style={[styles.summaryInput, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
                placeholder="Brief summary..." 
                multiline
                value={sessionSummary}
                onChangeText={setSessionSummary}
                placeholderTextColor={theme.textGrey}
            />

            <TouchableOpacity style={styles.celebrationBtn} onPress={handleFinishCelebration}>
              <Text style={styles.celebrationBtnText}>Log Achievement</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* --- ADD MODULE MODAL --- */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
               <Text style={[styles.modalTitle, { color: theme.textDark }]}>New Module</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textGrey} />
               </TouchableOpacity>
            </View>
            
            <TextInput 
                style={[styles.input, { backgroundColor: theme.itemBg, color: theme.textDark }]} 
                placeholder="Module Name" 
                placeholderTextColor={theme.textGrey}
                value={newModule.name} 
                onChangeText={(t) => setNewModule({...newModule, name: t})} 
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconList}>
              {PREMIUM_ICONS.map(icon => (
                <TouchableOpacity 
                    key={icon} 
                    onPress={() => setNewModule({...newModule, icon})} 
                    style={[styles.iconChoice, { backgroundColor: theme.itemBg }, newModule.icon === icon && styles.activeIcon]}
                >
                    <Ionicons name={icon as any} size={22} color={newModule.icon === icon ? '#FFF' : theme.textGrey} />
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  addBtn: { padding: 8, borderRadius: 12 },
  scrollContent: { padding: 20 },
  summaryCard: { borderRadius: 24, padding: 25, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: { width: (width - 55) / 2, height: 150, borderRadius: 24, padding: 18, marginBottom: 15, justifyContent: 'space-between' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  iconBg: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  moduleName: { fontSize: 15, fontWeight: '700' },
  moduleFooter: { gap: 8 },
  progressMini: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressMiniFill: { height: '100%', backgroundColor: MINT_GREEN },
  progressText: { fontSize: 10, fontWeight: '700' },
  dashed: { borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  liveFocusCard: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 18, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8 },
  liveFocusInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0, 191, 165, 0.2)', justifyContent: 'center', alignItems: 'center' },
  liveModuleName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  liveStatus: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  liveTimerBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  liveTimerText: { color: MINT_GREEN, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  focusContainer: { flex: 1 },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  focusTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  focusContent: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 20 },
  focusIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  focusModuleName: { fontSize: 24, fontWeight: '800', marginTop: 15 },
  timerWrapper: { height: 150, marginVertical: 20, justifyContent: 'center', alignItems: 'center' },
  timerDigits: { fontSize: 84, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerSubText: { fontSize: 13, color: MINT_GREEN, fontWeight: '700', letterSpacing: 1 },
  wheelContainer: { height: 150, marginVertical: 20, width: '100%', alignItems: 'center' },
  wheelHighlight: { position: 'absolute', top: ITEM_HEIGHT, height: ITEM_HEIGHT, width: '80%', borderRadius: 12, opacity: 0.5 },
  wheelItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  wheelText: { fontSize: 28, fontWeight: '800' },
  playerContainer: { width: '100%', padding: 15, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 2 },
  trackName: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  playPauseCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,191,165,0.1)', justifyContent: 'center', alignItems: 'center' },
  topicCard: { width: '100%', padding: 20, borderRadius: 24, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  topicInput: { fontSize: 18, fontWeight: '600', marginTop: 10 },
  breakCard: { width: '100%', padding: 25, borderRadius: 24, marginBottom: 25, alignItems: 'center' },
  breakText: { fontSize: 14, textAlign: 'center', fontWeight: '500', lineHeight: 22, marginBottom: 15 },
  skipBreakBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  skipBreakText: { fontSize: 14, fontWeight: '700', color: MINT_GREEN },
  modeToggleRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 25 },
  modeBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  activeModeBtn: { elevation: 2 },
  modeBtnText: { fontWeight: '700' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  mainPlayBtn: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  secBtn: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  shieldNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 6 },
  shieldText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  sheet: { padding: 25, borderRadius: 32, width: width * 0.85, elevation: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  input: { padding: 20, borderRadius: 18, width: '100%', marginBottom: 20, fontSize: 16, fontWeight: '600' },
  iconList: { marginVertical: 15 },
  iconChoice: { width: 55, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeIcon: { backgroundColor: MINT_GREEN },
  saveBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  celebrationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  celebrationCard: { borderRadius: 32, padding: 30, alignItems: 'center', width: '100%' },
  confettiIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  celebrationTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  celebrationSub: { fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  summaryInput: { borderRadius: 18, padding: 20, width: '100%', height: 110, fontSize: 15, marginBottom: 20, textAlignVertical: 'top' },
  celebrationBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%' },
  celebrationBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  dailyGoalTrack: { height: 4, borderRadius: 2, marginTop: 12, width: '80%', overflow: 'hidden' },
  dailyGoalFill: { height: '100%', backgroundColor: MINT_GREEN },
  dailyGoalText: { fontSize: 10, fontWeight: '700', marginTop: 6 }
});