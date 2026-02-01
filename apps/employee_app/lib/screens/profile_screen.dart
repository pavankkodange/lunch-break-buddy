import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/branding_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _apiService = ApiService();
  final _authService = AuthService();
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  List<Map<String, dynamic>> _history = [];

  bool _isEditing = false;
  final _nameController = TextEditingController();
  final _deptController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      _profile = await _apiService.createOrGetProfile();
      _history = await _apiService.getMyRedemptions();
      if (_profile != null) {
        _nameController.text = _profile!['full_name'] ?? '';
        _deptController.text = _profile!['department'] ?? '';
      }
    } catch (e) {
      debugPrint('Error loading profile: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);
    try {
      await _apiService.updateProfile(_nameController.text, _deptController.text);
      await _loadProfile();
      setState(() => _isEditing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Update failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final branding = ref.watch(brandingProvider);
    final String companyName = branding['company_name'] ?? 'AutoRabit';
    final Color primaryColor = Color(int.parse(branding['autorabit_primary_color']?.replaceAll('#', '0xFF') ?? '0xFF1E40AF'));

    final String fullName = _profile?['full_name'] ?? 'Employee';
    final String email = _profile?['company_email'] ?? 'No email';
    final String empId = _profile?['employee_number'] ?? 'N/A';
    final String dept = _profile?['department'] ?? 'N/A';
    final int totalMeals = _history.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: primaryColor.withOpacity(0.1),
            child: ClipOval(
                child: branding['autorabit_logo_url'] != null && branding['autorabit_logo_url'].isNotEmpty
                    ? Image.network(branding['autorabit_logo_url'], fit: BoxFit.cover, height: 100, width: 100)
                    : Image.asset('assets/logo.png', fit: BoxFit.cover)),
          ),
          const SizedBox(height: 24),
          if (_isEditing) ...[
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Full Name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _deptController,
              decoration: InputDecoration(
                labelText: 'Department',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.business),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _isEditing = false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveProfile,
                    style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: Colors.white),
                    child: const Text('Save Changes'),
                  ),
                ),
              ],
            ),
          ] else ...[
            Text(
              fullName,
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            Text(
              email,
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () => setState(() => _isEditing = true),
              icon: Icon(Icons.edit, size: 16, color: primaryColor),
              label: Text('Edit Profile', style: TextStyle(color: primaryColor)),
            ),
          ],
          const SizedBox(height: 32),

          // Stats row
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Employee ID', empId, Icons.badge_outlined, primaryColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard('Total Meals', '$totalMeals', Icons.restaurant, primaryColor),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildStatCard('Department', dept, Icons.business, primaryColor, isFullWidth: true),
          
          const SizedBox(height: 32),

          // CORPORATE IDENTITY SECTION
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.02),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: primaryColor.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Corporate & Support", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: primaryColor, borderRadius: BorderRadius.circular(20)),
                      child: const Text("OFFICIAL", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                const SizedBox(height: 20),
                _buildInfoTile("Entity Name", companyName, Icons.domain),
                _buildInfoTile("GST Number", branding['autorabit_gst_number'] ?? 'N/A', Icons.description_outlined),
                _buildInfoTile("Support Contact", branding['autorabit_contact_primary'] ?? 'N/A', Icons.phone_in_talk_outlined),
                _buildInfoTile("Support Hours", branding['autorabit_support_hours'] ?? '24/7 Priority', Icons.access_time),
                _buildInfoTile("Registered Address", branding['autorabit_official_address'] ?? 'N/A', Icons.location_on_outlined),
                const Divider(height: 32),
                Center(
                  child: Text(
                    branding['autorabit_website'] ?? 'www.autorabit.com',
                    style: TextStyle(color: primaryColor, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),
          
          // PREFERENCES SECTION
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Preferences", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                _buildPreferenceToggle("Vegetarian Preference", true, Icons.eco_outlined, primaryColor),
                _buildPreferenceToggle("Lunch Reminders", true, Icons.notifications_none_outlined, primaryColor),
                _buildPreferenceToggle("Dark Mode", false, Icons.dark_mode_outlined, primaryColor),
              ],
            ),
          ),

          const SizedBox(height: 40),
          
          // Logout Button
          ElevatedButton.icon(
            onPressed: () => _authService.signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Logout Session'),
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

  Widget _buildInfoTile(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey.shade400),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreferenceToggle(String title, bool value, IconData icon, Color activeColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: activeColor),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w500))),
          Switch.adaptive(
            value: value,
            activeColor: activeColor,
            onChanged: (v) {
              setState(() {}); // For demo interactivity
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, {bool isFullWidth = false}) {
    return Container(
      width: isFullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: isFullWidth ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
