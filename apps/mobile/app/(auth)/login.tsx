import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [tenantCode, setTenantCode] = useState('DEMO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!tenantCode.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Lengkapi semua field');
      return;
    }
    setLoading(true);
    try {
      await login(tenantCode.trim().toUpperCase(), email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login gagal. Periksa kembali data Anda.';
      Alert.alert('Login Gagal', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>AutoRAB X</Text>
          <Text style={styles.subtitle}>Enterprise EPC Platform</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Masuk</Text>

          <Text style={styles.label}>Kode Tenant</Text>
          <TextInput
            style={styles.input}
            value={tenantCode}
            onChangeText={(t) => setTenantCode(t.toUpperCase())}
            placeholder="e.g. DEMO"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@demo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Memproses...' : 'Masuk'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 32, fontWeight: '800', color: '#1e3a5f' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 16, backgroundColor: '#f8fafc' },
  btn: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
