import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// THEME CONSTANTS
const CREAM_BG = '#F5F5F0';
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

export default function HubScreen() {
  const router = useRouter();

  const hubs = [
    { id: 'finance', title: 'Financials', subtitle: 'Track Wealth', icon: 'cash', color: '#E8F5E9', iconColor: '#2E7D32', size: 'large' },
    { id: 'religion', title: 'Faith', subtitle: 'Daily Verse', icon: 'sunny', color: '#FFF9C4', iconColor: '#FBC02D', size: 'small' },
    { id: 'fitness', title: 'Fitness', subtitle: 'Move Rings', icon: 'fitness', color: '#FFEBEE', iconColor: '#C62828', size: 'small' },
    { id: 'goals', title: 'Goal Setting', subtitle: 'Vision Board', icon: 'trophy', color: '#E3F2FD', iconColor: '#1565C0', size: 'wide' },
    { id: 'settings', title: 'Settings', subtitle: 'App Config', icon: 'settings', color: '#F5F5F5', iconColor: TEXT_DARK, size: 'wide' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Valen Hub</Text>
        <Text style={styles.subtitle}>Your life, fully integrated.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          
          {/* LARGE TILE: FINANCIALS */}
          <TouchableOpacity style={[styles.tile, styles.largeTile, { backgroundColor: hubs[0].color }]}>
            <Ionicons name={hubs[0].icon as any} size={32} color={hubs[0].iconColor} />
            <View>
              <Text style={[styles.tileTitle, { color: hubs[0].iconColor }]}>{hubs[0].title}</Text>
              <Text style={styles.tileSubText}>{hubs[0].subtitle}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rightColumn}>
            {/* SMALL TILE: FAITH */}
            <TouchableOpacity style={[styles.tile, styles.smallTile, { backgroundColor: hubs[1].color }]}>
              <Ionicons name={hubs[1].icon as any} size={24} color={hubs[1].iconColor} />
              <Text style={[styles.tileTitleSmall, { color: hubs[1].iconColor }]}>{hubs[1].title}</Text>
            </TouchableOpacity>

            {/* SMALL TILE: FITNESS */}
            <TouchableOpacity style={[styles.tile, styles.smallTile, { backgroundColor: hubs[2].color }]}>
              <Ionicons name={hubs[2].icon as any} size={24} color={hubs[2].iconColor} />
              <Text style={[styles.tileTitleSmall, { color: hubs[2].iconColor }]}>{hubs[2].title}</Text>
            </TouchableOpacity>
          </View>

          {/* WIDE TILE: GOALS */}
          <TouchableOpacity style={[styles.tile, styles.wideTile, { backgroundColor: hubs[3].color }]}>
            <View style={styles.wideInfo}>
              <Text style={[styles.tileTitle, { color: hubs[3].iconColor }]}>{hubs[3].title}</Text>
              <Text style={styles.tileSubText}>{hubs[3].subtitle}</Text>
            </View>
            <Ionicons name={hubs[3].icon as any} size={28} color={hubs[3].iconColor} />
          </TouchableOpacity>

          {/* WIDE TILE: SETTINGS */}
          <TouchableOpacity style={[styles.tile, styles.wideTile, { backgroundColor: hubs[4].color }]}>
            <View style={styles.wideInfo}>
              <Text style={styles.tileTitle}>{hubs[4].title}</Text>
              <Text style={styles.tileSubText}>{hubs[4].subtitle}</Text>
            </View>
            <Ionicons name={hubs[4].icon as any} size={28} color={TEXT_DARK} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  header: { padding: 25, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800', color: TEXT_DARK },
  subtitle: { fontSize: 14, color: TEXT_GREY, marginTop: 4, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  tile: { borderRadius: 28, padding: 20, justifyContent: 'space-between', marginBottom: 15 },
  
  largeTile: { width: (width - 55) * 0.58, height: 180 },
  rightColumn: { width: (width - 55) * 0.38, justifyContent: 'space-between' },
  smallTile: { width: '100%', height: 82, padding: 15 },
  wideTile: { width: '100%', height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  
  wideInfo: { flex: 1 },
  tileTitle: { fontSize: 18, fontWeight: '800' },
  tileTitleSmall: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  tileSubText: { fontSize: 12, color: TEXT_GREY, fontWeight: '600', marginTop: 2 },
});