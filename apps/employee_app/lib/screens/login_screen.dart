import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/location_service.dart';
import 'signup_screen.dart';

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
  final _locationService = LocationService();
  
  bool _isLoading = false;
  bool _locationVerified = false;
  String _locationStatusText = "Checking location...";
  Map<String, dynamic> _settings = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _checkLocation();
  }

  Future<void> _loadSettings() async {
    _settings = await _apiService.getCompanySettings();
    if (mounted) setState(() {});
  }

  Future<void> _checkLocation() async {
    setState(() {
      _isLoading = true;
      _locationStatusText = "Checking location...";
    });

    bool hasPermission = await _locationService.checkPermission();
    if (!hasPermission) {
      setState(() {
        _locationVerified = false;
        _locationStatusText = "Location access required";
        _isLoading = false;
      });
      return;
    }

    // Refresh settings before check
    _settings = await _apiService.getCompanySettings();
    bool isInside = await _locationService.isWithinOffice(settings: _settings);
    setState(() {
      _locationVerified = isInside;
      _locationStatusText = isInside ? "Location verified ✓" : "Must be at office location";
      _isLoading = false;
    });
  }

  Future<void> _signIn() async {
    if (!_locationVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Verification required at office location'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

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

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final companyName = branding['company_name'] ?? 'Lunch buddy';
    final primaryColor = Color(int.parse(branding['autorabit_primary_color']?.replaceAll('#', '0xFF') ?? '0xFF1E40AF'));
    final logoUrl = branding['autorabit_logo_url'];

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [primaryColor.withOpacity(0.8), primaryColor],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              children: [
                const SizedBox(height: 40),
                // Premium Icon
                logoUrl != null && logoUrl.isNotEmpty
                    ? Image.network(logoUrl, width: 100, height: 100, fit: BoxFit.contain)
                    : Image.asset('assets/logo.png', width: 100, height: 100),
                const SizedBox(height: 24),
                // Text(
                //   companyName,
                //   style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2),
                // ),
                const Text(
                  'Employee Portal',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: 1.5),
                ),
                const SizedBox(height: 60),

                // Card Container
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 30, offset: const Offset(0, 15)),
                    ],
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: 'Company Email',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          filled: true,
                          fillColor: Colors.grey.shade50,
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
                          fillColor: Colors.grey.shade50,
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 24),
                      
                      // Location status indicator
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _locationVerified ? Colors.green.withOpacity(0.05) : Colors.orange.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _locationVerified ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1)),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _locationVerified ? Icons.verified_user_rounded : Icons.location_on_rounded,
                              color: _locationVerified ? Colors.green : Colors.orange,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _locationStatusText,
                                style: TextStyle(
                                  color: _locationVerified ? Colors.green.shade700 : Colors.orange.shade700,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (!_locationVerified && !_isLoading)
                              IconButton(
                                icon: const Icon(Icons.refresh, size: 20),
                                onPressed: _checkLocation,
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      ElevatedButton(
                        onPressed: _isLoading ? null : _signIn,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          backgroundColor: Colors.indigo.shade600,
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(60),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          elevation: 6,
                          shadowColor: Colors.indigo.withOpacity(0.3),
                        ),
                        child: _isLoading 
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                            : const Text('Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: _isLoading ? null : () {
                          setState(() {
                            _emailController.text = 'employee.demo@autorabit.com';
                            _passwordController.text = 'Password123!';
                            _locationVerified = true;
                            _locationStatusText = "Location verified (Demo Mode) ✓";
                          });
                          _signIn();
                        },
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(55),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          side: BorderSide(color: Colors.indigo.shade100),
                          foregroundColor: Colors.indigo.shade600,
                        ),
                        child: const Text('Demo Login', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SignupScreen()),
                    );
                  },
                  child: const Text('New employee? Register here', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
