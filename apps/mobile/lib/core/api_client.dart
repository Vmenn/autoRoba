import 'package:dio/dio.dart';
import 'auth_store.dart';
import 'constants.dart';

Dio buildDio(AuthStore auth) {
  final dio = Dio(BaseOptions(
    baseUrl: '$kApiBase/v1',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      if (auth.token != null) {
        options.headers['Authorization'] = 'Bearer ${auth.token}';
      }
      handler.next(options);
    },
    onError: (e, handler) {
      if (e.response?.statusCode == 401) {
        auth.logout();
      }
      handler.next(e);
    },
  ));

  return dio;
}

String apiErr(dynamic e) {
  if (e is DioException) {
    final msg = e.response?.data?['message'];
    if (msg is String) return msg;
    if (msg is List) return msg.first.toString();
  }
  return 'Terjadi kesalahan';
}
