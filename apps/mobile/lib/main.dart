import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/auth_store.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final auth = AuthStore();
  await auth.init();
  runApp(
    ChangeNotifierProvider.value(value: auth, child: const AutoRobaApp()),
  );
}
