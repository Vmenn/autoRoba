import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class DailyLogScreen extends StatefulWidget {
  const DailyLogScreen({super.key});

  @override
  State<DailyLogScreen> createState() => _DailyLogScreenState();
}

class _DailyLogScreenState extends State<DailyLogScreen> {
  List<dynamic> _logs = [];
  bool _loading = true;
  String? _selectedProject;
  List<dynamic> _projects = [];

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      final res = await dio.get('/projects');
      if (mounted) {
        setState(() {
          _projects = res.data['items'] ?? res.data ?? [];
          if (_projects.isNotEmpty) {
            _selectedProject = _projects.first['id'] as String;
          }
        });
        _loadLogs();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadLogs() async {
    if (_selectedProject == null) return;
    setState(() => _loading = true);
    final auth = context.read<AuthStore>();
    final dio = buildDio(auth);
    try {
      final res = await dio.get('/daily-logs', queryParameters: {'projectId': _selectedProject});
      if (mounted) setState(() => _logs = res.data['items'] ?? []);
    } catch (_) {
      if (mounted) setState(() => _logs = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showForm() {
    if (_selectedProject == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DailyLogForm(
        projectId: _selectedProject!,
        onSubmit: (dto) async {
          final auth = context.read<AuthStore>();
          final dio = buildDio(auth);
          await dio.post('/daily-logs', data: dto);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Daily log disimpan ✓'), backgroundColor: kSuccess),
            );
            _loadLogs();
          }
        },
      ),
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
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Daily Log', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 8),
                  if (_projects.isNotEmpty)
                    DropdownButtonFormField<String>(
                      value: _selectedProject,
                      dropdownColor: kPrimary,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      iconEnabledColor: Colors.white,
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
                        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white30)),
                      ),
                      items: _projects.map<DropdownMenuItem<String>>((p) => DropdownMenuItem(
                        value: p['id'] as String,
                        child: Text('${p['code']} — ${p['name']}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                      )).toList(),
                      onChanged: (v) {
                        setState(() => _selectedProject = v);
                        _loadLogs();
                      },
                    ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : _logs.isEmpty
                      ? const Center(child: Text('Belum ada daily log', style: TextStyle(color: kMuted)))
                      : RefreshIndicator(
                          onRefresh: _loadLogs,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _logs.length,
                            itemBuilder: (_, i) => _LogCard(_logs[i]),
                          ),
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: _selectedProject == null
          ? null
          : FloatingActionButton.extended(
              backgroundColor: kPrimary,
              onPressed: _showForm,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('Tambah Log', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
    );
  }
}

class _LogCard extends StatelessWidget {
  final Map<String, dynamic> log;
  const _LogCard(this.log);

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('EEEE, dd MMM yyyy', 'id').format(DateTime.parse(log['logDate']));
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(date, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kPrimary)),
              ),
              _WeatherChip(log['weather'] as String?),
            ],
          ),
          const Divider(height: 16),
          _InfoRow(icon: Icons.people, label: 'Tenaga Kerja', value: '${log['manpowerCount'] ?? 0} orang'),
          if (log['workSummary'] != null)
            _InfoRow(icon: Icons.work_outline, label: 'Ringkasan', value: log['workSummary'] as String),
          if (log['issues'] != null)
            _InfoRow(icon: Icons.warning_amber, label: 'Permasalahan', value: log['issues'] as String, valueColor: kWarning),
        ],
      ),
    );
  }
}

class _WeatherChip extends StatelessWidget {
  final String? weather;
  const _WeatherChip(this.weather);

  @override
  Widget build(BuildContext context) {
    if (weather == null) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2FE),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('☁ $weather', style: const TextStyle(fontSize: 11, color: Color(0xFF0369A1))),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color? valueColor;
  const _InfoRow({required this.icon, required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 14, color: kMuted),
            const SizedBox(width: 6),
            Text('$label: ', style: const TextStyle(fontSize: 12, color: kMuted)),
            Expanded(
              child: Text(value,
                style: TextStyle(fontSize: 12, color: valueColor ?? const Color(0xFF374151)),
                maxLines: 3, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      );
}

// ─── Form ────────────────────────────────────────────────────────────────────

class _DailyLogForm extends StatefulWidget {
  final String projectId;
  final Future<void> Function(Map<String, dynamic>) onSubmit;
  const _DailyLogForm({required this.projectId, required this.onSubmit});

  @override
  State<_DailyLogForm> createState() => _DailyLogFormState();
}

class _DailyLogFormState extends State<_DailyLogForm> {
  DateTime _date = DateTime.now();
  String _weather = 'Cerah';
  final _manpowerCtrl = TextEditingController(text: '0');
  final _summaryCtrl = TextEditingController();
  final _issuesCtrl = TextEditingController();
  bool _submitting = false;

  static const _weathers = ['Cerah', 'Cerah berawan', 'Mendung', 'Hujan ringan', 'Hujan lebat'];
  final _dfmt = DateFormat('dd MMM yyyy');

  @override
  void dispose() {
    _manpowerCtrl.dispose();
    _summaryCtrl.dispose();
    _issuesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await widget.onSubmit({
        'projectId': widget.projectId,
        'logDate': _date.toIso8601String().split('T').first,
        'weather': _weather,
        'manpowerCount': int.tryParse(_manpowerCtrl.text) ?? 0,
        'workSummary': _summaryCtrl.text.isEmpty ? null : _summaryCtrl.text,
        'issues': _issuesCtrl.text.isEmpty ? null : _issuesCtrl.text,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(apiErr(e)), backgroundColor: kDanger));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75, maxChildSize: 0.95, minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 20),
        child: ListView(controller: ctrl, children: [
          Center(
            child: Container(
              width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: kMuted.withOpacity(0.4), borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const Text('Tambah Daily Log', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kPrimary)),
          const SizedBox(height: 20),

          // Date picker
          GestureDetector(
            onTap: () async {
              final d = await showDatePicker(
                context: context, initialDate: _date,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now(),
              );
              if (d != null) setState(() => _date = d);
            },
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Tanggal Log', suffixIcon: Icon(Icons.calendar_today, size: 18)),
              child: Text(_dfmt.format(_date)),
            ),
          ),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _weather,
            decoration: const InputDecoration(labelText: 'Cuaca', prefixIcon: Icon(Icons.wb_sunny_outlined)),
            items: _weathers.map((w) => DropdownMenuItem(value: w, child: Text(w))).toList(),
            onChanged: (v) => setState(() => _weather = v!),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: _manpowerCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Jumlah Tenaga Kerja', prefixIcon: Icon(Icons.people_outline)),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: _summaryCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Ringkasan Pekerjaan', prefixIcon: Icon(Icons.work_outline)),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: _issuesCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Permasalahan (opsional)', prefixIcon: Icon(Icons.warning_amber_outlined)),
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Simpan Daily Log', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }
}
