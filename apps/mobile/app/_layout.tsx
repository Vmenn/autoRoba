import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, init } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inApp = segments[0] === '(app)';
    if (!user && inApp) router.replace('/(auth)/login');
    else if (user && !inApp) router.replace('/(app)');
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </SafeAreaProvider>
  );
}
