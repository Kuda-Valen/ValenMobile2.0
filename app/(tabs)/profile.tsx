import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const ALL_BADGES = [
  { id: 'deep_diver', name: 'Deep Diver', icon: 'water', color: '#007AFF' },
  { id: 'monk_mode', name: 'Monk Mode', icon: 'infinite', color: '#AF52DE' },
  { id: 'midnight_scholar', name: 'Midnight Scholar', icon: 'moon', color: '#FF9500' },
  { id: 'consistency_king', name: 'Consistency', icon: 'calendar', color: '#FF3B30' },
];

export default function ProfileScreen() {
  // CRITICAL: Ensure 'updateProfile' exists in your ValenContext.tsx
  const valenContext = useValen();
  const { profile, logout, tasks, modules } = valenContext;
  
  // Safe extraction of update function (checks for potential naming mismatches)
  const updateProfile = valenContext.updateProfile || valenContext.updateUserProfile;

  const [name, setName] = useState(profile?.name || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [focusGoal, setFocusGoal] = useState(profile?.dailyFocusGoalHours?.toString() || '4');
  const [updating, setUpdating] = useState(false);

  // Sync state if profile loads after initial mount
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setProfession(profile.profession || '');
      setFocusGoal(profile.dailyFocusGoalHours?.toString() || '4');
    }
  }, [profile]);

  // Stats Logic
  const totalTasks = useMemo(() => tasks?.filter(t => t.completed).length || 0, [tasks]);
  const totalHours = useMemo(() => modules?.reduce((acc, m) => acc + (m.hoursDone || 0), 0).toFixed(1) || "0.0", [modules]);
  
  // XP Logic: Robust check to prevent NaN
  const xpProgress = useMemo(() => {
    const currentXP = profile?.xp ?? 0;
    const progress = (currentXP % 1000) / 10; 
    return isNaN(progress) ? 0 : progress;
  }, [profile?.xp]);

  // Filter only ACHIEVED badges
  const achievedBadges = useMemo(() => {
    const userBadgeIds = profile?.badges || [];
    return ALL_BADGES.filter(b => userBadgeIds.includes(b.id));
  }, [profile?.badges]);

  const getRankName = (lvl: number) => {
    if (lvl >= 10) return "Global Titan";
    if (lvl >= 5) return "Executive Strategist";
    if (lvl >= 2) return "Focus Sentinel";
    return "Initial Novice";
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        handleSave(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Could not access image library");
    }
  };

  const handleSave = async (imageUri?: string) => {
    if (!updateProfile) {
      Alert.alert("System Error", "Update function not found in Context. Please check ValenContext.tsx exports.");
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        name: name.trim(),
        profession: profession.trim(),
        dailyFocusGoalHours: parseInt(focusGoal) || 4,
      };
      
      await updateProfile(updateData, imageUri);
      Alert.alert("Success", "Neural ID Updated");
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Update Failed", "System encountered an error syncing with core.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PREMIUM NEURAL ID CARD */}
        <View style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <View>
              <Text style={styles.idBrand}>VALEN_SYSTEMS</Text>
              {/* FIXED UID: Checks both .uid and .id */}
              <Text style={styles.idSerial}>UID: {(profile?.uid || profile?.id || 'AUTH_PENDING').substring(0, 14).toUpperCase()}</Text>
            </View>
            <View style={styles.rankBadge}>
               <Text style={styles.rankText}>LVL {profile?.level || 1}</Text>
            </View>
          </View>

          <View style={styles.idCardBody}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={30} color={MINT_GREEN} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.idInfo}>
              <Text style={styles.idName}>{profile?.name || 'Authorized User'}</Text>
              <Text style={styles.idTitle}>{getRankName(profile?.level || 1)}</Text>
              
              <View style={styles.xpContainer}>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
                </View>
                <Text style={styles.xpText}>{(profile?.xp ?? 0) % 1000} / 1000 XP</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.idCardFooter}>
            <View style={styles.statMini}>
              <Text style={styles.statLabel}>HOURS</Text>
              <Text style={styles.statValue}>{totalHours}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statMini}>
              <Text style={styles.statLabel}>TASKS</Text>
              <Text style={styles.statValue}>{totalTasks}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statMini}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={[styles.statValue, { color: MINT_GREEN }]}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* ACHIEVED BADGES - PREMIUM VIEW */}
        {achievedBadges.length > 0 && (
          <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>Achieved Excellence</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                {achievedBadges.map((badge) => (
                    <View key={badge.id} style={styles.badgeItem}>
                        <View style={[styles.badgeIconBg, { backgroundColor: badge.color }]}>
                            <Ionicons name={badge.icon as any} size={24} color="#FFF" />
                        </View>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                    </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* SYSTEM CONFIGURATION */}
        <Text style={styles.sectionTitle}>System Parameters</Text>
        
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={20} color={MINT_GREEN} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.label}>Identity Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Name"
                placeholderTextColor={TEXT_GREY}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="flash-outline" size={20} color={MINT_GREEN} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.label}>Focus Goal (Daily Hours)</Text>
              <TextInput 
                style={styles.input} 
                value={focusGoal} 
                onChangeText={setFocusGoal} 
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor={TEXT_GREY}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="mail-outline" size={20} color={TEXT_GREY} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.label}>Access Email</Text>
              <Text style={styles.staticEmail}>{profile?.email || 'unlinked'}</Text>
            </View>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.dangerZone}>
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={() => handleSave()}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Update Core Profile</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4B4B" />
            <Text style={styles.logoutText}>Terminate Session</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  scrollContent: { padding: 20 },
  idCard: { backgroundColor: '#1A1A1A', borderRadius: 28, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  idBrand: { color: MINT_GREEN, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  idSerial: { color: TEXT_GREY, fontSize: 8, fontWeight: '600', marginTop: 2 },
  rankBadge: { backgroundColor: MINT_GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rankText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  idCardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: MINT_GREEN },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: MINT_GREEN, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A1A1A' },
  idInfo: { marginLeft: 20, flex: 1 },
  idName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  idTitle: { color: MINT_GREEN, fontSize: 12, fontWeight: '700', marginTop: 2 },
  xpContainer: { marginTop: 12 },
  xpTrack: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%' },
  xpFill: { height: '100%', backgroundColor: MINT_GREEN, borderRadius: 2 },
  xpText: { color: TEXT_GREY, fontSize: 8, fontWeight: '700', marginTop: 4 },
  idCardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  statMini: { alignItems: 'center', flex: 1 },
  statLabel: { color: TEXT_GREY, fontSize: 8, fontWeight: '800', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  statDivider: { width: 1, height: 20, backgroundColor: '#333' },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: TEXT_DARK, textTransform: 'uppercase', letterSpacing: 1, marginTop: 30, marginBottom: 15 },
  badgeSection: { marginBottom: 10 },
  badgeScroll: { flexDirection: 'row' },
  badgeItem: { alignItems: 'center', marginRight: 25, width: 70 },
  badgeIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  badgeName: { color: TEXT_DARK, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  settingsGroup: { backgroundColor: CARD_WHITE, borderRadius: 24, padding: 10, elevation: 2 },
  settingItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F0', alignItems: 'center' },
  settingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FAF9', justifyContent: 'center', alignItems: 'center' },
  settingText: { marginLeft: 15, flex: 1 },
  label: { fontSize: 10, fontWeight: '800', color: TEXT_GREY, textTransform: 'uppercase' },
  input: { fontSize: 15, fontWeight: '600', color: TEXT_DARK, marginTop: 2, padding: 0 },
  staticEmail: { fontSize: 15, fontWeight: '600', color: TEXT_GREY, marginTop: 2 },
  dangerZone: { marginTop: 30, gap: 15 },
  saveBtn: { backgroundColor: MINT_GREEN, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 15 },
  logoutText: { color: '#FF4B4B', fontWeight: '700', fontSize: 15 }
});