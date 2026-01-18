import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Dimensions, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { useValen } from '../src/context/ValenContext';

const { width } = Dimensions.get('window');

const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

const ALL_BADGES = [
  { id: 'deep_diver', name: 'Deep Diver', icon: 'water', requirement: 'Complete a single focus session longer than 120 minutes.', color: '#007AFF' },
  { id: 'monk_mode', name: 'Monk Mode', icon: 'infinite', requirement: 'Exceed 5 hours of total academic focus in a single day.', color: '#AF52DE' },
  { id: 'midnight_scholar', name: 'Midnight Scholar', icon: 'moon', requirement: 'Log a focus session between 12:00 AM and 4:00 AM.', color: '#FF9500' },
  { id: 'consistency_king', name: 'Consistency', icon: 'calendar', requirement: 'Maintain a 7-day perfect streak of closing all discipline rings.', color: '#FF3B30' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { profile } = useValen();
  const userBadges = profile?.badges || [];
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const nextLevelXP = level * 1000;

  const showRequirement = (badge: any) => {
    const isUnlocked = userBadges.includes(badge.id);
    Alert.alert(
      isUnlocked ? "Badge Earned" : "Badge Locked",
      badge.requirement,
      [{ text: "Understood", style: "default" }]
    );
  };

  const getRankName = (lvl: number) => {
    if (lvl >= 10) return "Global Titan";
    if (lvl >= 5) return "Executive Strategist";
    if (lvl >= 2) return "Focus Sentinel";
    return "Initial Novice";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neural Archives</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* RANK ASCENSION SECTION - NOW MATCHES OTHER BLOCKS */}
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View>
              <Text style={styles.labelCaps}>Current Standing</Text>
              <Text style={styles.rankTitle}>{getRankName(level)}</Text>
            </View>
            <View style={styles.levelCircle}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
          </View>
          
          <View style={styles.xpRow}>
            <Text style={styles.xpText}>{xp} XP</Text>
            <Text style={styles.xpText}>{nextLevelXP} XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${(xp % 1000) / 10}%` }]} />
          </View>
          <Text style={styles.rankStatus}>Level {level} Ascension in progress...</Text>
        </View>

        {/* BADGE GRID */}
        <Text style={styles.sectionTitle}>Mastery Badges</Text>
        <View style={styles.badgeGrid}>
          {ALL_BADGES.map((badge) => {
            const isUnlocked = userBadges.includes(badge.id);
            return (
              <TouchableOpacity 
                key={badge.id} 
                style={[styles.badgeItem, !isUnlocked && styles.badgeLocked]} 
                onPress={() => showRequirement(badge)}
              >
                <View style={[styles.badgeIconBg, { backgroundColor: isUnlocked ? badge.color : '#F0F0F0' }]}>
                  <Ionicons name={badge.icon as any} size={32} color={isUnlocked ? '#FFF' : '#AAA'} />
                  {!isUnlocked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={10} color={TEXT_GREY} />
                    </View>
                  )}
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.statusText}>{isUnlocked ? 'ARCHIVED' : 'LOCKED'}</Text>
              </TouchableOpacity>
            );
          })}
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
  
  // RANK CARD UPDATED TO MATCH DASHBOARD STYLE
  rankCard: { backgroundColor: CARD_WHITE, borderRadius: 32, padding: 25, marginBottom: 30, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  levelCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: MINT_GREEN, justifyContent: 'center', alignItems: 'center' },
  levelText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  labelCaps: { color: TEXT_GREY, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  rankTitle: { color: TEXT_DARK, fontSize: 24, fontWeight: '900' },
  
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpText: { color: TEXT_GREY, fontSize: 12, fontWeight: '700' },
  xpTrack: { height: 8, backgroundColor: CREAM_BG, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: MINT_GREEN },
  rankStatus: { color: MINT_GREEN, fontSize: 11, fontWeight: '800', marginTop: 15, textAlign: 'center', letterSpacing: 0.5 },
  
  sectionTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK, marginBottom: 20, paddingLeft: 5 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeItem: { width: (width - 60) / 2, backgroundColor: CARD_WHITE, padding: 20, borderRadius: 28, alignItems: 'center', marginBottom: 15, elevation: 2 },
  badgeLocked: { opacity: 0.8 },
  badgeIconBg: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  lockBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: CARD_WHITE, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  badgeName: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  statusText: { fontSize: 10, fontWeight: '700', color: TEXT_GREY, marginTop: 5 },
});