import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';

type Section = 'leave' | 'reimbursement';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Menunggu',  color: '#d97706', bg: '#fef3c7' },
  SUBMITTED: { label: 'Diajukan', color: '#2563eb', bg: '#dbeafe' },
  APPROVED:  { label: 'Disetujui', color: '#059669', bg: '#d1fae5' },
  REJECTED:  { label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2' },
  PAID:      { label: 'Dibayar',   color: '#7c3aed', bg: '#ede9fe' },
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Cuti Tahunan', SICK: 'Cuti Sakit', EMERGENCY: 'Darurat',
  UNPAID: 'Tidak Dibayar', MATERNITY: 'Melahirkan', PATERNITY: 'Ayah',
};

const REIMB_CAT_LABELS: Record<string, string> = {
  TRANSPORT: '🚗 Transport', ACCOMMODATION: '🏨 Penginapan', MEAL: '🍽 Makan',
  OFFICE_SUPPLY: '📎 ATK', COMMUNICATION: '📱 Komunikasi', OTHER: '📦 Lainnya',
};

function fmt(n: any) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n ?? 0));
}

export default function ApprovalScreen() {
  const [section, setSection] = useState<Section>('leave');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, rRes] = await Promise.all([
        api.get('/v1/leaves/pending').then((r) => r.data).catch(() => ({ items: [] })),
        api.get('/v1/reimbursements?status=SUBMITTED').then((r) => r.data).catch(() => ({ items: [] })),
      ]);
      setLeaves(lRes.items ?? []);
      setReimbursements(rRes.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLeaveReview = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setActing(id);
    try {
      await api.patch(`/v1/leaves/${id}/review`, { action });
      Alert.alert('Berhasil', action === 'APPROVED' ? 'Cuti disetujui' : 'Cuti ditolak');
      load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Terjadi kesalahan');
    } finally {
      setActing(null);
    }
  };

  const handleReimbReview = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setActing(id);
    try {
      await api.patch(`/v1/reimbursements/${id}/review`, { action });
      Alert.alert('Berhasil', action === 'APPROVED' ? 'Reimburse disetujui' : 'Reimburse ditolak');
      load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Terjadi kesalahan');
    } finally {
      setActing(null);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const pendingReimb = reimbursements.filter((r) => r.status === 'SUBMITTED');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Approval</Text>
        <Text style={styles.subtitle}>
          {pendingLeaves.length} cuti · {pendingReimb.length} reimburse menunggu
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, section === 'leave' && styles.tabActive]}
          onPress={() => setSection('leave')}>
          <Text style={[styles.tabText, section === 'leave' && styles.tabTextActive]}>
            🏖 Cuti {pendingLeaves.length > 0 && <Text style={styles.badge}>{pendingLeaves.length}</Text>}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, section === 'reimbursement' && styles.tabActive]}
          onPress={() => setSection('reimbursement')}>
          <Text style={[styles.tabText, section === 'reimbursement' && styles.tabTextActive]}>
            🧾 Reimburse {pendingReimb.length > 0 && <Text style={styles.badge}>{pendingReimb.length}</Text>}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1e3a5f" />
        ) : section === 'leave' ? (
          pendingLeaves.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada pengajuan cuti yang menunggu</Text>
          ) : (
            pendingLeaves.map((l) => (
              <View key={l.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{l.user?.firstName} {l.user?.lastName}</Text>
                    <Text style={styles.cardSub}>{LEAVE_TYPE_LABELS[l.leaveType] ?? l.leaveType}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_CFG.PENDING.bg }]}>
                    <Text style={[styles.statusText, { color: STATUS_CFG.PENDING.color }]}>Menunggu</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tanggal:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(l.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(l.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}({l.totalDays} hari)
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alasan:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{l.reason}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, acting === l.id && styles.disabled]}
                    onPress={() => handleLeaveReview(l.id, 'REJECTED')}
                    disabled={!!acting}>
                    <Text style={styles.rejectBtnText}>✕ Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveBtn, acting === l.id && styles.disabled]}
                    onPress={() => handleLeaveReview(l.id, 'APPROVED')}
                    disabled={!!acting}>
                    <Text style={styles.approveBtnText}>✓ Setujui</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          pendingReimb.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada reimburse yang menunggu</Text>
          ) : (
            pendingReimb.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{r.user?.firstName} {r.user?.lastName}</Text>
                    <Text style={styles.cardSub}>{REIMB_CAT_LABELS[r.category] ?? r.category}</Text>
                  </View>
                  <Text style={styles.amount}>{fmt(r.amount)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tanggal:</Text>
                  <Text style={styles.infoValue}>{new Date(r.expenseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Keterangan:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{r.description}</Text>
                </View>
                <Text style={styles.claimNo}>{r.claimNo}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, acting === r.id && styles.disabled]}
                    onPress={() => handleReimbReview(r.id, 'REJECTED')}
                    disabled={!!acting}>
                    <Text style={styles.rejectBtnText}>✕ Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.approveBtn, acting === r.id && styles.disabled]}
                    onPress={() => handleReimbReview(r.id, 'APPROVED')}
                    disabled={!!acting}>
                    <Text style={styles.approveBtnText}>✓ Setujui</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1e3a5f' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#1e3a5f' },
  badge: { fontSize: 11, color: '#dc2626', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 80 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '800', color: '#1e3a5f' },
  infoRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  infoLabel: { fontSize: 12, color: '#94a3b8', width: 70 },
  infoValue: { flex: 1, fontSize: 12, color: '#374151' },
  claimNo: { fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff5f5' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  approveBtn: { flex: 1, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.6 },
});
