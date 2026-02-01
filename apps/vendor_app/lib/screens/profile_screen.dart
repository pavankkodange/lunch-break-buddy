import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _apiService = ApiService();
  final _client = Supabase.instance.client;
  Map<String, dynamic> _settings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _settings = await _apiService.getCompanySettings();
    } catch (e) {
      debugPrint('Error loading settings: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final branding = ref.watch(brandingProvider);
    final user = _client.auth.currentUser;
    final companyName = branding['vendor_name'] ?? _settings['company_name'] ?? 'Lunch buddy';
    final email = user?.email ?? 'vendor@example.com';
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.2),
                    spreadRadius: 5,
                    blurRadius: 15,
                  ),
                ],
              ),
              child: branding['vendor_logo_url'] != null && branding['vendor_logo_url'].isNotEmpty
                  ? Image.network(branding['vendor_logo_url'], fit: BoxFit.cover)
                  : Image.asset('assets/logo.png', fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            companyName,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),
          Text(
            'Authorized Cafeteria Vendor',
            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 32),

          _buildInfoCard('Vendor ID', 'autorabit-cafeteria', Icons.badge_outlined),
          const SizedBox(height: 16),
          _buildInfoCard('Contact Email', email, Icons.email_outlined),
          const SizedBox(height: 16),
          _buildInfoCard('Status', 'Active', Icons.verified_user_outlined),
          
          const SizedBox(height: 40),
          
          ElevatedButton.icon(
            onPressed: () => _client.auth.signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Sign Out'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade50,
              foregroundColor: Colors.red.shade700,
              minimumSize: const Size.fromHeight(56),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              side: BorderSide(color: Colors.red.shade100),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: Colors.orange.shade700, size: 24),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
