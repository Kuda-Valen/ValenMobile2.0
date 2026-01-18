import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Updated to include LEVEL_UP
interface SuccessModalProps {
  isVisible: boolean;
  type: 'SESSION_COMPLETE' | 'RINGS_CLOSED' | 'LEVEL_UP';
  onClose: () => void;
  data?: any;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isVisible, type, onClose, data }) => {
  const isLevel = type === 'LEVEL_UP';
  const isRings = type === 'RINGS_CLOSED';

  // Dynamic Color and Icon Logic
  const accentColor = isLevel ? '#AF52DE' : (isRings ? '#00BFA5' : '#007AFF');
  const mainIcon = isLevel ? "ribbon" : (isRings ? "trophy" : "checkmark-circle");

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          entering={ZoomIn.duration(400)} 
          style={styles.card}
        >
          {/* Animated Glow for Level Up */}
          {isLevel && <View style={[styles.glow, { backgroundColor: accentColor }]} />}

          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Ionicons name={mainIcon} size={50} color="#FFF" />
          </View>
          
          <Text style={styles.title}>
            {isLevel ? "Neural Ascension" : (isRings ? "Elite Performance" : "Focus Depth Achieved")}
          </Text>
          
          <Animated.Text 
            entering={FadeInUp.delay(200)} 
            style={styles.subtitle}
          >
            {isLevel 
              ? `You have evolved to Level ${data?.newLevel}. Your mental processing and endurance parameters have officially increased.`
              : isRings 
                ? "You have mastered both your academic and discipline pillars today. You are operating at 100% capacity."
                : `Successfully logged ${data?.minutes || 0} minutes of deep work on ${data?.topic || 'your task'}.`}
          </Animated.Text>

          {/* Reward Badges Row */}
          <View style={styles.rewardRow}>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>+{data?.xpGained || 50} XP</Text>
            </View>
            {isRings && (
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>Titan Streak +1</Text>
              </View>
            )}
          </View>

          {/* Badge Unlock Notification */}
          {data?.badgeEarned && (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.badgeReveal}>
              <Ionicons name="shield-checkmark" size={18} color="#FFD700" />
              <Text style={styles.badgeRevealText}>NEW BADGE ARCHIVED</Text>
            </Animated.View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>
                {isLevel ? "Continue Ascension" : "Continue Growth"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
    zIndex: -1,
  },
  card: { 
    backgroundColor: '#FFF', 
    width: width * 0.85, 
    borderRadius: 32, 
    padding: 30, 
    alignItems: 'center', 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  iconCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#1A1A1A', 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginTop: 10, 
    lineHeight: 22 
  },
  rewardRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 20 
  },
  rewardBadge: { 
    backgroundColor: '#F5F5F0', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  rewardText: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#1A1A1A' 
  },
  badgeReveal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  badgeRevealText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: { 
    backgroundColor: '#1A1A1A', 
    width: '100%', 
    height: 55, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 30 
  },
  closeBtnText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 16 
  }
});