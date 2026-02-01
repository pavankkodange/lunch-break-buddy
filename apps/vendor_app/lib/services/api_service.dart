import 'package:supabase_flutter/supabase_flutter.dart';

class ApiService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<Map<String, dynamic>>> getRedemptions({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final response = await _client
        .from('meal_redemptions')
        .select('id, redemption_date, redemption_time, user_id, employee_number, profiles(full_name, department, employee_number)')
        .gte('redemption_date', startDate.toIso8601String().split('T')[0])
        .lte('redemption_date', endDate.toIso8601String().split('T')[0])
        .order('redemption_time', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
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
        'gst_percentage': 18.0,
      };
    } catch (e) {
      return {
        'company_name': 'Lunch buddy',
        'coupon_value': 160.0,
        'gst_percentage': 18.0,
      };
    }
  }

  Future<void> updateCompanySettings(Map<String, dynamic> settings) async {
    await _client
        .from('company_settings')
        .update(settings)
        .match({'id': 1}); // Assuming single row with ID 1
  }
}
