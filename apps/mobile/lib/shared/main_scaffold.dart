import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../features/home/home_screen.dart';
import '../features/attendance/attendance_screen.dart';
import '../features/tasks/tasks_screen.dart';
import '../features/leave/leave_screen.dart';
import '../features/reimbursement/reimbursement_screen.dart';
import '../features/approval/approval_screen.dart';

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _idx = 0;

  final _screens = const [
    HomeScreen(),
    AttendanceScreen(),
    TasksScreen(),
    LeaveScreen(),
    ReimbursementScreen(),
    ApprovalScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _idx,
        onTap: (i) => setState(() => _idx = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: kPrimary,
        unselectedItemColor: kMuted,
        selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Beranda'),
          BottomNavigationBarItem(icon: Icon(Icons.location_on_outlined), activeIcon: Icon(Icons.location_on), label: 'Absensi'),
          BottomNavigationBarItem(icon: Icon(Icons.check_box_outlined), activeIcon: Icon(Icons.check_box), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.beach_access_outlined), activeIcon: Icon(Icons.beach_access), label: 'Cuti'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Reimburse'),
          BottomNavigationBarItem(icon: Icon(Icons.rate_review_outlined), activeIcon: Icon(Icons.rate_review), label: 'Approval'),
        ],
      ),
    );
  }
}
