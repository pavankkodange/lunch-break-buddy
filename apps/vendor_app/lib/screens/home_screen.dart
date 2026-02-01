import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'dart:convert';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';
import 'manage_specials_tab.dart';
import 'profile_screen.dart';
import 'reports_screen.dart';

class VendorHomeScreen extends ConsumerStatefulWidget {
  const VendorHomeScreen({super.key});

  @override
  ConsumerState<VendorHomeScreen> createState() => _VendorHomeScreenState();
}

class _VendorHomeScreenState extends ConsumerState<VendorHomeScreen> {
  int _currentIndex = 0;
  final List<String> _titles = ['Home', 'Reports', 'Special Offers', 'My Profile'];

  final List<Widget> _screens = [
    const QRDashboardTab(),
    const ReportsScreen(isTab: true),
    const ManageSpecialsTab(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: brandColor,
        title: Text(_titles[_currentIndex], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          if (_currentIndex == 0)
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: () => setState(() {}),
            ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          selectedItemColor: brandColor,
          unselectedItemColor: Colors.grey.shade400,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_rounded),
              activeIcon: Icon(Icons.home_rounded, size: 28),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.bar_chart_outlined),
              activeIcon: Icon(Icons.bar_chart, size: 28),
              label: 'Reports',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.campaign_outlined),
              activeIcon: Icon(Icons.campaign, size: 28),
              label: 'Broadcast',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person, size: 28),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

class QRDashboardTab extends ConsumerStatefulWidget {
  const QRDashboardTab({super.key});

  @override
  ConsumerState<QRDashboardTab> createState() => _QRDashboardTabState();
}

class _QRDashboardTabState extends ConsumerState<QRDashboardTab> {
  final _apiService = ApiService();
  Map<String, dynamic> _settings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    try {
      _settings = await _apiService.getCompanySettings();
    } catch (e) {
      debugPrint('Load settings failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String generateVendorQR() {
    final data = {
      'vendorId': 'autorabit-cafeteria',
      'type': 'vendor_redemption',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    return base64Encode(utf8.encode(jsonEncode(data)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final branding = ref.watch(brandingProvider);
    final vendorName = branding['vendor_name'] ?? 'AutoRabit Cafeteria';
    final vendorLogoUrl = branding['vendor_logo_url'];
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    final couponValue = _settings['coupon_value']?.toString() ?? '160';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: brandColor.withOpacity(0.15),
                  blurRadius: 30,
                  offset: const Offset(0, 15),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                   if (vendorLogoUrl != null && vendorLogoUrl.toString().isNotEmpty)
                    Container(
                      height: 80,
                      width: 160,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage(vendorLogoUrl),
                          fit: BoxFit.contain,
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: brandColor.withOpacity(0.1), shape: BoxShape.circle),
                      child: Icon(Icons.storefront_rounded, size: 40, color: brandColor),
                    ),
                  const SizedBox(height: 20),
                  Text(
                    vendorName,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey.shade900),
                  ),
                  Text(
                    'Point of Sale QR Code',
                    style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 32),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.grey.shade100, width: 2),
                    ),
                    child: QrImageView(
                      data: generateVendorQR(),
                      version: QrVersions.auto,
                      size: 240.0,
                      eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                      dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(color: brandColor.withOpacity(0.1), borderRadius: BorderRadius.circular(30)),
                    child: Text(
                      '₹$couponValue MEAL VALUE',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: brandColor, letterSpacing: 1),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Dynamic QR - Refreshes on load',
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
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
                const Text('Quick Start Guide', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _StepRow(1, 'Display this QR at your counter', brandColor),
                _StepRow(2, 'Employee scans using their app', brandColor),
                _StepRow(3, 'Value ₹$couponValue will be recorded', brandColor),
                _StepRow(4, 'Check "Reports" for daily earnings', brandColor),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final int number;
  final String text;
  final Color brandColor;

  const _StepRow(this.number, this.text, this.brandColor);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: brandColor, shape: BoxShape.circle),
            child: Text('$number', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Text(text, style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

