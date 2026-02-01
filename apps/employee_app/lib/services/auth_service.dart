import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
    required String employeeNumber,
    required String role, // 'hr_admin' or 'employee'
  }) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'employee_number': employeeNumber,
        'company_email': email,
        'department': role == 'hr_admin' ? 'HR' : 'Employee',
      },
    );

    // If signup successful, also insert into admin_roles if HR
    if (response.user != null && role == 'hr_admin') {
      try {
        await _client.from('admin_roles').insert({
          'user_id': response.user!.id,
          'role': 'hr_admin',
        });
      } catch (e) {
        print('Role assignment failed: $e');
      }
    }

    return response;
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  User? get currentUser => _client.auth.currentUser;
}
