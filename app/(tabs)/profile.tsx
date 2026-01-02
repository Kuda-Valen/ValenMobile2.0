import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useValen } from '../../src/context/ValenContext';

// CONSISTENT THEME CONSTANTS
const CREAM_BG = '#F5F5F0'; 
const CARD_WHITE = '#FFFFFF';
const MINT_GREEN = '#00BFA5';
const TEXT_DARK = '#1A1A1A';
const TEXT_GREY = '#8E8E93';

const AVAILABLE_FEATURES = [
  { id: 'tasks', label: 'Task Engine', icon: 'checkmark-circle-outline' },
  { id: 'academic', label: 'Academic Hub', icon: 'book-outline' },
  { id: 'religion', label: 'Habit Tracker', icon: 'sunny-outline' },
  { id: 'financial', label: 'Financials', icon: 'cash-outline' },
  { id: 'fitness', label: 'Fitness Log', icon: 'fitness-outline' },
];

export default function ProfileScreen() {
  const { profile, updateProfile, logout } = useValen();
  const [name, setName] = useState(profile?.name || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(profile?.selectedFeatures || []);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setProfession(profile.profession);
      setSelectedFeatures(profile.selectedFeatures || []);
    }
  }, [profile]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleSave(result.assets[0].uri);
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSave = async (imageUri?: string) => {
    setUpdating(true);
    try {
      await updateProfile(
        {
          name,
          profession,
          selectedFeatures,
        },
        imageUri
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={MINT_GREEN} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={CARD_WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.emailText}>{profile?.email}</Text>
        </View>

        {/* Personal Info Group */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal Info</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
               <Ionicons name="person-outline" size={18} color={TEXT_GREY} style={styles.inputIcon} />
               <TextInput
                 style={styles.input}
                 placeholder="Display Name"
                 placeholderTextColor={TEXT_GREY}
                 value={name}
                 onChangeText={setName}
               />
            </View>
            <View style={[styles.inputWrapper, styles.noBorder]}>
               <Ionicons name="briefcase-outline" size={18} color={TEXT_GREY} style={styles.inputIcon} />
               <TextInput
                 style={styles.input}
                 placeholder="Profession"
                 placeholderTextColor={TEXT_GREY}
                 value={profession}
                 onChangeText={setProfession}
               />
            </View>
          </View>
        </View>

        {/* Feature Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active Modules</Text>
          <View style={styles.featureGrid}>
            {AVAILABLE_FEATURES.map((feature) => {
              const isActive = selectedFeatures.includes(feature.id);
              return (
                <TouchableOpacity
                  key={feature.id}
                  style={[styles.featureItem, isActive && styles.featureItemActive]}
                  onPress={() => toggleFeature(feature.id)}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={18}
                    color={isActive ? CARD_WHITE : TEXT_GREY}
                  />
                  <Text style={[styles.featureText, isActive && styles.featureTextActive]}>
                    {feature.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave()}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={CARD_WHITE} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM_BG },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerTitle: { color: TEXT_DARK, fontSize: 32, fontWeight: '800', marginBottom: 25 },
  
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  imageWrapper: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: CARD_WHITE },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: CARD_WHITE, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: MINT_GREEN, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: CARD_WHITE },
  emailText: { color: TEXT_GREY, marginTop: 12, fontSize: 14, fontWeight: '500' },

  section: { marginBottom: 30 },
  sectionLabel: { color: TEXT_GREY, fontSize: 12, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  inputGroup: { backgroundColor: CARD_WHITE, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: CREAM_BG },
  noBorder: { borderBottomWidth: 0 },
  inputIcon: { marginRight: 10 },
  input: { color: TEXT_DARK, flex: 1, height: 55, fontSize: 16, fontWeight: '500' },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { backgroundColor: CARD_WHITE, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  featureItemActive: { backgroundColor: MINT_GREEN },
  featureText: { color: TEXT_GREY, fontWeight: '600', fontSize: 14 },
  featureTextActive: { color: CARD_WHITE },

  saveButton: { backgroundColor: MINT_GREEN, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4, shadowColor: MINT_GREEN, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  saveButtonText: { color: CARD_WHITE, fontSize: 16, fontWeight: '700' },
  logoutButton: { marginTop: 20, alignItems: 'center', padding: 15 },
  logoutText: { color: '#FF4B4B', fontSize: 16, fontWeight: '700' }
});