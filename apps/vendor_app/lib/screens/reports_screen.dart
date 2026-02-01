import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/branding_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class ReportsScreen extends ConsumerStatefulWidget {
  final bool isTab;
  const ReportsScreen({super.key, this.isTab = false});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  final _apiService = ApiService();
  String _reportType = 'daily';
  DateTime _selectedDate = DateTime.now();
  List<Map<String, dynamic>> _redemptions = [];
  Map<String, dynamic>? _settings;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      _settings = await _apiService.getCompanySettings();
      
      DateTime startDate;
      DateTime endDate;

      if (_reportType == 'daily') {
        startDate = _selectedDate;
        endDate = _selectedDate;
      } else if (_reportType == 'weekly') {
        // Find Monday of the selected week
        int dayOffset = _selectedDate.weekday - 1;
        startDate = _selectedDate.subtract(Duration(days: dayOffset));
        endDate = startDate.add(const Duration(days: 6));
      } else {
        // Monthly
        startDate = DateTime(_selectedDate.year, _selectedDate.month, 1);
        endDate = DateTime(_selectedDate.year, _selectedDate.month + 1, 0);
      }

      _redemptions = await _apiService.getRedemptions(
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  double get couponValue => (_settings?['coupon_value'] ?? 160).toDouble();
  double get gstPercentage => (_settings?['gst_percentage'] ?? 18.0).toDouble();

  double get subtotal => _redemptions.length * couponValue;
  double get gstAmount => subtotal * (gstPercentage / 100);
  double get total => subtotal + gstAmount;

  Future<void> _exportPdf() async {
    final pdf = pw.Document();
    
    pdf.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(level: 0, text: 'INVOICE'),
              pw.SizedBox(height: 20),
              pw.Text('Company: ${_settings?['company_name'] ?? 'AutoRABIT'}'),
              pw.Text('Period: ${DateFormat('dd MMM yyyy').format(_selectedDate)}'),
              pw.SizedBox(height: 20),
              pw.TableHelper.fromTextArray(
                headers: ['Date', 'Emp ID', 'Name', 'Amount'],
                data: _redemptions.map((r) {
                  final profile = r['profiles'];
                  return [
                    r['redemption_date'],
                    profile?['employee_number'] ?? 'N/A',
                    profile?['full_name'] ?? 'N/A',
                    '₹$couponValue',
                  ];
                }).toList(),
              ),
              pw.SizedBox(height: 20),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Subtotal: ₹${subtotal.toStringAsFixed(2)}'),
                      pw.Text('GST ($gstPercentage%): ₹${gstAmount.toStringAsFixed(2)}'),
                      pw.Divider(),
                      pw.Text('Total: ₹${total.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    final output = await getTemporaryDirectory();
    final file = File("${output.path}/invoice.pdf");
    await file.writeAsBytes(await pdf.save());
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Invoice saved to ${file.path}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final companyName = branding['vendor_name'] ?? _settings?['company_name'] ?? 'Vendor Portal';
    final brandColorHex = branding['vendor_brand_color'] ?? '#EA580C';
    final brandColor = Color(int.parse(brandColorHex.replaceAll('#', '0xFF')));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: widget.isTab ? null : AppBar(
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            color: brandColor,
          ),
        ),
        title: Text(companyName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_rounded, color: Colors.white),
            onPressed: _redemptions.isEmpty ? null : _exportPdf,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _reportType,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: 'daily', child: Text('Daily Report')),
                          DropdownMenuItem(value: 'weekly', child: Text('Weekly Report')),
                          DropdownMenuItem(value: 'monthly', child: Text('Monthly Report')),
                        ],
                        onChanged: (val) {
                          setState(() => _reportType = val!);
                          _fetchData();
                        },
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                TextButton.icon(
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime(2023),
                      lastDate: DateTime.now(),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: ColorScheme.light(primary: Colors.orange.shade700),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (picked != null) {
                      setState(() => _selectedDate = picked);
                      _fetchData();
                    }
                  },
                  icon: Icon(Icons.calendar_month_rounded, color: Colors.orange.shade700),
                  label: Text(
                    DateFormat('dd MMM').format(_selectedDate),
                    style: TextStyle(color: Colors.orange.shade700, fontWeight: FontWeight.bold),
                  ),
                  style: TextButton.styleFrom(
                    backgroundColor: brandColor.withOpacity(0.05),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),

          // Summary Section
          if (_redemptions.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.white, brandColor.withOpacity(0.02)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: Colors.orange.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10)),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatColumn('Meals Scanned', '${_redemptions.length}', brandColor),
                      Container(width: 1, height: 40, color: Colors.grey.shade200),
                      _StatColumn('Total Billing', '₹${total.toStringAsFixed(0)}', brandColor),
                    ],
                  ),
                ),
              ),
            ),

          // Redemptions List
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: brandColor))
                : _redemptions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.history_rounded, size: 64, color: Colors.grey.shade300),
                            const SizedBox(height: 16),
                            Text('No records for this period', style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: _redemptions.length,
                        itemBuilder: (context, index) {
                          final r = _redemptions[index];
                          final profile = r['profiles'];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade100),
                              ),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: Colors.orange.shade50,
                                  child: Icon(Icons.person_rounded, color: Colors.orange.shade700),
                                ),
                                title: Text(profile?['full_name'] ?? 'Unknown Employee', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text('ID: ${profile?['employee_number'] ?? 'N/A'} • ${r['redemption_time']}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                trailing: Text('₹${couponValue.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.orange.shade700)),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatColumn(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 12)),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
      ],
    );
  }
}
