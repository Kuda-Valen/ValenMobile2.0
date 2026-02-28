import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

// Brand Constant
const MINT_GREEN = '#00BFA5';

export default function HubScreen() {
  const router = useRouter();
  const { religiousActivities, fitnessActivities, visions, profile } = useValen();

  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    iconBg: isDark ? 'rgba(0, 191, 165, 0.1)' : '#F0FAF9',
    border: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
  };

  const level = profile?.level || 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textGrey }]}>Central Command</Text>
            <Text style={[styles.userName, { color: theme.textDark }]}>Valen Hub</Text>
          </View>
          <TouchableOpacity 
            style={[styles.avatarPlaceholder, { backgroundColor: theme.card }]}
            onPress={() => router.push('/profile')}
          >
             <Ionicons name="person" size={20} color={MINT_GREEN} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          
          <TouchableOpacity 
            style={[styles.tile, styles.largeTile, { backgroundColor: theme.card }]} 
            onPress={() => router.push('/finance')}
          >
            <View style={styles.smallTileHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                    <Ionicons name="cash" size={28} color={MINT_GREEN} />
                </View>
            </View>
            <View>
              <Text style={[styles.tileTitle, { color: theme.textDark }]}>Financials</Text>
              <Text style={[styles.tileSubText, { color: theme.textGrey }]}>Track Wealth</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rightColumn}>
            <TouchableOpacity 
              style={[styles.tile, styles.smallTile, { backgroundColor: theme.card }]} 
              onPress={() => router.push('/faith')}
            >
              <View style={styles.smallTileHeader}>
                <Ionicons name="sunny" size={22} color={MINT_GREEN} />
                {religiousActivities.length > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{religiousActivities.length}</Text></View>
                )}
              </View>
              <Text style={[styles.tileTitleSmall, { color: theme.textDark }]}>Faith</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tile, styles.smallTile, { backgroundColor: theme.card }]} 
              onPress={() => router.push('/fitness')}
            >
              <View style={styles.smallTileHeader}>
                <Ionicons name="fitness" size={22} color={MINT_GREEN} />
                {fitnessActivities.length > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{fitnessActivities.length}</Text></View>
                )}
              </View>
              <Text style={[styles.tileTitleSmall, { color: theme.textDark }]}>Fitness</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.tile, styles.wideTile, { backgroundColor: theme.card }]} 
            onPress={() => router.push('/goals')}
          >
            <View style={styles.wideInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tileTitle, { color: theme.textDark }]}>Goal Setting</Text>
                {visions?.length > 0 && (
                  <View style={[styles.badge, { marginLeft: 10 }]}><Text style={styles.badgeText}>{visions.length}</Text></View>
                )}
              </View>
              <Text style={[styles.tileSubText, { color: theme.textGrey }]}>Vision Board & Milestones</Text>
            </View>
            <View style={[styles.circleIcon, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="trophy" size={20} color={MINT_GREEN} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.wideTile, { backgroundColor: theme.card, borderColor: MINT_GREEN, borderWidth: 1 }]} 
            onPress={() => router.push('/achievements')}
          >
            <View style={styles.wideInfo}>
              <Text style={[styles.tileTitle, { color: MINT_GREEN }]}>Archives & Rank</Text>
              <Text style={[styles.tileSubText, { color: theme.textGrey }]}>Neural Ascension • LVL {level}</Text>
            </View>
            <View style={[styles.circleIcon, { backgroundColor: MINT_GREEN }]}>
                <Ionicons name="ribbon" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.wideTile, { backgroundColor: theme.card }]} 
            onPress={() => router.push('/analytics')}
          >
            <View style={styles.wideInfo}>
              <Text style={[styles.tileTitle, { color: theme.textDark }]}>Performance</Text>
              <Text style={[styles.tileSubText, { color: theme.textGrey }]}>Deep Work & Reports</Text>
            </View>
            <View style={[styles.circleIcon, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="pulse" size={20} color={MINT_GREEN} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.wideTile, { backgroundColor: theme.card }]} 
            onPress={() => router.push('/settings')}
          >
            <View style={styles.wideInfo}>
              <Text style={[styles.tileTitle, { color: theme.textDark }]}>Settings</Text>
              <Text style={[styles.tileSubText, { color: theme.textGrey }]}>App Configuration</Text>
            </View>
            <Ionicons name="settings-outline" size={24} color={theme.textGrey} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800' },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { borderRadius: 24, padding: 20, justifyContent: 'space-between', marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  largeTile: { width: (width - 55) * 0.58, height: 180 },
  rightColumn: { width: (width - 55) * 0.38, justifyContent: 'space-between' },
  smallTile: { width: '100%', height: 82, padding: 15 },
  smallTileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: MINT_GREEN, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  wideTile: { width: '100%', height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  circleIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  wideInfo: { flex: 1 },
  tileTitle: { fontSize: 18, fontWeight: '800' },
  tileTitleSmall: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  tileSubText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});