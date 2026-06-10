import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { taskApi } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:       { label: 'Draft',       color: '#64748b', bg: '#f1f5f9' },
  OPEN:        { label: 'Open',        color: '#2563eb', bg: '#dbeafe' },
  ASSIGNED:    { label: 'Assigned',    color: '#7c3aed', bg: '#ede9fe' },
  IN_PROGRESS: { label: 'Dikerjakan',  color: '#d97706', bg: '#fef3c7' },
  SUBMITTED:   { label: 'Dikirim',     color: '#0891b2', bg: '#cffafe' },
  VERIFIED:    { label: 'Terverifikasi', color: '#059669', bg: '#d1fae5' },
  CLOSED:      { label: 'Selesai',     color: '#16a34a', bg: '#dcfce7' },
};

function JobCard({ job, onUpdate }: { job: any; onUpdate: () => void }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [progress, setProgress] = useState(String(job.progressPct ?? 0));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;

  const canUpdate = ['ASSIGNED', 'IN_PROGRESS'].includes(job.status);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await taskApi.updateProgress(job.id, { progressPct: Number(progress), notes });
      Alert.alert('Berhasil', 'Progress diperbarui');
      setModalVisible(false);
      onUpdate();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Gagal memperbarui');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobCode}>{job.jobCode}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.jobTitle}>{job.title}</Text>
        {job.project && <Text style={styles.jobSub}>{job.project.code} · {job.project.name}</Text>}

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPct}>{job.progressPct ?? 0}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(job.progressPct ?? 0, 100)}%` as any }]} />
        </View>

        {canUpdate && (
          <TouchableOpacity style={styles.updateBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateBtnText}>Update Progress</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Progress</Text>
            <Text style={styles.modalSub}>{job.title}</Text>
            <Text style={styles.label}>Progress % (0–100)</Text>
            <TextInput
              style={styles.input}
              value={progress}
              onChangeText={setProgress}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.label}>Catatan</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Deskripsi pekerjaan hari ini..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TasksScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await taskApi.myJobs(filter ? { status: filter } : {});
      setJobs(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, [filter]);

  const FILTERS = ['', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'];
  const FILTER_LABELS: Record<string, string> = { '': 'Semua', ASSIGNED: 'Assigned', IN_PROGRESS: 'Dikerjakan', SUBMITTED: 'Dikirim' };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks Saya</Text>
        <Text style={styles.subtitle}>{total} tugas</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{FILTER_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1e3a5f" />
        ) : jobs.length === 0 ? (
          <Text style={styles.emptyText}>Tidak ada tugas{filter ? ` dengan status "${FILTER_LABELS[filter]}"` : ''}</Text>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} onUpdate={loadJobs} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#93c5fd', marginTop: 2 },
  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 12 },
  filterChip: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipActive: { backgroundColor: '#1e3a5f' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 80 },
  jobCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobCode: { fontSize: 11, fontWeight: '700', color: '#94a3b8', fontFamily: 'monospace' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  jobSub: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 12, color: '#64748b' },
  progressPct: { fontSize: 12, fontWeight: '700', color: '#1e3a5f' },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 6, backgroundColor: '#1e3a5f', borderRadius: 3 },
  updateBtn: { backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  updateBtnText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 60 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 14, backgroundColor: '#f8fafc' },
  textarea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtn: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.6 },
});
