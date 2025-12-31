import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useValen } from '../../src/context/ValenContext';

const DARK_BG = '#000000';
const CARD_BG = '#1C1C1E';
const VANILLA = '#F3E5AB';
const TEXT_SECONDARY = '#8E8E93';

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={DARK_BG} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={DARK_BG} />
            </View>
          </TouchableOpacity>
          <Text style={styles.emailText}>{profile?.email}</Text>
        </View>

        {/* Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal Info</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor={TEXT_SECONDARY}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Profession"
              placeholderTextColor={TEXT_SECONDARY}
              value={profession}
              onChangeText={setProfession}
            />
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
                    size={20}
                    color={isActive ? DARK_BG : VANILLA}
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
          {updating ? <ActivityIndicator color={DARK_BG} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  scrollContent: { padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 34, fontWeight: '800', marginBottom: 30 },
  
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  imageWrapper: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: VANILLA },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: VANILLA, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: VANILLA, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: DARK_BG },
  emailText: { color: TEXT_SECONDARY, marginTop: 10, fontSize: 14 },

  section: { marginBottom: 25 },
  sectionLabel: { color: TEXT_SECONDARY, fontSize: 13, textTransform: 'uppercase', fontWeight: '600', marginBottom: 10, marginLeft: 5 },
  inputGroup: { backgroundColor: CARD_BG, borderRadius: 15, padding: 5 },
  input: { color: '#FFF', height: 50, paddingHorizontal: 15, fontSize: 16 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { backgroundColor: CARD_BG, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderSize: 1, borderColor: '#333' },
  featureItemActive: { backgroundColor: VANILLA },
  featureText: { color: '#FFF', fontWeight: '600' },
  featureTextActive: { color: DARK_BG },

  saveButton: { backgroundColor: VANILLA, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: DARK_BG, fontSize: 16, fontWeight: '700' },
  logoutButton: { marginTop: 20, alignItems: 'center', padding: 15 },
  logoutText: { color: '#FF453A', fontSize: 16, fontWeight: '600' }
});
