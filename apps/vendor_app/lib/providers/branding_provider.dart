import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final brandingProvider = NotifierProvider<BrandingNotifier, Map<String, dynamic>>(() {
  return BrandingNotifier();
});

class BrandingNotifier extends Notifier<Map<String, dynamic>> {
  @override
  Map<String, dynamic> build() {
    Future.microtask(() => fetchBranding());
    
    return {
      'vendor_name': 'AutoRabit Cafeteria',
      'vendor_brand_color': '#EA580C',
      'vendor_logo_url': '',
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
