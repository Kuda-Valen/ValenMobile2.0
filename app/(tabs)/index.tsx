import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../../src/context/ValenContext';

const { width } = Dimensions.get('window');
const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function Dashboard() {
  const { profile, timerState, startFocusSession, pauseFocusSession } = useValen();
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  // Calculate Progress for the Ring
  // Assuming a default 25-minute (1500 sec) session if not specified
  const totalSessionTime = 1500; 
  const elapsed = totalSessionTime - (timerState?.timeRemaining || totalSessionTime);
  const progressPercent = Math.min(elapsed / totalSessionTime, 1);

  // Formatting seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = [28, 29, 30, 31, 1, 2, 3];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
             <Ionicons name="person" size={20} color={MINT_GREEN} />
          </View>
        </View>

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
                <Text style={[styles.dayLetter, selectedDate === date && styles.selectedText]}>{days[index]}</Text>
                <Text style={[styles.dayDate, selectedDate === date && styles.selectedText]}>{date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CONNECTED FOCUS RING */}
        <View style={styles.focusCard}>
          <View style={styles.ringContainer}>
            <View style={styles.outerRing}>
               <View style={styles.innerRing} />
               {/* Progress Fill logic using rotation for a simple CSS-like ring effect */}
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
                  <Text style={styles.timerText}>
                    {timerState?.isRunning ? formatTime(timerState.timeRemaining) : "25:00"}
                  </Text>
                  <Text style={styles.sessionType}>{timerState?.currentPhase || 'Study'}</Text>
               </View>
            </View>

            <View style={styles.focusStats}>
              <Text style={styles.focusTitle}>Focus Session</Text>
              <Text style={styles.focusSubtitle}>
                {timerState?.isRunning ? "Session in progress..." : "Ready to focus?"}
              </Text>
              
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: timerState?.isRunning ? '#FFE5E5' : '#F0FAF9' }]} 
                onPress={() => timerState?.isRunning ? pauseFocusSession() : startFocusSession({ duration: 25 })}
              >
                <Ionicons 
                  name={timerState?.isRunning ? "pause" : "play"} 
                  size={18} 
                  color={timerState?.isRunning ? "#FF4B4B" : MINT_GREEN} 
                />
                <Text style={[styles.actionBtnText, { color: timerState?.isRunning ? "#FF4B4B" : MINT_GREEN }]}>
                  {timerState?.isRunning ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BENTO GRID */}
        <View style={styles.row}>
          <View style={styles.bentoSmall}>
            <View style={styles.tileHeader}>
               <Ionicons name="list" size={18} color={MINT_GREEN} />
               <Text style={styles.tileTitle}>Tasks</Text>
            </View>
            <Text style={styles.bigNum}>12</Text>
            <Text style={styles.subNum}>Pending</Text>
          </View>
          
          <View style={styles.bentoSmall}>
            <View style={styles.tileHeader}>
               <Ionicons name="flame" size={18} color="#FF9500" />
               <Text style={styles.tileTitle}>Streak</Text>
            </View>
            <Text style={styles.bigNum}>8</Text>
            <Text style={styles.subNum}>Days</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 14, color: TEXT_GREY, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: TEXT_DARK },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

  calendarCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, marginBottom: 15 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  monthText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', padding: 10, borderRadius: 15, width: 42 },
  selectedDay: { backgroundColor: MINT_GREEN },
  dayLetter: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginBottom: 4 },
  dayDate: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  selectedText: { color: '#FFF' },

  focusCard: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 25, marginBottom: 15 },
  ringContainer: { flexDirection: 'row', alignItems: 'center' },
  outerRing: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  innerRing: { position: 'absolute', width: 94, height: 94, borderRadius: 47, backgroundColor: CARD_WHITE, zIndex: 2 },
  progressFill: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 8, borderColor: 'transparent', zIndex: 1 },
  ringCenter: { alignItems: 'center', zIndex: 3 },
  timerText: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  sessionType: { fontSize: 10, color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1 },
  
  focusStats: { flex: 1, marginLeft: 20 },
  focusTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  focusSubtitle: { fontSize: 13, color: TEXT_GREY, marginVertical: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  actionBtnText: { fontWeight: '700', fontSize: 14, marginLeft: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bentoSmall: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 20, width: '48%', height: 140 },
  tileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tileTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginLeft: 8 },
  bigNum: { fontSize: 32, fontWeight: '800', color: TEXT_DARK },
  subNum: { fontSize: 12, color: TEXT_GREY, fontWeight: '500' },
});