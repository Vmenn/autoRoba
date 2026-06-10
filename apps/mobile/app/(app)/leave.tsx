import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { leaveApi } from '@/lib/api';

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Cuti Tahunan' },
  { value: 'SICK', label: 'Cuti Sakit' },
  { value: 'EMERGENCY', label: 'Cuti Darurat' },
  { value: 'UNPAID', label: 'Cuti Tidak Dibayar' },
  { value: 'MATERNITY', label: 'Cuti Melahirkan' },
  { value: 'PATERNITY', label: 'Cuti Ayah' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Menunggu', color: '#d97706', bg: '#fef3c7' },
  APPROVED: { label: 'Disetujui', color: '#059669', bg: '#d1fae5' },
  REJECTED: { label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2' },
  CANCELLED: { label: 'Dibatalkan', color: '#64748b', bg: '#f1f5f9' },
};

export default function LeaveScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await leaveApi.list();
      setLeaves(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason) {
      Alert.alert('Lengkapi semua field');
      return;
    }
    setSaving(true);
    try {
      await leaveApi.create(form);
      Alert.alert('Berhasil', 'Pengajuan cuti telah dikirim');
      setShowModal(false);
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Gagal mengajukan cuti');
    } finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    Alert.alert('Batalkan Cuti', 'Yakin ingin membatalkan pengajuan ini?', [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Ya, Batalkan', style: 'destructive', onPress: async () => {
        try {
          await leaveApi.cancel(id);
          load();
        } catch (err: any) {
          Alert.alert('Gagal', err?.response?.data?.message ?? 'Gagal membatalkan');
        }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cuti</Text>
          <Text style={styles.subtitle}>{total} pengajuan</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Ajukan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1e3a5f" />
        ) : leaves.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada pengajuan cuti</Text>
        ) : (
          leaves.map((l: any) => {
            const cfg = STATUS_CFG[l.status] ?? STATUS_CFG.PENDING;
            const typeLabel = LEAVE_TYPES.find((t) => t.value === l.leaveType)?.label ?? l.leaveType;
            const start = new Date(l.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            const end = new Date(l.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <View key={l.id} style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <Text style={styles.leaveType}>{typeLabel}</Text>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <Text style={styles.leaveDates}>{start} — {end} ({l.totalDays ?? '?'} hari)</Text>
                <Text style={styles.leaveReason} numberOfLines={2}>{l.reason}</Text>
                {l.status === 'PENDING' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(l.id)}>
                    <Text style={styles.cancelBtnText}>Batalkan</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Submit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajukan Cuti</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Jenis Cuti</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
                contentContainerStyle={{ gap: 8 }}>
                {LEAVE_TYPES.map((t) => (
                  <TouchableOpacity key={t.value} onPress={() => setForm((f) => ({ ...f, leaveType: t.value }))}
                    style={[styles.typeChip, form.leaveType === t.value && styles.typeChipActive]}>
                    <Text style={[styles.typeChipText, form.leaveType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Tanggal Mulai (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.startDate}
                onChangeText={(t) => setForm((f) => ({ ...f, startDate: t }))}
                placeholder="2026-06-15" keyboardType="numeric" />

              <Text style={styles.label}>Tanggal Selesai (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.endDate}
                onChangeText={(t) => setForm((f) => ({ ...f, endDate: t }))}
                placeholder="2026-06-20" keyboardType="numeric" />

              <Text style={styles.label}>Alasan / Keterangan *</Text>
              <TextInput style={[styles.input, styles.textarea]} value={form.reason}
                onChangeText={(t) => setForm((f) => ({ ...f, reason: t }))}
                placeholder="Jelaskan alasan cuti..." multiline numberOfLines={4} />

              <TouchableOpacity style={[styles.submitBtn, saving && styles.disabled]} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.submitBtnText}>{saving ? 'Mengirim...' : 'Kirim Pengajuan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#93c5fd', marginTop: 2 },
  addBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 80 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 },
  leaveCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  leaveType: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  leaveDates: { fontSize: 13, color: '#475569', marginBottom: 4 },
  leaveReason: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cancelBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  closeBtn: { fontSize: 20, color: '#94a3b8' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 14, backgroundColor: '#f8fafc' },
  textarea: { height: 90, textAlignVertical: 'top' },
  typeChip: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  typeChipActive: { backgroundColor: '#1e3a5f' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  typeChipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
