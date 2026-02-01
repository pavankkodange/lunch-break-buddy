import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../providers/branding_provider.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'menu_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;
  final List<String> _titles = ['Home', 'Today\'s Menu', 'Meal History', 'My Profile'];
  
  final List<Widget> _screens = [
    const ScanTab(),
    const MenuScreen(),
    const HistoryScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final primaryColorHex = branding['autorabit_primary_color'] ?? '#1E40AF';
    final primaryColor = Color(int.parse(primaryColorHex.replaceAll('#', '0xFF')));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: primaryColor,
        title: Text(
          _titles[_currentIndex],
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
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
          selectedItemColor: primaryColor,
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
              icon: Icon(Icons.restaurant_menu),
              activeIcon: Icon(Icons.restaurant_menu, size: 28),
              label: 'Menu',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history),
              activeIcon: Icon(Icons.history, size: 28),
              label: 'History',
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

class ScanTab extends ConsumerStatefulWidget {
  const ScanTab({super.key});

  @override
  ConsumerState<ScanTab> createState() => _ScanTabState();
}

class _ScanTabState extends ConsumerState<ScanTab> {
  final _apiService = ApiService();
  final _authService = AuthService();
  bool _isScanning = false;
  bool _todayRedeemed = false;
  Map<String, dynamic>? _profile;
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
      _profile = await _apiService.createOrGetProfile();
      _todayRedeemed = await _apiService.hasAlreadyRedeemedToday();
    } catch (e) {
      debugPrint('Load failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onQRScanned(String code) async {
      setState(() => _isScanning = false);
      _processScan(code);
  }

  void _processScan(String qrData) async {
    try {
      final decodedData = jsonDecode(utf8.decode(base64Decode(qrData)));
      if (decodedData['type'] == 'vendor_redemption') {
        
        await _apiService.recordRedemption(_profile?['employee_number'] ?? '');
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Success! Meal redeemed 🎉', style: TextStyle(fontWeight: FontWeight.bold)), 
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        _loadData();
      } else {
        throw 'Invalid QR code';
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Invalid QR code. Please scan the cafeteria vendor code.'), 
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final branding = ref.watch(brandingProvider);
    final logoUrl = branding['autorabit_logo_url'];
    final primaryColorHex = branding['autorabit_primary_color'] ?? '#1E40AF';
    final primaryColor = Color(int.parse(primaryColorHex.replaceAll('#', '0xFF')));

    final couponValue = _settings['coupon_value']?.toString() ?? '160';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          // Branding Logo
          Center(
            child: logoUrl != null && logoUrl.toString().isNotEmpty
                ? Image.network(logoUrl, height: 60, fit: BoxFit.contain)
                : Image.asset('assets/logo.png', width: 120, height: 60),
          ),
          const SizedBox(height: 16),
          // Premium Status Card
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.white, primaryColor.withOpacity(0.05)],
              ),
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(color: primaryColor.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10)),
              ],
              border: Border.all(color: primaryColor.withOpacity(0.05)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                   Text('Daily Allowance', style: TextStyle(color: primaryColor.withOpacity(0.6), fontWeight: FontWeight.w600, letterSpacing: 1.2)),
                  const SizedBox(height: 12),
                  Text('₹$couponValue', style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: primaryColor.withOpacity(0.8))),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _todayRedeemed ? Colors.green.shade50 : primaryColor.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                             Icon(_todayRedeemed ? Icons.check_circle : Icons.info_outline, size: 16, color: _todayRedeemed ? Colors.green : primaryColor),
                            const SizedBox(width: 8),
                            Text(
                              _todayRedeemed ? 'Redeemed' : 'Available',
                              style: TextStyle(color: _todayRedeemed ? Colors.green.shade700 : primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 48),

          if (!_todayRedeemed)
            _isScanning
                ? Column(
                    children: [
                      Container(
                        height: 300,
                        width: double.infinity,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: primaryColor, width: 2),
                        ),
                        child: MobileScanner(
                          onDetect: (capture) {
                            final List<Barcode> barcodes = capture.barcodes;
                            if (barcodes.isNotEmpty) {
                              _onQRScanned(barcodes.first.rawValue ?? '');
                            }
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton.icon(
                        onPressed: () => setState(() => _isScanning = false),
                        icon: const Icon(Icons.close),
                        label: const Text('Cancel Scan'),
                      ),
                    ],
                  )
                : ElevatedButton(
                    onPressed: () => setState(() => _isScanning = true),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(70),
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shadowColor: primaryColor.withOpacity(0.3),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.qr_code_scanner, size: 28),
                        SizedBox(width: 16),
                        Text('Scan to Redeem Meal', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )
          else
            Column(
              children: [
                const Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
                const SizedBox(height: 16),
                 const Text('Enjoy your meal!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green)),
                const SizedBox(height: 8),
                const Text("How was the food today?", style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) => IconButton(
                    icon: Icon(Icons.star_border, color: Colors.orange.shade300),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Thanks for your feedback!")));
                    },
                  )),
                )
              ],
            ),
        ],
      ),
    );
  }
}

class _ContainerStatus extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _ContainerStatus({required this.icon, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05), 
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(child: Text(text, style: TextStyle(color: color.withOpacity(0.8), fontWeight: FontWeight.w500, height: 1.4))),
        ],
      ),
    );
  }
}
