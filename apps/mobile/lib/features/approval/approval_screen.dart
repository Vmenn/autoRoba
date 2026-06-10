import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class ApprovalScreen extends StatefulWidget {
  const ApprovalScreen({super.key});

  @override
  State<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends State<ApprovalScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<dynamic> _leaves = [];
  List<dynamic> _reimbs = [];
  bool _loading = true;
  String? _acting;

  static const _leaveTypeLabels = {
    'ANNUAL': 'Cuti Tahunan', 'SICK': 'Cuti Sakit', 'EMERGENCY': 'Darurat',
    'UNPAID': 'Tidak Dibayar', 'MATERNITY': 'Melahirkan', 'PATERNITY': 'Ayah',
  };
  static const _catLabels = {
    'TRANSPORT': '🚗 Transport', 'ACCOMMODATION': '🏨 Penginapan', 'MEAL': '🍽 Makan',
    'OFFICE_SUPPLY': '📎 ATK', 'COMMUNICATION': '📱 Komunikasi', 'OTHER': '📦 Lainnya',
  };

  final _idr = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      final results = await Future.wait([
        dio.get('/leaves/pending').catchError((_) => null),
        dio.get('/reimbursements?status=SUBMITTED').catchError((_) => null),
      ]);
      if (mounted) {
        setState(() {
          _leaves = results[0]?.data?['items'] ?? [];
          _reimbs = results[1]?.data?['items'] ?? [];
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reviewLeave(String id, String action) async {
    setState(() => _acting = id);
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      await dio.patch('/leaves/$id/review', data: {'action': action});
      _snack(action == 'APPROVED' ? 'Cuti disetujui ✓' : 'Cuti ditolak');
      _load();
    } catch (e) {
      _snack(apiErr(e), isError: true);
    } finally {
      if (mounted) setState(() => _acting = null);
    }
  }

  Future<void> _reviewReimb(String id, String action) async {
    setState(() => _acting = id);
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      await dio.patch('/reimbursements/$id/review', data: {'action': action});
      _snack(action == 'APPROVED' ? 'Reimburse disetujui ✓' : 'Reimburse ditolak');
      _load();
    } catch (e) {
      _snack(apiErr(e), isError: true);
    } finally {
      if (mounted) setState(() => _acting = null);
    }
  }

  void _snack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: isError ? kDanger : kSuccess),
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
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Approval', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                  Text(
                    '${_leaves.length} cuti · ${_reimbs.length} reimburse menunggu',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF93C5FD)),
                  ),
                  const SizedBox(height: 8),
                  TabBar(
                    controller: _tabs,
                    indicatorColor: Colors.white,
                    labelColor: Colors.white,
                    unselectedLabelColor: const Color(0xFF93C5FD),
                    tabs: [
                      Tab(text: '🏖 Cuti${_leaves.isNotEmpty ? " (${_leaves.length})" : ""}'),
                      Tab(text: '🧾 Reimburse${_reimbs.isNotEmpty ? " (${_reimbs.length})" : ""}'),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : TabBarView(
                      controller: _tabs,
                      children: [
                        _buildLeaveTab(),
                        _buildReimbTab(),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveTab() {
    if (_leaves.isEmpty) return const Center(child: Text('Tidak ada cuti yang menunggu', style: TextStyle(color: kMuted)));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _leaves.length,
        itemBuilder: (_, i) {
          final l = _leaves[i];
          final id = l['id'] as String;
          final name = '${l['user']?['firstName'] ?? ''} ${l['user']?['lastName'] ?? ''}'.trim();
          final type = _leaveTypeLabels[l['leaveType']] ?? l['leaveType'] ?? '';
          final start = DateFormat('dd MMM').format(DateTime.parse(l['startDate']));
          final end = DateFormat('dd MMM yyyy').format(DateTime.parse(l['endDate']));
          final busy = _acting == id;

          return _ApprovalCard(
            title: name.isEmpty ? 'Karyawan' : name,
            subtitle: type,
            detail: '$start — $end  (${l['totalDays']} hari)',
            note: l['reason'],
            busy: busy,
            onApprove: () => _reviewLeave(id, 'APPROVED'),
            onReject: () => _reviewLeave(id, 'REJECTED'),
          );
        },
      ),
    );
  }

  Widget _buildReimbTab() {
    if (_reimbs.isEmpty) return const Center(child: Text('Tidak ada reimburse yang menunggu', style: TextStyle(color: kMuted)));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _reimbs.length,
        itemBuilder: (_, i) {
          final r = _reimbs[i];
          final id = r['id'] as String;
          final name = '${r['user']?['firstName'] ?? ''} ${r['user']?['lastName'] ?? ''}'.trim();
          final cat = _catLabels[r['category']] ?? r['category'] ?? '';
          final amt = _idr.format(num.parse(r['amount'].toString()));
          final date = DateFormat('dd MMM yyyy').format(DateTime.parse(r['expenseDate']));
          final busy = _acting == id;

          return _ApprovalCard(
            title: name.isEmpty ? 'Karyawan' : name,
            subtitle: cat,
            detail: '$date · $amt',
            note: r['description'],
            badge: amt,
            busy: busy,
            onApprove: () => _reviewReimb(id, 'APPROVED'),
            onReject: () => _reviewReimb(id, 'REJECTED'),
          );
        },
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  final String title, subtitle, detail;
  final String? note, badge;
  final bool busy;
  final VoidCallback onApprove, onReject;

  const _ApprovalCard({
    required this.title, required this.subtitle, required this.detail,
    this.note, this.badge, required this.busy,
    required this.onApprove, required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
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
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: kMuted)),
              ])),
              if (badge != null)
                Text(badge!, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: kPrimary)),
            ],
          ),
          const SizedBox(height: 8),
          Text(detail, style: const TextStyle(fontSize: 12, color: Color(0xFF374151))),
          if (note != null) ...[
            const SizedBox(height: 4),
            Text(note!, style: const TextStyle(fontSize: 12, color: kMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton.icon(
              icon: busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: kDanger)) : const Icon(Icons.close, size: 16),
              label: const Text('Tolak'),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFFCA5A5)), foregroundColor: kDanger,
                  backgroundColor: const Color(0xFFFFF5F5), padding: const EdgeInsets.symmetric(vertical: 12)),
              onPressed: busy ? null : onReject,
            )),
            const SizedBox(width: 10),
            Expanded(child: ElevatedButton.icon(
              icon: busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.check, size: 16),
              label: const Text('Setujui'),
              style: ElevatedButton.styleFrom(backgroundColor: kSuccess, padding: const EdgeInsets.symmetric(vertical: 12)),
              onPressed: busy ? null : onApprove,
            )),
          ]),
        ],
      ),
    );
  }
}
