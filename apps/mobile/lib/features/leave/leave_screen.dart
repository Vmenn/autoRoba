import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  List<dynamic> _leaves = [];
  bool _loading = true;

  static const _typeLabels = {
    'ANNUAL': 'Cuti Tahunan', 'SICK': 'Cuti Sakit', 'EMERGENCY': 'Darurat',
    'UNPAID': 'Tidak Dibayar', 'MATERNITY': 'Melahirkan', 'PATERNITY': 'Ayah',
  };
  static const _statusColors = {
    'PENDING': kWarning, 'APPROVED': kSuccess, 'REJECTED': kDanger, 'CANCELLED': kMuted,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      final res = await dio.get('/leaves');
      if (mounted) setState(() => _leaves = res.data['items'] ?? []);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel(String id) async {
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      await dio.patch('/leaves/$id/cancel');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pengajuan dibatalkan'), backgroundColor: kSuccess));
      _load();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErr(e)), backgroundColor: kDanger));
    }
  }

  void _showForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LeaveForm(onSubmit: (dto) async {
        final auth = context.read<AuthStore>();
        final dio = buildDio(auth);
        await dio.post('/leaves', data: dto);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pengajuan cuti berhasil'), backgroundColor: kSuccess));
          _load();
        }
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : _leaves.isEmpty
                      ? const Center(child: Text('Belum ada pengajuan cuti', style: TextStyle(color: kMuted)))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _leaves.length,
                            itemBuilder: (_, i) {
                              final l = _leaves[i];
                              final status = l['status'] as String? ?? '';
                              final color = _statusColors[status] ?? kMuted;
                              final type = _typeLabels[l['leaveType']] ?? l['leaveType'] ?? '';
                              final start = DateFormat('dd MMM').format(DateTime.parse(l['startDate']));
                              final end = DateFormat('dd MMM yyyy').format(DateTime.parse(l['endDate']));

                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(child: Text(type, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                          child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text('$start — $end  (${l['totalDays']} hari)', style: const TextStyle(fontSize: 12, color: kMuted)),
                                    if (l['reason'] != null) Text(l['reason'], style: const TextStyle(fontSize: 12, color: Color(0xFF374151)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    if (status == 'PENDING') ...[
                                      const SizedBox(height: 12),
                                      SizedBox(
                                        width: double.infinity,
                                        child: OutlinedButton(
                                          style: OutlinedButton.styleFrom(side: const BorderSide(color: kDanger), foregroundColor: kDanger),
                                          onPressed: () => _cancel(l['id'] as String),
                                          child: const Text('Batalkan'),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kPrimary,
        onPressed: _showForm,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Ajukan Cuti', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
    );
  }

  Widget _buildHeader() => Container(
        color: kPrimary,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: const Align(
          alignment: Alignment.centerLeft,
          child: Text('Cuti', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
        ),
      );
}

class _LeaveForm extends StatefulWidget {
  final Future<void> Function(Map<String, dynamic>) onSubmit;
  const _LeaveForm({required this.onSubmit});

  @override
  State<_LeaveForm> createState() => _LeaveFormState();
}

class _LeaveFormState extends State<_LeaveForm> {
  String _type = 'ANNUAL';
  DateTime _start = DateTime.now();
  DateTime _end = DateTime.now();
  final _reasonCtrl = TextEditingController();
  bool _submitting = false;

  static const _types = ['ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'MATERNITY', 'PATERNITY'];
  static const _typeLabels = {
    'ANNUAL': 'Cuti Tahunan', 'SICK': 'Cuti Sakit', 'EMERGENCY': 'Darurat',
    'UNPAID': 'Tidak Dibayar', 'MATERNITY': 'Melahirkan', 'PATERNITY': 'Ayah',
  };
  final _dfmt = DateFormat('dd MMM yyyy');

  @override
  void dispose() { _reasonCtrl.dispose(); super.dispose(); }

  Future<void> _pick(bool isStart) async {
    final picked = await showDatePicker(
      context: context, initialDate: isStart ? _start : _end,
      firstDate: DateTime.now().subtract(const Duration(days: 7)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() { if (isStart) _start = picked; else _end = picked; });
  }

  Future<void> _submit() async {
    if (_reasonCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Alasan wajib diisi'), backgroundColor: kDanger));
      return;
    }
    if (_end.isBefore(_start)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tanggal selesai harus setelah mulai'), backgroundColor: kDanger));
      return;
    }
    setState(() => _submitting = true);
    try {
      await widget.onSubmit({
        'leaveType': _type,
        'startDate': _start.toIso8601String().split('T').first,
        'endDate': _end.toIso8601String().split('T').first,
        'reason': _reasonCtrl.text,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErr(e)), backgroundColor: kDanger));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7, maxChildSize: 0.92, minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 20),
        child: ListView(controller: ctrl, children: [
          Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: kMuted.withOpacity(0.4), borderRadius: BorderRadius.circular(2)))),
          const Text('Ajukan Cuti', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kPrimary)),
          const SizedBox(height: 20),
          DropdownButtonFormField<String>(
            value: _type,
            decoration: const InputDecoration(labelText: 'Jenis Cuti'),
            items: _types.map((t) => DropdownMenuItem(value: t, child: Text(_typeLabels[t]!))).toList(),
            onChanged: (v) => setState(() => _type = v!),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _DateField(label: 'Mulai', value: _dfmt.format(_start), onTap: () => _pick(true))),
            const SizedBox(width: 12),
            Expanded(child: _DateField(label: 'Selesai', value: _dfmt.format(_end), onTap: () => _pick(false))),
          ]),
          const SizedBox(height: 16),
          TextField(controller: _reasonCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Alasan')),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Kirim Pengajuan', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  final String label, value;
  final VoidCallback onTap;
  const _DateField({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: InputDecorator(
          decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_today, size: 18)),
          child: Text(value, style: const TextStyle(fontSize: 14)),
        ),
      );
}
