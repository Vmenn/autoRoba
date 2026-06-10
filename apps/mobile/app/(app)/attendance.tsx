import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { attendanceApi, projectApi } from '@/lib/api';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    PRESENT: { bg: '#dcfce7', text: '#16a34a' },
    ABSENT: { bg: '#fee2e2', text: '#dc2626' },
    LATE: { bg: '#fef9c3', text: '#ca8a04' },
  };
  const c = colors[status] ?? { bg: '#f1f5f9', text: '#64748b' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

export default function AttendanceScreen() {
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const [todayData, histData, projData] = await Promise.all([
        attendanceApi.today().catch(() => null),
        attendanceApi.history().catch(() => ({ items: [] })),
        projectApi.list().catch(() => ({ items: [] })),
      ]);
      setToday(todayData);
      setHistory(histData?.items ?? []);
      setProjects(projData?.items ?? []);
      if (projData?.items?.[0]) setSelectedProject(projData.items[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCheckIn = async () => {
    if (!selectedProject) { Alert.alert('Pilih proyek terlebih dahulu'); return; }
    setActionLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Izin lokasi diperlukan untuk check-in'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await attendanceApi.checkIn({
        projectId: selectedProject,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Berhasil', 'Check-in berhasil dicatat!');
      loadData();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Check-in gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Izin lokasi diperlukan'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await attendanceApi.checkOut({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Alert.alert('Berhasil', 'Check-out berhasil dicatat!');
      loadData();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Check-out gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Absensi</Text>
        <Text style={styles.date}>{todayStr}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1e3a5f" />
        ) : (
          <>
            {/* Today card */}
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>Status Hari Ini</Text>
                {today && <StatusBadge status={today.status} />}
              </View>
              {today ? (
                <View style={styles.timeRow}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>Check-In</Text>
                    <Text style={styles.timeValue}>{today.checkInTime ? new Date(today.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>Check-Out</Text>
                    <Text style={styles.timeValue}>{today.checkOutTime ? new Date(today.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noData}>Belum ada absensi hari ini</Text>
              )}
            </View>

            {/* Project picker */}
            {!today?.checkInTime && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pilih Proyek</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {projects.map((p: any) => (
                    <TouchableOpacity key={p.id} onPress={() => setSelectedProject(p.id)}
                      style={[styles.projectChip, selectedProject === p.id && styles.projectChipActive]}>
                      <Text style={[styles.projectChipText, selectedProject === p.id && styles.projectChipTextActive]}>
                        {p.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              {!today?.checkInTime && (
                <TouchableOpacity style={[styles.actionBtn, styles.checkInBtn, actionLoading && styles.disabled]}
                  onPress={handleCheckIn} disabled={actionLoading}>
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.actionBtnText}>{actionLoading ? 'Memproses...' : 'Check-In'}</Text>
                </TouchableOpacity>
              )}
              {today?.checkInTime && !today?.checkOutTime && (
                <TouchableOpacity style={[styles.actionBtn, styles.checkOutBtn, actionLoading && styles.disabled]}
                  onPress={handleCheckOut} disabled={actionLoading}>
                  <Text style={styles.actionIcon}>🏠</Text>
                  <Text style={styles.actionBtnText}>{actionLoading ? 'Memproses...' : 'Check-Out'}</Text>
                </TouchableOpacity>
              )}
              {today?.checkInTime && today?.checkOutTime && (
                <View style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}>
                  <Text style={styles.actionIcon}>✅</Text>
                  <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Selesai</Text>
                </View>
              )}
            </View>

            {/* History */}
            <Text style={styles.sectionLabel}>Riwayat Absensi</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada riwayat</Text>
            ) : (
              history.slice(0, 10).map((h: any) => (
                <View key={h.id} style={styles.historyItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histDate}>{new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <Text style={styles.histTime}>
                      {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {' '}→ {h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Text>
                  </View>
                  <StatusBadge status={h.status} />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  date: { fontSize: 13, color: '#93c5fd', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  timeRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  timeBox: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 11, color: '#94a3b8' },
  timeValue: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  timeDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  noData: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 12 },
  projectChip: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  projectChipActive: { backgroundColor: '#1e3a5f' },
  projectChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  projectChipTextActive: { color: '#fff' },
  actionRow: { marginBottom: 16 },
  actionBtn: { backgroundColor: '#1e3a5f', borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  checkInBtn: { backgroundColor: '#1e3a5f' },
  checkOutBtn: { backgroundColor: '#dc2626' },
  disabled: { opacity: 0.6 },
  actionIcon: { fontSize: 22 },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 16 },
  historyItem: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  histDate: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  histTime: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
