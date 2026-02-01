import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';

import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

class ManageSpecialsTab extends ConsumerStatefulWidget {
  const ManageSpecialsTab({super.key});

  @override
  ConsumerState<ManageSpecialsTab> createState() => _ManageSpecialsTabState();
}

class _ManageSpecialsTabState extends ConsumerState<ManageSpecialsTab> {
  final _apiService = ApiService();
  final _specialController = TextEditingController();
  final _offersController = TextEditingController();
  
  // Media State
  File? _specialFile;
  String? _specialFileName;
  String _specialMediaType = 'image'; // image or pdf
  
  File? _offerFile;
  String? _offerFileName;
  String _offerMediaType = 'image';

  // Current Media State (from Backend)
  String? _currentSpecialMediaUrl;
  String? _currentSpecialMediaType;
  String? _currentOfferMediaUrl;
  String? _currentOfferMediaType;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentSettings();
  }

  Future<void> _loadCurrentSettings() async {
    setState(() => _isLoading = true);
    try {
      final settings = await _apiService.getCompanySettings();
      _specialController.text = settings['todays_special'] ?? '';
      _offersController.text = settings['active_offers'] ?? '';
      
      _currentSpecialMediaUrl = settings['todays_special_media_url'];
      _currentSpecialMediaType = settings['todays_special_media_type'];
      _currentOfferMediaUrl = settings['active_offers_media_url'];
      _currentOfferMediaType = settings['active_offers_media_type'];
      
    } catch(e) {
      debugPrint('Error loading settings: $e');
    }
    setState(() => _isLoading = false);
  }

  Future<void> _pickImage(bool isSpecial, ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source, imageQuality: 70);
    
    if (pickedFile != null) {
      setState(() {
        if (isSpecial) {
          _specialFile = File(pickedFile.path);
          _specialFileName = pickedFile.name;
          _specialMediaType = 'image';
        } else {
          _offerFile = File(pickedFile.path);
          _offerFileName = pickedFile.name;
          _offerMediaType = 'image';
        }
      });
    }
  }

  Future<void> _pickPDF(bool isSpecial) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null && result.files.single.path != null) {
      setState(() {
        if (isSpecial) {
          _specialFile = File(result.files.single.path!);
          _specialFileName = result.files.single.name;
          _specialMediaType = 'pdf';
        } else {
          _offerFile = File(result.files.single.path!);
          _offerFileName = result.files.single.name;
          _offerMediaType = 'pdf';
        }
      });
    }
  }

  Future<void> _updateSpecials() async {
    setState(() => _isLoading = true);
    try {
      final updates = <String, dynamic>{
        'todays_special': _specialController.text.trim(),
        'active_offers': _offersController.text.trim(),
      };

      // Upload Special Media if selected
      if (_specialFile != null) {
        final ext = _specialMediaType == 'pdf' ? 'pdf' : 'jpg';
        final path = 'specials/special_${DateTime.now().millisecondsSinceEpoch}.$ext';
        final url = await _apiService.uploadMedia(_specialFile, path);
        debugPrint('XXX Special Media Uploaded: $url');
        if (url != null) {
          updates['todays_special_media_url'] = url;
          updates['todays_special_media_type'] = _specialMediaType;
        }
      }

      // Upload Offer Media if selected
      if (_offerFile != null) {
        final ext = _offerMediaType == 'pdf' ? 'pdf' : 'jpg';
        final path = 'offers/offer_${DateTime.now().millisecondsSinceEpoch}.$ext';
        final url = await _apiService.uploadMedia(_offerFile, path);
        if (url != null) {
          updates['active_offers_media_url'] = url;
          updates['active_offers_media_type'] = _offerMediaType;
        }
      }

      await _apiService.updateCompanySettings(updates);
      
      // Reload to show new live URLs
      await _loadCurrentSettings(); 

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Specials & Media updated successfully!')),
        );
        // Reset files after successful upload
         setState(() {
          _specialFile = null; _specialFileName = null;
          _offerFile = null; _offerFileName = null;
        });
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

  Widget _buildPreview(bool isSpecial, Color color) {
    // 1. Check for local file first
    final File? localFile = isSpecial ? _specialFile : _offerFile;
    final String mediaType = isSpecial ? _specialMediaType : _offerMediaType;
    
    if (localFile != null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 150,
        width: double.infinity,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey.shade50,
        ),
        clipBehavior: Clip.antiAlias,
        child: mediaType == 'pdf' 
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.picture_as_pdf, size: 40, color: color), Text('PDF Selected', style: TextStyle(color: color))])) 
          : Image.file(localFile, fit: BoxFit.cover),
      );
    }

    // 2. Check for existing URL
    final String? currentUrl = isSpecial ? _currentSpecialMediaUrl : _currentOfferMediaUrl;
    final String? currentType = isSpecial ? _currentSpecialMediaType : _currentOfferMediaType;

    if (currentUrl != null && currentUrl.isNotEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 150,
        width: double.infinity,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey.shade50,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned.fill(
              child: currentType == 'pdf'
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.picture_as_pdf, size: 40, color: color), Text('Current PDF', style: TextStyle(color: color))]))
              : Image.network(currentUrl, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.broken_image)),
            ),
            Positioned(
               right: 4, top: 4,
               child: Container(
                 padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                 decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
                 child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
               ),
            )
          ],
        ),
      );
    }

    return const SizedBox.shrink(); 
  }
  
  Widget _buildMediaButtons(bool isSpecial, Color color) {
    final fileName = isSpecial ? _specialFileName : _offerFileName;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPreview(isSpecial, color), // <--- ADDED PREVIEW HERE
        if (fileName != null)
           Padding(
             padding: const EdgeInsets.only(bottom: 8.0),
             child: Row(
               children: [
                 Icon(isSpecial ? (_specialMediaType == 'pdf' ? Icons.picture_as_pdf : Icons.image) : (_offerMediaType == 'pdf' ? Icons.picture_as_pdf : Icons.image), color: color, size: 20),
                 const SizedBox(width: 8),
                 Expanded(child: Text(fileName, overflow: TextOverflow.ellipsis, style: TextStyle(color: color, fontWeight: FontWeight.bold))),
                 IconButton(
                   icon: const Icon(Icons.close, size: 18), 
                   onPressed: () => setState(() {
                     if(isSpecial) { _specialFile = null; _specialFileName = null; }
                     else { _offerFile = null; _offerFileName = null; }
                   }),
                 )
               ],
             ),
           ),
        Wrap(
          spacing: 8.0, // gap between adjacent chips
          runSpacing: 8.0, // gap between lines
          children: [
            OutlinedButton.icon(
              onPressed: () => _pickImage(isSpecial, ImageSource.camera),
              icon: const Icon(Icons.camera_alt, size: 18),
              label: const Text('Photo'),
              style: OutlinedButton.styleFrom(foregroundColor: color, side: BorderSide(color: color.withOpacity(0.5))),
            ),
            OutlinedButton.icon(
              onPressed: () => _pickImage(isSpecial, ImageSource.gallery),
              icon: const Icon(Icons.photo_library, size: 18),
              label: const Text('Gallery'),
              style: OutlinedButton.styleFrom(foregroundColor: color, side: BorderSide(color: color.withOpacity(0.5))),
            ),
            OutlinedButton.icon(
              onPressed: () => _pickPDF(isSpecial),
              icon: const Icon(Icons.picture_as_pdf, size: 18),
              label: const Text('PDF'),
              style: OutlinedButton.styleFrom(foregroundColor: color, side: BorderSide(color: color.withOpacity(0.5))),
            ),
          ],
        ),
      ],
    );
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
            'Update menu & offers. Attach photos or PDFs.',
            style: TextStyle(color: Colors.grey.shade600),
          ),
          const SizedBox(height: 32),
          
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: Colors.grey.shade200)),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   TextField(
                    controller: _specialController,
                    cursorColor: brandColor,
                    decoration: InputDecoration(
                      labelText: "Today's Special",
                      labelStyle: TextStyle(color: brandColor),
                      hintText: "Menu description...",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: brandColor, width: 2)),
                      prefixIcon: Icon(Icons.restaurant, color: brandColor),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  _buildMediaButtons(true, brandColor),
                  
                  const SizedBox(height: 32),
                  const Divider(),
                  const SizedBox(height: 20),
                  
                  TextField(
                    controller: _offersController,
                    cursorColor: brandColor,
                    decoration: InputDecoration(
                      labelText: "Active Offers",
                      labelStyle: TextStyle(color: brandColor),
                      hintText: "Offer details...",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: brandColor, width: 2)),
                      prefixIcon: Icon(Icons.local_offer, color: brandColor),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  _buildMediaButtons(false, brandColor),

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
            message: "Employees see text instantly. Media may take a few seconds to upload.",
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
