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

// CONSISTENT PREMIUM PALETTE
const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function HubScreen() {
  const router = useRouter();
  const { religiousActivities, fitnessActivities } = useValen();

  // Dynamic counts for tile badges
  const faithCount = religiousActivities.length;
  const fitnessCount = fitnessActivities.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* MATCHED HEADER STYLE */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Central Command</Text>
            <Text style={styles.userName}>Valen Hub</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarPlaceholder}
            onPress={() => router.push('/profile')}
          >
             <Ionicons name="person" size={20} color={MINT_GREEN} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          
          {/* LARGE TILE: FINANCIALS */}
          <TouchableOpacity 
            style={[styles.tile, styles.largeTile]}
            onPress={() => console.log('Navigate to Financials')}
          >
            <View style={styles.iconContainer}>
                <Ionicons name="cash" size={28} color={MINT_GREEN} />
            </View>
            <View>
              <Text style={styles.tileTitle}>Financials</Text>
              <Text style={styles.tileSubText}>Track Wealth & Spend</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rightColumn}>
            {/* SMALL TILE: FAITH */}
            <TouchableOpacity 
              style={[styles.tile, styles.smallTile]}
              onPress={() => router.push('/faith')}
            >
              <View style={styles.smallTileHeader}>
                <Ionicons name="sunny" size={22} color={MINT_GREEN} />
                {faithCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{faithCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tileTitleSmall}>Faith</Text>
            </TouchableOpacity>

            {/* SMALL TILE: FITNESS (UPDATED) */}
            <TouchableOpacity 
              style={[styles.tile, styles.smallTile]}
              onPress={() => router.push('/fitness')}
            >
              <View style={styles.smallTileHeader}>
                <Ionicons name="fitness" size={22} color={MINT_GREEN} />
                {fitnessCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{fitnessCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tileTitleSmall}>Fitness</Text>
            </TouchableOpacity>
          </View>

          {/* WIDE TILE: GOALS */}
          <TouchableOpacity 
            style={[styles.tile, styles.wideTile]}
            onPress={() => console.log('Navigate to Goals')}
          >
            <View style={styles.wideInfo}>
              <Text style={styles.tileTitle}>Goal Setting</Text>
              <Text style={styles.tileSubText}>Vision Board & Milestones</Text>
            </View>
            <View style={styles.circleIcon}>
                <Ionicons name="trophy" size={20} color={MINT_GREEN} />
            </View>
          </TouchableOpacity>

          {/* WIDE TILE: SETTINGS */}
          <TouchableOpacity 
            style={[styles.tile, styles.wideTile]}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.wideInfo}>
              <Text style={styles.tileTitle}>Settings</Text>
              <Text style={styles.tileSubText}>App Configuration</Text>
            </View>
            <Ionicons name="settings-outline" size={24} color={TEXT_GREY} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  scrollContent: { padding: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 13, color: TEXT_GREY, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: TEXT_DARK },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  tile: { 
    backgroundColor: CARD_WHITE, 
    borderRadius: 24, 
    padding: 20, 
    justifyContent: 'space-between', 
    marginBottom: 15,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  
  largeTile: { width: (width - 55) * 0.58, height: 180 },
  rightColumn: { width: (width - 55) * 0.38, justifyContent: 'space-between' },
  smallTile: { width: '100%', height: 82, padding: 15 },
  smallTileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  badge: { backgroundColor: MINT_GREEN, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '800' },

  wideTile: { width: '100%', height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  
  iconContainer: { backgroundColor: '#F0FAF9', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  circleIcon: { backgroundColor: '#F0FAF9', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  wideInfo: { flex: 1 },
  tileTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  tileTitleSmall: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginTop: 8 },
  tileSubText: { fontSize: 12, color: TEXT_GREY, fontWeight: '600', marginTop: 4 },
});