import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _empIdController = TextEditingController();
  String _role = 'employee'; // 'employee' or 'hr_admin'
  final _authService = AuthService();
  bool _isLoading = false;

  Future<void> _signUp() async {
    if (_nameController.text.isEmpty || _empIdController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _authService.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        fullName: _nameController.text.trim(),
        employeeNumber: _empIdController.text.trim(),
        role: _role,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification email sent! Please check your inbox.')),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Signup failed: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Employee Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _empIdController,
              decoration: const InputDecoration(labelText: 'Employee ID', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Company Email', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Text('Role: '),
                Expanded(
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'employee', label: Text('Employee')),
                      ButtonSegment(value: 'hr_admin', label: Text('HR Admin')),
                    ],
                    selected: {_role},
                    onSelectionChanged: (val) => setState(() => _role = val.first),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _signUp,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Sign Up'),
            ),
          ],
        ),
      ),
    );
  }
}
