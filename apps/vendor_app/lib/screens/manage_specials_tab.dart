import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';

class ManageSpecialsTab extends ConsumerStatefulWidget {
  const ManageSpecialsTab({super.key});

  @override
  ConsumerState<ManageSpecialsTab> createState() => _ManageSpecialsTabState();
}

class _ManageSpecialsTabState extends ConsumerState<ManageSpecialsTab> {
  final _apiService = ApiService();
  final _specialController = TextEditingController();
  final _offersController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentSettings();
  }

  Future<void> _loadCurrentSettings() async {
    setState(() => _isLoading = true);
    final settings = await _apiService.getCompanySettings();
    _specialController.text = settings['todays_special'] ?? '';
    _offersController.text = settings['active_offers'] ?? '';
    setState(() => _isLoading = false);
  }

  Future<void> _updateSpecials() async {
    setState(() => _isLoading = true);
    try {
      await _apiService.updateCompanySettings({
        'todays_special': _specialController.text.trim(),
        'active_offers': _offersController.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Specials updated successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    if (_isLoading && _specialController.text.isEmpty) {
      return Center(child: CircularProgressIndicator(color: brandColor));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Dynamic Broadcast',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Update what employees see in their app today.',
            style: TextStyle(color: Colors.grey.shade600),
          ),
          const SizedBox(height: 32),
          
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            elevation: 0,
            borderOnForeground: true,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  TextField(
                    controller: _specialController,
                    cursorColor: brandColor,
                    decoration: InputDecoration(
                      labelText: "Today's Special",
                      labelStyle: TextStyle(color: brandColor),
                      hintText: "e.g. Paneer Butter Masala & Butter Naan",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: brandColor, width: 2),
                      ),
                      prefixIcon: Icon(Icons.restaurant, color: brandColor),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _offersController,
                    cursorColor: brandColor,
                    decoration: InputDecoration(
                      labelText: "Active Offers",
                      labelStyle: TextStyle(color: brandColor),
                      hintText: "e.g. Free Dessert with 1st redemption!",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: brandColor, width: 2),
                      ),
                      prefixIcon: Icon(Icons.local_offer, color: brandColor),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _updateSpecials,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(60),
                      backgroundColor: brandColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Update Live Feed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const InfoBanner(
            title: "Real-time sync",
            message: "Changes will be reflected in all Employee apps instantly after update.",
          ),
        ],
      ),
    );
  }
}

class InfoBanner extends StatelessWidget {
  final String title;
  final String message;
  const InfoBanner({super.key, required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.blue.shade700),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade900)),
                Text(message, style: TextStyle(color: Colors.blue.shade800, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
