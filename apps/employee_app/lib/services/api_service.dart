import 'package:supabase_flutter/supabase_flutter.dart';

class ApiService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<Map<String, dynamic>?> createOrGetProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    final response = await _client.rpc('create_or_get_profile', params: {
      'p_user_id': user.id,
      'p_employee_number': user.userMetadata?['employee_number'] ?? '',
      'p_full_name': user.userMetadata?['full_name'] ?? '',
      'p_company_email': user.email ?? '',
    });
    
    if (response is List && response.isNotEmpty) {
      return response[0] as Map<String, dynamic>;
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> getMyRedemptions() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final response = await _client
        .from('meal_redemptions')
        .select()
        .eq('user_id', user.id)
        .order('redemption_date', ascending: false)
        .limit(10);
    
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> updateProfile(String fullName, String dept) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    await _client
        .from('profiles')
        .update({
          'full_name': fullName,
          'department': dept,
        })
        .match({'user_id': user.id});
  }

  Future<void> recordRedemption(String employeeNumber) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final today = DateTime.now().toIso8601String().split('T')[0];
    
    await _client.from('meal_redemptions').insert({
      'user_id': user.id,
      'employee_number': employeeNumber,
      'redemption_date': today,
    });
  }

  Future<bool> hasAlreadyRedeemedToday() async {
    final user = _client.auth.currentUser;
    if (user == null) return false;

    final today = DateTime.now().toIso8601String().split('T')[0];
    
    final response = await _client
        .from('meal_redemptions')
        .select()
        .eq('user_id', user.id)
        .eq('redemption_date', today)
        .limit(1);
    
    return (response as List).isNotEmpty;
  }

  Future<Map<String, dynamic>> getCompanySettings() async {
    try {
      final response = await _client
          .from('company_settings')
          .select()
          .limit(1)
          .maybeSingle();
      
      return response ?? {
        'company_name': 'Lunch buddy',
        'coupon_value': 160.0,
        'office_latitude': 17.433749,
        'office_longitude': 78.375504,
        'office_radius_meters': 200.0,
      };
    } catch (e) {
      return {
        'company_name': 'Lunch buddy',
        'coupon_value': 160.0,
        'office_latitude': 17.433749,
        'office_longitude': 78.375504,
        'office_radius_meters': 200.0,
      };
    }
  }
}
