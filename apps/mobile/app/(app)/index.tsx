import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

const MODULES = [
  { icon: '📍', label: 'Absensi', sub: 'Check-in & Check-out', route: '/attendance' as const },
  { icon: '✅', label: 'Tasks', sub: 'Job & pekerjaan saya', route: '/tasks' as const },
  { icon: '🏖', label: 'Cuti', sub: 'Pengajuan & riwayat', route: '/leave' as const },
  { icon: '🧾', label: 'Reimburse', sub: 'Klaim biaya lapangan', route: '/reimbursement' as const },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat datang,</Text>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* App title */}
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>AutoRAB X — Field App</Text>
        </View>

        {/* Module Grid */}
        <Text style={styles.sectionLabel}>Menu Utama</Text>
        <View style={styles.grid}>
          {MODULES.map((m) => (
            <TouchableOpacity key={m.route} style={styles.moduleCard} onPress={() => router.push(m.route)}>
              <Text style={styles.moduleIcon}>{m.icon}</Text>
              <Text style={styles.moduleLabel}>{m.label}</Text>
              <Text style={styles.moduleSub}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>v1.0.0 · AutoRAB X Enterprise EPC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 14, color: '#64748b' },
  name: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  date: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  brandBadge: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 24, alignItems: 'center' },
  brandText: { color: '#93c5fd', fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  moduleIcon: { fontSize: 32, marginBottom: 10 },
  moduleLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  moduleSub: { fontSize: 12, color: '#94a3b8' },
  footer: { textAlign: 'center', marginTop: 32, fontSize: 11, color: '#cbd5e1' },
});
