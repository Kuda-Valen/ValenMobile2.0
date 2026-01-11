import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const { width } = Dimensions.get('window');

const CREAM_BG = '#F5F5F0';
const MINT_GREEN = '#00BFA5';
const CARD_WHITE = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { 
    modules, 
    tasks, 
    visions, 
    religiousActivities, 
    fitnessActivities,
    profile 
  } = useValen();

  // --- ANALYTICS ENGINE ---
  const stats = useMemo(() => {
    // 1. Total Deep Work Hours
    const totalHours = modules.reduce((acc, m) => acc + (m.hoursDone || 0), 0);

    // 2. Consistency Score (Based on Habits vs Total)
    const totalHabits = religiousActivities.length + fitnessActivities.length + visions.filter(v => v.type === 'Discipline').length;
    const completedHabits = 
      religiousActivities.filter(a => a.completed).length + 
      fitnessActivities.filter(a => a.completed).length + 
      visions.filter(v => v.type === 'Discipline' && v.progress === 100).length;
    
    const consistency = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    // 3. Pillar Distribution (for the bars)
    const academicPower = Math.min(totalHours / 40, 1); // Goal of 40 hours for 100%
    const faithPower = religiousActivities.length > 0 ? religiousActivities.filter(a => a.completed).length / religiousActivities.length : 0;
    const fitnessPower = fitnessActivities.length > 0 ? fitnessActivities.filter(a => a.completed).length / fitnessActivities.length : 0;
    const visionPower = visions.length > 0 ? (visions.reduce((acc, v) => acc + (v.progress || 0), 0) / (visions.length * 100)) : 0;

    return {
        totalHours,
        consistency,
        academicPower,
        faithPower,
        fitnessPower,
        visionPower,
        completedHabits
    };
  }, [modules, religiousActivities, fitnessActivities, visions]);

  // --- DYNAMIC ARCHETYPE LOGIC ---
  const archetype = useMemo(() => {
    if (stats.academicPower > 0.8 && stats.fitnessPower > 0.8) return { name: 'The Titan', icon: 'flash', sub: 'Elite Academic & Physical balance' };
    if (stats.academicPower > 0.8) return { name: 'The Scholar', icon: 'book', sub: 'Superior focus on academic growth' };
    if (stats.consistency > 90) return { name: 'The Architect', icon: 'construct', sub: 'Master of daily disciplines' };
    return { name: 'The Novice', icon: 'leaf', sub: 'Beginning the journey to focus' };
  }, [stats]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Executive Summary</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SCORECARD */}
        <View style={styles.mainScorecard}>
          <View>
            <Text style={styles.labelCaps}>Consistency Score</Text>
            <Text style={styles.scoreValue}>{stats.consistency}%</Text>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color={MINT_GREEN} />
              <Text style={styles.badgeText}>Live Performance</Text>
            </View>
          </View>
          <View style={styles.archetypeBox}>
            <Ionicons name={archetype.icon as any} size={32} color={MINT_GREEN} />
            <Text style={styles.archetypeTitle}>{archetype.name}</Text>
            <Text style={styles.archetypeSub}>{archetype.sub}</Text>
          </View>
        </View>

        <View style={styles.bentoRow}>
          <View style={[styles.bentoSmall, { flex: 1 }]}>
            <Text style={styles.labelCaps}>Focus Volume</Text>
            <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}<Text style={styles.statUnit}>h</Text></Text>
            <Text style={styles.statDesc}>Total Academic Depth</Text>
          </View>
          <View style={[styles.bentoSmall, { flex: 1 }]}>
            <Text style={styles.labelCaps}>Disciplines</Text>
            <Text style={styles.statValue}>{stats.completedHabits}</Text>
            <Text style={styles.statDesc}>Items Completed</Text>
          </View>
        </View>

        {/* PILLAR BALANCE */}
        <View style={styles.bentoLarge}>
          <Text style={styles.labelCaps}>Pillar Distribution</Text>
          {[
            { label: 'Academic', val: stats.academicPower, color: '#007AFF' },
            { label: 'Fitness', val: stats.fitnessPower, color: MINT_GREEN },
            { label: 'Faith', val: stats.faithPower, color: '#FF9500' },
            { label: 'Vision', val: stats.visionPower, color: '#AF52DE' },
          ].map((pillar, idx) => (
            <View key={idx} style={styles.pillarRow}>
              <Text style={styles.pillarLabel}>{pillar.label}</Text>
              <View style={styles.pillarTrack}>
                <View style={[styles.pillarFill, { width: `${pillar.val * 100}%`, backgroundColor: pillar.color }]} />
              </View>
              <Text style={styles.pillarPercent}>{Math.round(pillar.val * 100)}%</Text>
            </View>
          ))}
        </View>

        {/* PA INSIGHTS CARD (DYNAMIC MESSAGE) */}
        <View style={[styles.bentoLarge, { backgroundColor: TEXT_DARK }]}>
          <View style={styles.paHeader}>
            <Ionicons name="sparkles" size={18} color={MINT_GREEN} />
            <Text style={styles.paTitle}>PA Assistant</Text>
          </View>
          <Text style={styles.paMessage}>
            {stats.consistency > 80 
              ? `Excellent work, ${profile?.name || 'Valen'}. Your consistency is in the top 5%. You are currently ${stats.totalHours > 10 ? 'mastering' : 'building'} your academic depth.`
              : "I've noticed some gaps in your daily disciplines. Closing your rings 3 days in a row will unlock a new productivity archetype."}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },
  scrollContent: { padding: 20 },
  labelCaps: { fontSize: 10, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  mainScorecard: { backgroundColor: CARD_WHITE, borderRadius: 30, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 3 },
  scoreValue: { fontSize: 48, fontWeight: '900', color: TEXT_DARK },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 5 },
  badgeText: { fontSize: 10, fontWeight: '700', color: MINT_GREEN, marginLeft: 4 },
  archetypeBox: { alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F5F5F0', paddingLeft: 20, width: 120 },
  archetypeTitle: { fontSize: 13, fontWeight: '800', color: TEXT_DARK, marginTop: 8, textAlign: 'center' },
  archetypeSub: { fontSize: 9, color: TEXT_GREY, textAlign: 'center', marginTop: 2 },
  bentoRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  bentoSmall: { backgroundColor: CARD_WHITE, borderRadius: 28, padding: 20, height: 130 },
  statValue: { fontSize: 28, fontWeight: '900', color: TEXT_DARK },
  statUnit: { fontSize: 14, color: TEXT_GREY },
  statDesc: { fontSize: 11, color: TEXT_GREY, fontWeight: '600', marginTop: 4 },
  bentoLarge: { backgroundColor: CARD_WHITE, borderRadius: 30, padding: 25, marginBottom: 15 },
  paHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  paTitle: { color: MINT_GREEN, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  paMessage: { color: '#FFF', fontSize: 14, lineHeight: 22, fontWeight: '500' },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  pillarLabel: { width: 65, fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  pillarTrack: { flex: 1, height: 6, backgroundColor: '#F5F5F0', borderRadius: 3, overflow: 'hidden', marginHorizontal: 10 },
  pillarFill: { height: '100%', borderRadius: 3 },
  pillarPercent: { width: 30, fontSize: 10, fontWeight: '800', color: TEXT_GREY }
});