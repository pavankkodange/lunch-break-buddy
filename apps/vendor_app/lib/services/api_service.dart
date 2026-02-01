import 'package:supabase_flutter/supabase_flutter.dart';

class ApiService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<Map<String, dynamic>>> getRedemptions({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      // 1. Fetch Redemptions (No Join)
      final redemptionsResponse = await _client
          .from('meal_redemptions')
          .select()
          .gte('redemption_date', startDate.toIso8601String().split('T')[0])
          .lte('redemption_date', endDate.toIso8601String().split('T')[0])
          .order('redemption_time', ascending: false);

      final redemptions = List<Map<String, dynamic>>.from(redemptionsResponse);

      if (redemptions.isEmpty) return [];

      // 2. Extract User IDs
      final userIds = redemptions.map((r) => r['user_id'] as String).toSet().toList();

      // 3. Fetch Profiles for these IDs
      final profilesResponse = await _client
          .from('profiles')
          .select('user_id, full_name, department, employee_number')
          .inFilter('user_id', userIds);

      final profiles = List<Map<String, dynamic>>.from(profilesResponse);
      final profileMap = {for (var p in profiles) p['user_id']: p};

      // 4. Merge Data
      return redemptions.map((r) {
        final profile = profileMap[r['user_id']];
        return {
          ...r,
          'profiles': {
            'full_name': profile?['full_name'] ?? 'Unknown',
            'department': profile?['department'] ?? 'N/A',
            'employee_number': profile?['employee_number'] ?? r['employee_number'],
          }
        };
      }).toList();
    } catch (e) {
      print('Error fetching redemptions: $e');
      return [];
    }
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
    // Check if settings exist, if not create default
    final current = await _client.from('company_settings').select('id').limit(1).maybeSingle();
    
    if (current == null) {
      await _client.from('company_settings').insert({
        'company_name': 'Lunch Buddy', 
        'coupon_value': 160,
        ...settings
      });
    } else {
      await _client
        .from('company_settings')
        .update(settings)
        .eq('id', current['id']);
    }
  }
  
  Future<String?> uploadMedia(dynamic file, String path) async {
    try {
      await _client.storage.from('broadcasts').upload(
        path,
        file,
        fileOptions: const FileOptions(upsert: true),
      );
      final url = _client.storage.from('broadcasts').getPublicUrl(path);
      return url;
    } catch (e) {
      print('Upload Error: $e');
      return null;
    }
  }
}
