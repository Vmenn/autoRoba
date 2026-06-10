import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { reimbursementApi } from '@/lib/api';

const CATEGORIES = [
  { value: 'TRANSPORT', label: 'Transport', icon: '🚗' },
  { value: 'ACCOMMODATION', label: 'Penginapan', icon: '🏨' },
  { value: 'MEAL', label: 'Makan', icon: '🍽️' },
  { value: 'OFFICE_SUPPLY', label: 'ATK', icon: '📎' },
  { value: 'COMMUNICATION', label: 'Komunikasi', icon: '📱' },
  { value: 'OTHER', label: 'Lainnya', icon: '📦' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',        color: '#64748b', bg: '#f1f5f9' },
  SUBMITTED: { label: 'Diajukan',    color: '#2563eb', bg: '#dbeafe' },
  APPROVED: { label: 'Disetujui',    color: '#059669', bg: '#d1fae5' },
  REJECTED: { label: 'Ditolak',      color: '#dc2626', bg: '#fee2e2' },
  PAID:     { label: 'Dibayar',      color: '#7c3aed', bg: '#ede9fe' },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function ReimbursementScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'TRANSPORT', amount: '', description: '', expenseDate: '', receiptUri: '' as string });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reimbursementApi.list();
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Izin galeri diperlukan'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, receiptUri: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Izin kamera diperlukan'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, receiptUri: result.assets[0].uri }));
    }
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.expenseDate) {
      Alert.alert('Lengkapi semua field wajib');
      return;
    }
    setSaving(true);
    try {
      await reimbursementApi.create({
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        expenseDate: form.expenseDate,
        receiptUri: form.receiptUri || undefined,
      });
      Alert.alert('Berhasil', 'Pengajuan reimburse telah dikirim');
      setShowModal(false);
      setForm({ category: 'TRANSPORT', amount: '', description: '', expenseDate: '', receiptUri: '' });
      load();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message ?? 'Gagal mengajukan reimburse');
    } finally { setSaving(false); }
  };

  const totalAmount = items.filter((i) => i.status === 'APPROVED' || i.status === 'PAID')
    .reduce((s, i) => s + Number(i.amount ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reimburse</Text>
          <Text style={styles.subtitle}>{total} pengajuan · Disetujui: {formatCurrency(totalAmount)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Ajukan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1e3a5f" />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada pengajuan reimburse</Text>
        ) : (
          items.map((item: any) => {
            const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.DRAFT;
            const cat = CATEGORIES.find((c) => c.value === item.category);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemIcon}>{cat?.icon ?? '📦'}</Text>
                    <View>
                      <Text style={styles.itemCat}>{cat?.label ?? item.category}</Text>
                      <Text style={styles.itemDate}>{new Date(item.expenseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemAmount}>{formatCurrency(Number(item.amount))}</Text>
                    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Submit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end' }}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajukan Reimburse</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
                contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.value} onPress={() => setForm((f) => ({ ...f, category: c.value }))}
                    style={[styles.catChip, form.category === c.value && styles.catChipActive]}>
                    <Text>{c.icon}</Text>
                    <Text style={[styles.catChipText, form.category === c.value && styles.catChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Tanggal Pengeluaran (YYYY-MM-DD) *</Text>
              <TextInput style={styles.input} value={form.expenseDate}
                onChangeText={(t) => setForm((f) => ({ ...f, expenseDate: t }))}
                placeholder="2026-06-10" keyboardType="numeric" />

              <Text style={styles.label}>Jumlah (Rp) *</Text>
              <TextInput style={styles.input} value={form.amount}
                onChangeText={(t) => setForm((f) => ({ ...f, amount: t }))}
                placeholder="150000" keyboardType="numeric" />

              <Text style={styles.label}>Deskripsi / Keterangan *</Text>
              <TextInput style={[styles.input, styles.textarea]} value={form.description}
                onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
                placeholder="Bensin PP ke lokasi proyek..." multiline numberOfLines={3} />

              <Text style={styles.label}>Foto Struk (Opsional)</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Text style={styles.photoBtnIcon}>📷</Text>
                  <Text style={styles.photoBtnText}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickReceipt}>
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>Galeri</Text>
                </TouchableOpacity>
                {form.receiptUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: form.receiptUri }} style={styles.preview} />
                    <TouchableOpacity onPress={() => setForm((f) => ({ ...f, receiptUri: '' }))} style={styles.removePhoto}>
                      <Text style={{ color: '#dc2626', fontSize: 11 }}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

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
  subtitle: { fontSize: 11, color: '#93c5fd', marginTop: 2 },
  addBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 80 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 },
  itemCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemIcon: { fontSize: 28 },
  itemCat: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  itemDate: { fontSize: 12, color: '#94a3b8' },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmount: { fontSize: 15, fontWeight: '800', color: '#1e3a5f' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  itemDesc: { fontSize: 12, color: '#64748b' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  closeBtn: { fontSize: 20, color: '#94a3b8' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 14, backgroundColor: '#f8fafc' },
  textarea: { height: 80, textAlignVertical: 'top' },
  catChip: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  catChipActive: { backgroundColor: '#1e3a5f' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  catChipTextActive: { color: '#fff' },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  photoBtn: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  photoBtnIcon: { fontSize: 22 },
  photoBtnText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  previewContainer: { alignItems: 'center', gap: 4 },
  preview: { width: 60, height: 60, borderRadius: 8 },
  removePhoto: { },
  submitBtn: { backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
