import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'providers/branding_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://aicfrlxqskcuswmxvolj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpY2ZybHhxc2tjdXN3bXh2b2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODExOTIsImV4cCI6MjA2OTQ1NzE5Mn0.cVk-qHqWHN-_Il41sG0tKgZAZvi2TQ9WYD-Nt-lUk8U',
  );

  runApp(const ProviderScope(child: VendorApp()));
}

class VendorApp extends ConsumerWidget {
  const VendorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final branding = ref.watch(brandingProvider);
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    return MaterialApp(
      title: branding['vendor_name'] ?? 'Vendor Counter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        textTheme: GoogleFonts.outfitTextTheme(),
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandColor,
          primary: brandColor,
        ),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      return const VendorHomeScreen();
    } else {
      return const LoginScreen();
    }
  }
}
