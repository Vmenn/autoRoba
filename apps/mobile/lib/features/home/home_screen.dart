import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth_store.dart';
import '../../core/constants.dart';
import '../daily_log/daily_log_screen.dart';

class HomeScreen extends StatelessWidget {
  final void Function(int tabIndex)? onSwitchTab;
  const HomeScreen({super.key, this.onSwitchTab});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthStore>();
    final user = auth.user;
    final name = user != null ? '${user['firstName']} ${user['lastName']}' : '—';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Header(name: name),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Menu Utama', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kPrimary)),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      children: [
                        _MenuItem(icon: Icons.location_on, label: 'Absensi', color: const Color(0xFF0EA5E9),
                            onTap: () => onSwitchTab?.call(1)),
                        _MenuItem(icon: Icons.check_box, label: 'Tasks', color: const Color(0xFF8B5CF6),
                            onTap: () => onSwitchTab?.call(2)),
                        _MenuItem(icon: Icons.beach_access, label: 'Cuti', color: const Color(0xFF10B981),
                            onTap: () => onSwitchTab?.call(3)),
                        _MenuItem(icon: Icons.receipt_long, label: 'Reimburse', color: const Color(0xFFF59E0B),
                            onTap: () => onSwitchTab?.call(4)),
                        _MenuItem(icon: Icons.rate_review, label: 'Approval', color: kDanger,
                            onTap: () => onSwitchTab?.call(5)),
                        _MenuItem(icon: Icons.calendar_today, label: 'Daily Log', color: kPrimary,
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DailyLogScreen()))),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String name;
  const _Header({required this.name});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthStore>();
    return Container(
      color: kPrimary,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Halo, $name 👋',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 4),
                Text(_fmtDate(DateTime.now()),
                    style: const TextStyle(fontSize: 12, color: Color(0xFF93C5FD))),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: auth.logout,
            tooltip: 'Keluar',
          ),
        ],
      ),
    );
  }

  String _fmtDate(DateTime d) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${days[d.weekday % 7]}, ${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
  const _MenuItem({required this.icon, required this.label, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 8),
            Text(label,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          ],
        ),
      ),
    );
  }
}
