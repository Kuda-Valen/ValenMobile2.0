import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ValenProvider, useValen } from '../src/context/ValenContext';
// Import the component we created
import { SuccessModal } from '../components/SuccessModal';

function RootLayoutNav() {
  const { user, loading, showSuccess, closeSuccessModal } = useValen();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0' }}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F5F0' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* THE GLOBAL SUCCESS OVERLAY */}
      <SuccessModal 
        isVisible={showSuccess.visible}
        type={showSuccess.type}
        data={showSuccess.data}
        onClose={closeSuccessModal}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ValenProvider>
      <RootLayoutNav />
    </ValenProvider>
  );
}