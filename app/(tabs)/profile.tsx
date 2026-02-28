import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useValen } from '../../src/context/ValenContext';

const { width } = Dimensions.get('window');
const MINT_GREEN = '#00BFA5';

const ALL_BADGES = [
  { id: 'deep_diver', name: 'Deep Diver', icon: 'water', color: '#007AFF' },
  { id: 'monk_mode', name: 'Monk Mode', icon: 'infinite', color: '#AF52DE' },
  { id: 'midnight_scholar', name: 'Midnight Scholar', icon: 'moon', color: '#FF9500' },
  { id: 'consistency_king', name: 'Consistency', icon: 'calendar', color: '#FF3B30' },
];

export default function ProfileScreen() {
  const valenContext = useValen();
  const { profile, logout, tasks, modules } = valenContext;
  const updateProfile = valenContext.updateProfile || valenContext.updateUserProfile;

  // --- THEME MAPPING ---
  const isDark = profile?.theme === 'dark';
  const theme = {
    bg: isDark ? '#121212' : '#F5F5F0',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textDark: isDark ? '#FFFFFF' : '#1A1A1A',
    textGrey: isDark ? '#A0A0A0' : '#8E8E93',
    itemBg: isDark ? '#2A2A2A' : '#F5F5F0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F0',
    iconBg: isDark ? 'rgba(0, 191, 165, 0.1)' : '#F0FAF9'
  };

  const [name, setName] = useState(profile?.name || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [focusGoal, setFocusGoal] = useState(profile?.dailyFocusGoalHours?.toString() || '4');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setProfession(profile.profession || '');
      setFocusGoal(profile.dailyFocusGoalHours?.toString() || '4');
    }
  }, [profile]);

  const totalTasks = useMemo(() => tasks?.filter(t => t.completed).length || 0, [tasks]);
  const totalHours = useMemo(() => modules?.reduce((acc, m) => acc + (m.hoursDone || 0), 0).toFixed(1) || "0.0", [modules]);
  
  const xpProgress = useMemo(() => {
    const currentXP = profile?.xp ?? 0;
    const progress = (currentXP % 1000) / 10; 
    return isNaN(progress) ? 0 : progress;
  }, [profile?.xp]);

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
      Alert.alert("System Error", "Update function not found.");
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
      Alert.alert("Update Failed", "System error syncing with core.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PREMIUM NEURAL ID CARD (Maintains Dark Look) */}
        <View style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <View>
              <Text style={styles.idBrand}>VALEN_SYSTEMS</Text>
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
              <View style={[styles.cameraIcon, { borderColor: '#1A1A1A' }]}>
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

        {/* ACHIEVED BADGES */}
        {achievedBadges.length > 0 && (
          <View style={styles.badgeSection}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Achieved Excellence</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                {achievedBadges.map((badge) => (
                    <View key={badge.id} style={styles.badgeItem}>
                        <View style={[styles.badgeIconBg, { backgroundColor: badge.color }]}>
                            <Ionicons name={badge.icon as any} size={24} color="#FFF" />
                        </View>
                        <Text style={[styles.badgeName, { color: theme.textDark }]}>{badge.name}</Text>
                    </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* SYSTEM CONFIGURATION */}
        <Text style={[styles.sectionTitle, { color: theme.textDark }]}>System Parameters</Text>
        
        <View style={[styles.settingsGroup, { backgroundColor: theme.card }]}>
          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="person-outline" size={20} color={MINT_GREEN} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.label, { color: theme.textGrey }]}>Identity Name</Text>
              <TextInput 
                style={[styles.input, { color: theme.textDark }]} 
                value={name} 
                onChangeText={setName} 
                placeholder="Name"
                placeholderTextColor={theme.textGrey}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="flash-outline" size={20} color={MINT_GREEN} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.label, { color: theme.textGrey }]}>Focus Goal (Daily Hours)</Text>
              <TextInput 
                style={[styles.input, { color: theme.textDark }]} 
                value={focusGoal} 
                onChangeText={setFocusGoal} 
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor={theme.textGrey}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.itemBg }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textGrey} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.label, { color: theme.textGrey }]}>Access Email</Text>
              <Text style={[styles.staticEmail, { color: theme.textGrey }]}>{profile?.email || 'unlinked'}</Text>
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

          {/* --- ACCOUNT TERMINATION (Apple Compliance) --- */}
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => {
              Alert.alert(
                "Neural Wipe",
                "This will permanently delete your neural profile and all academic history. This cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete Permanently", style: "destructive", onPress: () => Alert.alert("Request Sent", "Your account termination request is being processed.") }
                ]
              );
            }}
          >
            <Text style={styles.deleteText}>Request Account Termination</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  idCard: { backgroundColor: '#1A1A1A', borderRadius: 28, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  idBrand: { color: '#00BFA5', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  idSerial: { color: '#8E8E93', fontSize: 8, fontWeight: '600', marginTop: 2 },
  rankBadge: { backgroundColor: '#00BFA5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rankText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  idCardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#00BFA5' },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00BFA5', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  idInfo: { marginLeft: 20, flex: 1 },
  idName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  idTitle: { color: '#00BFA5', fontSize: 12, fontWeight: '700', marginTop: 2 },
  xpContainer: { marginTop: 12 },
  xpTrack: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%' },
  xpFill: { height: '100%', backgroundColor: '#00BFA5', borderRadius: 2 },
  xpText: { color: '#8E8E93', fontSize: 8, fontWeight: '700', marginTop: 4 },
  idCardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  statMini: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#8E8E93', fontSize: 8, fontWeight: '800', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  statDivider: { width: 1, height: 20, backgroundColor: '#333' },
  sectionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 30, marginBottom: 15 },
  badgeSection: { marginBottom: 10 },
  badgeScroll: { flexDirection: 'row' },
  badgeItem: { alignItems: 'center', marginRight: 25, width: 70 },
  badgeIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  badgeName: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  settingsGroup: { borderRadius: 24, padding: 10, elevation: 2 },
  settingItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, alignItems: 'center' },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingText: { marginLeft: 15, flex: 1 },
  label: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  input: { fontSize: 15, fontWeight: '600', marginTop: 2, padding: 0 },
  staticEmail: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  dangerZone: { marginTop: 30, gap: 15 },
  saveBtn: { backgroundColor: '#00BFA5', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 15 },
  logoutText: { color: '#FF4B4B', fontWeight: '700', fontSize: 15 },
  deleteBtn: { padding: 10, alignItems: 'center', marginTop: 5 },
  deleteText: { color: '#FF4B4B', fontSize: 12, fontWeight: '600', opacity: 0.6 }
});