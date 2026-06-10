import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import '../../core/auth_store.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  Map<String, dynamic>? _today;
  List<dynamic> _history = [];
  bool _loading = true;
  bool _acting = false;

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
      final res = await Future.wait([
        dio.get('/attendance/today').catchError((_) => null),
        dio.get('/attendance').catchError((_) => null),
      ]);
      if (mounted) {
        setState(() {
          _today = res[0]?.data;
          _history = res[1]?.data?['items'] ?? [];
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<Position?> _getLocation() async {
    bool svc = await Geolocator.isLocationServiceEnabled();
    if (!svc) {
      _snack('Aktifkan layanan lokasi', isError: true);
      return null;
    }
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever || perm == LocationPermission.denied) {
      _snack('Izin lokasi diperlukan', isError: true);
      return null;
    }
    return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  Future<void> _checkIn() async {
    setState(() => _acting = true);
    try {
      final pos = await _getLocation();
      if (pos == null) return;
      final auth = context.read<AuthStore>();
      final dio = buildDio(auth);
      await dio.post('/attendance/check-in', data: {'lat': pos.latitude, 'lng': pos.longitude});
      _snack('Check-in berhasil 📍');
      await _load();
    } catch (e) {
      _snack(apiErr(e), isError: true);
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _checkOut() async {
    setState(() => _acting = true);
    try {
      final pos = await _getLocation();
      if (pos == null) return;
      final auth = context.read<AuthStore>();
      final dio = buildDio(auth);
      await dio.post('/attendance/check-out', data: {'lat': pos.latitude, 'lng': pos.longitude});
      _snack('Check-out berhasil ✓');
      await _load();
    } catch (e) {
      _snack(apiErr(e), isError: true);
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  void _snack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: isError ? kDanger : kSuccess),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool checkedIn = _today?['checkInTime'] != null;
    final bool checkedOut = _today?['checkOutTime'] != null;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kPrimary))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          _TodayCard(today: _today, checkedIn: checkedIn, checkedOut: checkedOut),
                          const SizedBox(height: 16),
                          if (!checkedOut)
                            _ActionButton(
                              label: checkedIn ? 'Check-Out' : 'Check-In',
                              icon: checkedIn ? Icons.logout : Icons.login,
                              color: checkedIn ? kDanger : kSuccess,
                              loading: _acting,
                              onTap: checkedIn ? _checkOut : _checkIn,
                            ),
                          const SizedBox(height: 20),
                          const Text('Riwayat Absensi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kPrimary)),
                          const SizedBox(height: 8),
                          ..._history.map((a) => _HistoryTile(a)),
                        ],
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
          child: Text('Absensi', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
        ),
      );
}

class _TodayCard extends StatelessWidget {
  final Map<String, dynamic>? today;
  final bool checkedIn;
  final bool checkedOut;

  const _TodayCard({required this.today, required this.checkedIn, required this.checkedOut});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('HH:mm');
    final inTime = today?['checkInTime'] != null ? fmt.format(DateTime.parse(today!['checkInTime']).toLocal()) : '—';
    final outTime = today?['checkOutTime'] != null ? fmt.format(DateTime.parse(today!['checkOutTime']).toLocal()) : '—';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)]),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _TimeChip(label: 'Check-In', time: inTime, color: kSuccess),
              const Icon(Icons.arrow_forward, color: kMuted),
              _TimeChip(label: 'Check-Out', time: outTime, color: kDanger),
            ],
          ),
          if (today != null) ...[
            const Divider(height: 24),
            Text(
              checkedOut ? '✓ Absensi Selesai' : checkedIn ? '● Sedang Bekerja' : '○ Belum Absen',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: checkedOut ? kSuccess : checkedIn ? kWarning : kMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  final String label;
  final String time;
  final Color color;
  const _TimeChip({required this.label, required this.time, required this.color});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: kMuted)),
          const SizedBox(height: 4),
          Text(time, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
        ],
      );
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool loading;
  final VoidCallback onTap;

  const _ActionButton({required this.label, required this.icon, required this.color, required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(backgroundColor: color, padding: const EdgeInsets.symmetric(vertical: 16)),
          icon: loading ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Icon(icon),
          label: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          onPressed: loading ? null : onTap,
        ),
      );
}

class _HistoryTile extends StatelessWidget {
  final Map<String, dynamic> a;
  const _HistoryTile(this.a);

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('dd MMM').format(DateTime.parse(a['date']));
    final status = a['status'] as String? ?? 'PRESENT';
    const colors = {'PRESENT': kSuccess, 'LATE': kWarning, 'ABSENT': kDanger, 'HALF_DAY': Color(0xFF8B5CF6)};
    final color = colors[status] ?? kMuted;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Text(date, style: const TextStyle(fontWeight: FontWeight.w600, color: kPrimary)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
            child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          ),
        ],
      ),
    );
  }
}
