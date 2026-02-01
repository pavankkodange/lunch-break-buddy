import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';

class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  final _apiService = ApiService();
  Map<String, dynamic> _settings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMenu();
  }

  Future<void> _loadMenu() async {
    setState(() => _isLoading = true);
    try {
      _settings = await _apiService.getCompanySettings();
    } catch (e) {
      debugPrint('Error loading menu: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _launchURL(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open file')),
        );
      }
    }
  }

  Widget _buildMediaPreview(String? url, String? type, Color color) {
    if (url == null || url.isEmpty) return const SizedBox.shrink();

    if (type == 'pdf') {
      return Container(
        margin: const EdgeInsets.only(top: 12),
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () => _launchURL(url),
          icon: const Icon(Icons.picture_as_pdf),
          label: const Text('View PDF Menu'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(16),
            foregroundColor: color,
            side: BorderSide(color: color.withOpacity(0.5)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      );
    } else {
      // Assume Image
      return Container(
        margin: const EdgeInsets.only(top: 12),
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        clipBehavior: Clip.antiAlias,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Center(child: CircularProgressIndicator(value: loadingProgress.expectedTotalBytes != null ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes! : null, color: color));
          },
          errorBuilder: (context, error, stackTrace) {
            debugPrint('Image Load Error: $error');
            return Container(
              color: Colors.grey.shade100,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.broken_image, color: Colors.grey.shade400, size: 40),
                  const SizedBox(height: 8),
                  Text('Could not load image', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                ],
              ),
            );
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final primaryColorHex = branding['autorabit_primary_color'] ?? '#1E40AF';
    final primaryColor = Color(int.parse(primaryColorHex.replaceAll('#', '0xFF')));

    if (_isLoading) {
      return Center(child: CircularProgressIndicator(color: primaryColor));
    }

    final specialText = _settings['todays_special'] ?? "Check back soon!";
    final specialMediaUrl = _settings['todays_special_media_url'];
    debugPrint('XXX Special Media URL: $specialMediaUrl');
    final specialMediaType = _settings['todays_special_media_type'];

    final offerText = _settings['active_offers'];
    final offerMediaUrl = _settings['active_offers_media_url'];
    final offerMediaType = _settings['active_offers_media_type'];

    return RefreshIndicator(
      onRefresh: _loadMenu,
      color: primaryColor,
      child: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primaryColor, primaryColor.withOpacity(0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: primaryColor.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8)),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                  child: const Icon(Icons.restaurant_menu, color: Colors.white, size: 32),
                ),
                const SizedBox(width: 20),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Menu",
                        style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        "Fresh from the kitchen",
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Special Card
          _MenuCard(
            title: "Today's Special",
            icon: Icons.star,
            color: Colors.orange.shade700,
            bgColor: Colors.orange.shade50,
            content: specialText,
            mediaWidget: _buildMediaPreview(specialMediaUrl, specialMediaType, Colors.orange.shade700),
          ),
          
          if (offerText != null && offerText.toString().isNotEmpty) ...[
            const SizedBox(height: 24),
            // Offers Card
            _MenuCard(
              title: "Exclusive Offers",
              icon: Icons.local_offer,
              color: Colors.green.shade700,
              bgColor: Colors.green.shade50,
              content: offerText,
              mediaWidget: _buildMediaPreview(offerMediaUrl, offerMediaType, Colors.green.shade700),
            ),
          ],
        ],
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final String content;
  final Widget mediaWidget;

  const _MenuCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.content,
    required this.mediaWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(color: Colors.grey.shade100, blurRadius: 10, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            content,
            style: const TextStyle(fontSize: 16, height: 1.5, color: Colors.black87),
          ),
          mediaWidget,
        ],
      ),
    );
  }
}
