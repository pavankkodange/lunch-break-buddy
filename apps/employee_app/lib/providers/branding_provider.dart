import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final brandingProvider = NotifierProvider<BrandingNotifier, Map<String, dynamic>>(() {
  return BrandingNotifier();
});

class BrandingNotifier extends Notifier<Map<String, dynamic>> {
  @override
  Map<String, dynamic> build() {
    // We can't call async methods directly in build, but we can trigger it
    Future.microtask(() => fetchBranding());
    
    return {
      'company_name': 'AutoRabit',
      'autorabit_primary_color': '#1E40AF',
      'autorabit_logo_url': '',
      'autorabit_favicon_url': '',
      'autorabit_website': '',
      'autorabit_gst_number': '',
      'autorabit_contact_primary': '',
      'autorabit_contact_secondary': '',
      'autorabit_official_address': '',
      'autorabit_support_hours': '',
      'email': '',
    };
  }

  final ApiService _apiService = ApiService();

  Future<void> fetchBranding() async {
    try {
      final settings = await _apiService.getCompanySettings();
      state = settings;
    } catch (e) {
      print('Error fetching branding: $e');
    }
  }
}
