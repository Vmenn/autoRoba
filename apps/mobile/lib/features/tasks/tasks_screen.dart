import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<dynamic> _jobs = [];
  bool _loading = true;
  String _filter = 'ALL';

  static const _statuses = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'CLOSED'];
  static const _statusColors = {
    'OPEN': Color(0xFF3B82F6),
    'ASSIGNED': Color(0xFF8B5CF6),
    'IN_PROGRESS': kWarning,
    'SUBMITTED': Color(0xFF0EA5E9),
    'VERIFIED': kSuccess,
    'CLOSED': kMuted,
    'REJECTED': kDanger,
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
      final q = _filter == 'ALL' ? '' : '?status=$_filter';
      final res = await dio.get('/jobs$q');
      if (mounted) setState(() => _jobs = res.data['items'] ?? []);
    } catch (_) {
      if (mounted) setState(() => _jobs = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateProgress(String id, int pct) async {
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      await dio.patch('/jobs/$id', data: {'progressPercent': pct});
      _load();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErr(e)), backgroundColor: kDanger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildFilterBar(),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : _jobs.isEmpty
                      ? const Center(child: Text('Tidak ada task', style: TextStyle(color: kMuted)))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _jobs.length,
                            itemBuilder: (_, i) => _JobCard(
                              job: _jobs[i],
                              statusColors: _statusColors,
                              onUpdateProgress: _updateProgress,
                            ),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() => Container(
        color: kPrimary,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: const Align(
          alignment: Alignment.centerLeft,
          child: Text('Tasks', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
        ),
      );

  Widget _buildFilterBar() => Container(
        height: 44,
        color: Colors.white,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          children: _statuses.map((s) {
            final active = _filter == s;
            return GestureDetector(
              onTap: () {
                setState(() => _filter = s);
                _load();
              },
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: active ? kPrimary : kBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                alignment: Alignment.center,
                child: Text(s, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: active ? Colors.white : kMuted)),
              ),
            );
          }).toList(),
        ),
      );
}

class _JobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  final Map<String, Color> statusColors;
  final void Function(String, int) onUpdateProgress;

  const _JobCard({required this.job, required this.statusColors, required this.onUpdateProgress});

  @override
  Widget build(BuildContext context) {
    final status = job['status'] as String? ?? '';
    final color = statusColors[status] ?? kMuted;
    final pct = job['progressPercent'] as int? ?? 0;
    final due = job['dueDate'] != null ? DateFormat('dd MMM yyyy').format(DateTime.parse(job['dueDate'])) : null;

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
              Expanded(child: Text(job['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
              ),
            ],
          ),
          if (job['description'] != null) ...[
            const SizedBox(height: 6),
            Text(job['description'], style: const TextStyle(fontSize: 12, color: kMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    backgroundColor: kBg,
                    color: color,
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text('$pct%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: kPrimary)),
            ],
          ),
          if (due != null) ...[
            const SizedBox(height: 6),
            Text('Due: $due', style: const TextStyle(fontSize: 11, color: kMuted)),
          ],
          const SizedBox(height: 12),
          if (['OPEN', 'ASSIGNED', 'IN_PROGRESS'].contains(status))
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Update Progress'),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: kPrimary),
                  foregroundColor: kPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                onPressed: () => _showProgressDialog(context, job['id'] as String, pct),
              ),
            ),
        ],
      ),
    );
  }

  void _showProgressDialog(BuildContext context, String id, int current) {
    int val = current;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Update Progress'),
        content: StatefulBuilder(
          builder: (_, set) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$val%', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: kPrimary)),
              Slider(
                value: val.toDouble(),
                min: 0, max: 100, divisions: 20,
                activeColor: kPrimary,
                onChanged: (v) => set(() => val = v.round()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); onUpdateProgress(id, val); },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }
}
