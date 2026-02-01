import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/branding_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  final _apiService = ApiService();
  
  bool _isLoading = false;
  Map<String, dynamic> _settings = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _settings = await _apiService.getCompanySettings();
    if (mounted) setState(() {});
  }

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    try {
      await _authService.signIn(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Login failed: ${e.toString()}'), 
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _demoLogin() {
    _emailController.text = 'vendor.demo@autorabit.com';
    _passwordController.text = 'Password123!';
    _signIn();
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final companyName = branding['vendor_name'] ?? _settings['company_name'] ?? 'Vendor Portal';
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));
    final logoUrl = branding['vendor_logo_url'];

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [brandColor.withOpacity(0.8), brandColor],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              children: [
                const SizedBox(height: 60),
                // Premium Icon
                logoUrl != null && logoUrl.isNotEmpty
                    ? Image.network(logoUrl, width: 80, height: 80, fit: BoxFit.contain)
                    : Image.asset('assets/logo.png', width: 80, height: 80),
                const SizedBox(height: 24),
                Text(
                  companyName,
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1),
                ),
                const Text(
                  'Vendor Management System',
                  style: TextStyle(fontSize: 14, color: Colors.white70, letterSpacing: 1.5, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 80),

                // Card Container
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 30, offset: const Offset(0, 15)),
                    ],
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: 'Vendor Email',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _passwordController,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          filled: true,
                          fillColor: Colors.white,
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _signIn,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(65),
                          backgroundColor: Colors.orange.shade800,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          elevation: 6,
                          shadowColor: Colors.orange.withOpacity(0.3),
                        ),
                        child: _isLoading 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                          : const Text('Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: _demoLogin,
                        style: TextButton.styleFrom(foregroundColor: Colors.grey.shade700),
                        child: const Text('Use Cafeteria Demo Login', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
