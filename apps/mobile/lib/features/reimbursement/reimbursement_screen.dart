import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class ReimbursementScreen extends StatefulWidget {
  const ReimbursementScreen({super.key});

  @override
  State<ReimbursementScreen> createState() => _ReimbursementScreenState();
}

class _ReimbursementScreenState extends State<ReimbursementScreen> {
  List<dynamic> _items = [];
  bool _loading = true;

  static const _catLabels = {
    'TRANSPORT': '🚗 Transport', 'ACCOMMODATION': '🏨 Penginapan', 'MEAL': '🍽 Makan',
    'OFFICE_SUPPLY': '📎 ATK', 'COMMUNICATION': '📱 Komunikasi', 'OTHER': '📦 Lainnya',
  };
  static const _statusColors = {
    'SUBMITTED': Color(0xFF2563EB), 'APPROVED': kSuccess, 'REJECTED': kDanger, 'PAID': Color(0xFF7C3AED),
  };

  final _idr = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

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
      final res = await dio.get('/reimbursements');
      if (mounted) setState(() => _items = res.data['items'] ?? []);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ReimbForm(onSubmit: (dto) async {
        final auth = context.read<AuthStore>();
        final dio = buildDio(auth);
        await dio.post('/reimbursements', data: dto);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reimburse diajukan'), backgroundColor: kSuccess));
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
            Container(
              color: kPrimary,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: const Align(
                alignment: Alignment.centerLeft,
                child: Text('Reimbursement', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : _items.isEmpty
                      ? const Center(child: Text('Belum ada pengajuan', style: TextStyle(color: kMuted)))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            itemBuilder: (_, i) {
                              final r = _items[i];
                              final status = r['status'] as String? ?? '';
                              final color = _statusColors[status] ?? kMuted;
                              final cat = _catLabels[r['category']] ?? r['category'] ?? '';
                              final date = DateFormat('dd MMM yyyy').format(DateTime.parse(r['expenseDate']));

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
                                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Text(cat, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                                          const SizedBox(height: 2),
                                          Text(date, style: const TextStyle(fontSize: 11, color: kMuted)),
                                        ])),
                                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                          Text(_idr.format(num.parse(r['amount'].toString())),
                                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: kPrimary)),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                            child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
                                          ),
                                        ]),
                                      ],
                                    ),
                                    if (r['description'] != null) ...[
                                      const SizedBox(height: 6),
                                      Text(r['description'], style: const TextStyle(fontSize: 12, color: Color(0xFF374151)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    ],
                                    if (r['claimNo'] != null) ...[
                                      const SizedBox(height: 4),
                                      Text(r['claimNo'], style: const TextStyle(fontSize: 10, color: kMuted, fontFamily: 'monospace')),
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
        label: const Text('Ajukan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

class _ReimbForm extends StatefulWidget {
  final Future<void> Function(Map<String, dynamic>) onSubmit;
  const _ReimbForm({required this.onSubmit});

  @override
  State<_ReimbForm> createState() => _ReimbFormState();
}

class _ReimbFormState extends State<_ReimbForm> {
  String _cat = 'TRANSPORT';
  DateTime _date = DateTime.now();
  final _amtCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _submitting = false;
  XFile? _receipt;

  static const _cats = ['TRANSPORT', 'ACCOMMODATION', 'MEAL', 'OFFICE_SUPPLY', 'COMMUNICATION', 'OTHER'];
  static const _catLabels = {
    'TRANSPORT': '🚗 Transport', 'ACCOMMODATION': '🏨 Penginapan', 'MEAL': '🍽 Makan',
    'OFFICE_SUPPLY': '📎 ATK', 'COMMUNICATION': '📱 Komunikasi', 'OTHER': '📦 Lainnya',
  };
  final _dfmt = DateFormat('dd MMM yyyy');

  @override
  void dispose() { _amtCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }

  Future<void> _pickImage(ImageSource src) async {
    final img = await ImagePicker().pickImage(source: src, imageQuality: 70, maxWidth: 1200);
    if (img != null) setState(() => _receipt = img);
  }

  Future<void> _submit() async {
    if (_amtCtrl.text.isEmpty || _descCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Jumlah dan keterangan wajib diisi'), backgroundColor: kDanger));
      return;
    }
    setState(() => _submitting = true);
    try {
      await widget.onSubmit({
        'category': _cat,
        'amount': double.parse(_amtCtrl.text.replaceAll('.', '').replaceAll(',', '.')),
        'description': _descCtrl.text,
        'expenseDate': _date.toIso8601String().split('T').first,
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
      initialChildSize: 0.75, maxChildSize: 0.95, minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 20),
        child: ListView(controller: ctrl, children: [
          Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: kMuted.withOpacity(0.4), borderRadius: BorderRadius.circular(2)))),
          const Text('Ajukan Reimburse', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kPrimary)),
          const SizedBox(height: 20),
          DropdownButtonFormField<String>(
            value: _cat,
            decoration: const InputDecoration(labelText: 'Kategori'),
            items: _cats.map((c) => DropdownMenuItem(value: c, child: Text(_catLabels[c]!))).toList(),
            onChanged: (v) => setState(() => _cat = v!),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () async {
              final d = await showDatePicker(context: context, initialDate: _date,
                  firstDate: DateTime.now().subtract(const Duration(days: 90)), lastDate: DateTime.now());
              if (d != null) setState(() => _date = d);
            },
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Tanggal Pengeluaran', suffixIcon: Icon(Icons.calendar_today, size: 18)),
              child: Text(_dfmt.format(_date)),
            ),
          ),
          const SizedBox(height: 16),
          TextField(controller: _amtCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Jumlah (Rp)', prefixText: 'Rp ')),
          const SizedBox(height: 16),
          TextField(controller: _descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Keterangan')),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: OutlinedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('Kamera'),
              onPressed: () => _pickImage(ImageSource.camera),
            )),
            const SizedBox(width: 12),
            Expanded(child: OutlinedButton.icon(
              icon: const Icon(Icons.photo_library),
              label: const Text('Galeri'),
              onPressed: () => _pickImage(ImageSource.gallery),
            )),
          ]),
          if (_receipt != null) ...[
            const SizedBox(height: 8),
            Text('✓ ${_receipt!.name}', style: const TextStyle(fontSize: 12, color: kSuccess)),
          ],
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
