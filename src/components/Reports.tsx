import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  BarChart3,
  Clock,
  Receipt,
  Building2
} from 'lucide-react';

interface CompanySettings {
  company_name: string;
  company_address: string;
  email: string;
  contact_number: string;
  gst_number: string;
  logo_url: string;
  primary_color: string;
  currency: string;
  coupon_value: number;
}

interface RedemptionRecord {
  id: string;
  user_id: string;
  employee_number: string;
  redemption_date: string;
  redemption_time: string;
  created_at: string;
  profile?: {
    full_name: string;
    department: string;
    company_email: string;
  };
}

interface ReportsProps {
  onBack: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vendorReportType, setVendorReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: 'AutoRABIT Technologies Pvt Ltd',
    company_address: 'Bangalore, Karnataka, India',
    email: 'info@autorabit.com',
    contact_number: '+91-80-xxxx-xxxx',
    gst_number: '',
    logo_url: '/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png',
    primary_color: '#3b82f6',
    currency: '₹',
    coupon_value: 160
  });
  const { user, isAutorabitEmployee } = useAuth();
  const { hasHRAccess } = useAdminRole();
  const { toast } = useToast();

  // Generate available years (current year and previous year)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear.toString(), (currentYear - 1).toString()];
  
  // Generate available months
  const availableMonths = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    fetchRedemptions();
    fetchCompanySettings();
  }, [selectedYear, selectedMonth, selectedDate, vendorReportType, selectedWeek, isAutorabitEmployee]);

  // Initialize current week
  useEffect(() => {
    if (vendorReportType === 'weekly' && !selectedWeek) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      const weekString = startOfWeek.toISOString().split('T')[0];
      console.log('Initializing week to:', weekString);
      setSelectedWeek(weekString);
    }
  }, [vendorReportType, selectedWeek]);

  const getDateRange = () => {
    console.log('Getting date range for:', { vendorReportType, selectedWeek, selectedYear, selectedMonth, selectedDate });
    
    if (isAutorabitEmployee) {
      // Monthly report for AutoRABIT employees
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    } else {
      // Vendor reports - daily, weekly, or monthly
      switch (vendorReportType) {
        case 'daily':
          return { startDate: selectedDate, endDate: selectedDate };
        
        case 'weekly':
          if (!selectedWeek) {
            console.error('Selected week is empty for weekly report');
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
            const fallbackWeek = startOfWeek.toISOString().split('T')[0];
            console.log('Using fallback week:', fallbackWeek);
            
            const weekStart = new Date(fallbackWeek);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Sunday
            return { 
              startDate: weekStart.toISOString().split('T')[0], 
              endDate: weekEnd.toISOString().split('T')[0] 
            };
          }
          
          const weekStart = new Date(selectedWeek);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Sunday
          const dateRange = { 
            startDate: weekStart.toISOString().split('T')[0], 
            endDate: weekEnd.toISOString().split('T')[0] 
          };
          console.log('Weekly date range:', dateRange);
          return dateRange;
        
        case 'monthly':
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          
          if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            console.error('Invalid year or month for monthly report:', { year, month });
            const now = new Date();
            const fallbackYear = now.getFullYear();
            const fallbackMonth = now.getMonth() + 1;
            const startDate = new Date(fallbackYear, fallbackMonth - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(fallbackYear, fallbackMonth, 0).toISOString().split('T')[0];
            console.log('Using fallback monthly range:', { startDate, endDate });
            return { startDate, endDate };
          }
          
          const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
          const endDate = new Date(year, month, 0).toISOString().split('T')[0];
          console.log('Monthly date range:', { startDate, endDate });
          return { startDate, endDate };
        
        default:
          return { startDate: selectedDate, endDate: selectedDate };
      }
    }
  };

  const fetchRedemptions = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('Fetching redemptions from', startDate, 'to', endDate);

      if (!startDate || !endDate) {
        console.error('Invalid date range:', { startDate, endDate });
        toast({
          title: "Error",
          description: "Invalid date range selected.",
          variant: "destructive"
        });
        return;
      }

      const { data: redemptionsData, error } = await supabase
        .from('meal_redemptions')
        .select(`
          *,
          profiles(
            full_name,
            department,
            company_email
          )
        `)
        .gte('redemption_date', startDate)
        .lte('redemption_date', endDate)
        .order('redemption_time', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions with profiles:', error);
        // Fallback without profile data
        const { data: simpleData, error: simpleError } = await supabase
          .from('meal_redemptions')
          .select('*')
          .gte('redemption_date', startDate)
          .lte('redemption_date', endDate)
          .order('redemption_time', { ascending: false });
          
        if (simpleError) {
          console.error('Error fetching simple redemptions:', simpleError);
          toast({
            title: "Error",
            description: `Failed to fetch redemption data: ${simpleError.message}`,
            variant: "destructive"
          });
        } else if (simpleData) {
          console.log('Successfully fetched redemptions without profiles:', simpleData.length);
          setRedemptions(simpleData);
        }
      } else if (redemptionsData) {
        const formattedRedemptions = redemptionsData.map(item => ({
          ...item,
          profile: item.profiles
        }));
        console.log('Successfully fetched redemptions with profiles:', formattedRedemptions.length);
        setRedemptions(formattedRedemptions);
      }
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
      toast({
        title: "Error",
        description: `Failed to fetch redemption data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company settings:', error);
      } else if (data) {
        setCompanySettings(prev => ({
          ...prev,
          ...data,
          coupon_value: data.coupon_value || 160
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const generateReport = () => {
    const reportType = isAutorabitEmployee ? 'Monthly Report' : getVendorInvoiceTitle();
    const period = getReportPeriod();

    let csvContent = '';
    
    if (isAutorabitEmployee) {
      // Regular report format for AutoRABIT
      csvContent = `${reportType} - ${period}\n`;
      csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}\n`;
      csvContent += `Report Type: AutoRABIT Internal\n\n`;
      csvContent += "S.No,Date,Time,Employee Number,Employee Name,Department,Company Email,Value (₹)\n";
    } else {
      // Invoice format for vendors
      csvContent = `INVOICE\n`;
      csvContent += `Invoice #: INV-${Date.now()}\n`;
      csvContent += `Invoice Date: ${new Date().toLocaleDateString('en-IN')}\n`;
      csvContent += `Invoice Period: ${period}\n\n`;
      
      csvContent += `VENDOR DETAILS\n`;
      csvContent += `Vendor: External Food Service Provider\n`;
      csvContent += `Contact: ${user?.email || 'vendor@company.com'}\n\n`;
      
      csvContent += `AUTORABIT TECHNOLOGIES PVT LTD\n`;
      csvContent += `Corporate Office\n`;
      csvContent += `Bangalore, Karnataka, India\n\n`;
      
      csvContent += `INVOICE SUMMARY\n`;
      csvContent += `Service Period: ${period}\n`;
      csvContent += `Service Type: Employee Meal Coupon Redemption\n`;
      csvContent += `Rate per Meal: ₹160\n\n`;
      
      csvContent += "DETAILED BREAKDOWN\n";
      csvContent += "S.No,Date,Time,Employee Number,Employee Name,Department,Meal Value (₹)\n";
    }
    
    let totalValue = 0;
    redemptions.forEach((redemption, index) => {
      const date = redemption.redemption_date;
      const time = new Date(redemption.redemption_time).toLocaleTimeString('en-IN');
      const value = 160;
      totalValue += value;
      
      if (isAutorabitEmployee) {
        csvContent += `${index + 1},${date},${time},${redemption.employee_number},"${redemption.profile?.full_name || 'N/A'}","${redemption.profile?.department || 'N/A'}","${redemption.profile?.company_email || 'N/A'}",${value}\n`;
      } else {
        csvContent += `${index + 1},${date},${time},${redemption.employee_number},"${redemption.profile?.full_name || 'N/A'}","${redemption.profile?.department || 'N/A'}",${value}\n`;
      }
    });
    
    if (isAutorabitEmployee) {
      csvContent += `\nSUMMARY\n`;
      csvContent += `Report Period:,${period}\n`;
      csvContent += `Total Redemptions:,${redemptions.length}\n`;
      csvContent += `Total Value:,₹${totalValue}\n`;
      csvContent += `Unique Employees:,${new Set(redemptions.map(r => r.employee_number)).size}\n`;
      
      const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      csvContent += `Average per day:,${(redemptions.length / daysInMonth).toFixed(1)}\n`;
      
      csvContent += `\nGenerated by:,${user?.email || 'System'}\n`;
      csvContent += `User Type:,AutoRABIT Employee\n`;
    } else {
      // Invoice totals for vendors
      const taxRate = 0.18; // 18% GST
      const subtotal = totalValue;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;
      
      csvContent += `\nINVOICE TOTALS\n`;
      csvContent += `Subtotal (${redemptions.length} meals × ₹160):,₹${subtotal}\n`;
      csvContent += `GST (18%):,₹${Math.round(taxAmount)}\n`;
      csvContent += `Total Amount Due:,₹${Math.round(totalAmount)}\n`;
      csvContent += `Unique Employees Served:,${new Set(redemptions.map(r => r.employee_number)).size}\n\n`;
      
      csvContent += `PAYMENT TERMS\n`;
      csvContent += `Payment Due: Net 30 Days\n`;
      csvContent += `Invoice generated by: ${user?.email || 'Vendor System'}\n`;
      csvContent += `Report Type: ${getVendorInvoiceTitle()}\n`;
    }
    
    return csvContent;
  };

  const getVendorInvoiceTitle = () => {
    switch (vendorReportType) {
      case 'daily': return 'Daily Invoice';
      case 'weekly': return 'Weekly Invoice';
      case 'monthly': return 'Monthly Invoice';
      default: return 'Invoice';
    }
  };

  const getReportPeriod = () => {
    if (isAutorabitEmployee) {
      return `${availableMonths.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    } else {
      switch (vendorReportType) {
        case 'daily':
          return new Date(selectedDate).toLocaleDateString('en-IN');
        case 'weekly':
          const weekStart = new Date(selectedWeek);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return `${weekStart.toLocaleDateString('en-IN')} - ${weekEnd.toLocaleDateString('en-IN')}`;
        case 'monthly':
          return `${availableMonths.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
        default:
          return new Date(selectedDate).toLocaleDateString('en-IN');
      }
    }
  };

  const generatePDFReport = () => {
    const reportType = isAutorabitEmployee ? 'Monthly Report' : getVendorInvoiceTitle();
    const period = getReportPeriod();
    const doc = new jsPDF();
    
    // Set company colors from settings
    const primaryColor = hexToRgb(companySettings.primary_color);
    const secondaryColor = hexToRgb('#6b7280'); // Gray for secondary text

    // Header section with logo and company info
    if (companySettings.logo_url && companySettings.logo_url !== '/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png') {
      // Add logo if available (you'd need to convert to base64 for jsPDF)
      doc.setFontSize(20);
    } else {
      doc.setFontSize(20);
    }
    
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont('helvetica', 'bold');
    
    if (isAutorabitEmployee) {
      doc.text('AUTORABIT TECHNOLOGIES PVT LTD', 20, 25);
      doc.setFontSize(16);
      doc.text(reportType, 20, 35);
    } else {
      doc.text('INVOICE', 20, 25);
      doc.setFontSize(12);
      doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.text(`Invoice #: INV-${Date.now()}`, 20, 35);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 42);
    }

    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const companyInfo = [
      companySettings.company_name,
      companySettings.company_address,
      `Email: ${companySettings.email}`,
      `Phone: ${companySettings.contact_number}`,
    ];
    
    if (companySettings.gst_number) {
      companyInfo.push(`GST: ${companySettings.gst_number}`);
    }

    let yPos = 55;
    companyInfo.forEach(info => {
      doc.text(info, 20, yPos);
      yPos += 5;
    });

    // Invoice details
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Service Period: ${period}`, 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Service Type: Employee Meal Coupon Redemption`, 20, yPos);
    doc.text(`Rate per Meal: ${companySettings.currency}${companySettings.coupon_value}`, 20, yPos + 7);

    // Table data
    const tableData = redemptions.map((redemption, index) => [
      String(index + 1).padStart(3, '0'),
      redemption.redemption_date,
      new Date(redemption.redemption_time).toLocaleTimeString('en-IN', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }),
      redemption.employee_number,
      redemption.profile?.full_name || 'N/A',
      redemption.profile?.department || 'N/A',
      ...(isAutorabitEmployee ? [redemption.profile?.company_email || 'N/A'] : []),
      `${companySettings.currency}${companySettings.coupon_value}`
    ]);

    const tableColumns = [
      'S.No', 'Date', 'Time', 'Employee ID', 'Employee Name', 'Department',
      ...(isAutorabitEmployee ? ['Company Email'] : []),
      'Value'
    ];

    // Add table
    (doc as any).autoTable({
      head: [tableColumns],
      body: tableData,
      startY: yPos + 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 20, right: 20 }
    });

    // Summary section
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalValue = redemptions.length * companySettings.coupon_value;
    
    if (!isAutorabitEmployee) {
      // Vendor invoice totals
      const taxRate = 0.18; // 18% GST
      const taxAmount = Math.round(totalValue * taxRate);
      const totalWithTax = totalValue + taxAmount;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE SUMMARY', 20, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const summaryY = finalY + 10;
      doc.text(`Subtotal (${redemptions.length} meals × ${companySettings.currency}${companySettings.coupon_value}):`, 20, summaryY);
      doc.text(`${companySettings.currency}${totalValue}`, 150, summaryY);
      
      doc.text('GST (18%):', 20, summaryY + 7);
      doc.text(`${companySettings.currency}${taxAmount}`, 150, summaryY + 7);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount Due:', 20, summaryY + 14);
      doc.text(`${companySettings.currency}${totalWithTax}`, 150, summaryY + 14);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Unique Employees Served: ${new Set(redemptions.map(r => r.employee_number)).size}`, 20, summaryY + 25);
      
      // Payment terms
      doc.setFontSize(8);
      doc.text('Payment Terms: Net 30 Days', 20, summaryY + 35);
    } else {
      // AutoRABIT report summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT SUMMARY', 20, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const summaryY = finalY + 10;
      doc.text(`Report Period: ${period}`, 20, summaryY);
      doc.text(`Total Redemptions: ${redemptions.length}`, 20, summaryY + 7);
      doc.text(`Total Value: ${companySettings.currency}${totalValue}`, 20, summaryY + 14);
      doc.text(`Unique Employees: ${new Set(redemptions.map(r => r.employee_number)).size}`, 20, summaryY + 21);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, pageHeight - 20);
    doc.text(`Generated by: ${user?.email || 'System'}`, 20, pageHeight - 15);

    return doc;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
  };

  const downloadReport = () => {
    const doc = generatePDFReport();
    const reportType = isAutorabitEmployee ? 'monthly-report' : `${vendorReportType}-invoice`;
    const period = isAutorabitEmployee 
      ? `${selectedYear}-${selectedMonth.padStart(2, '0')}`
      : vendorReportType === 'daily' 
        ? selectedDate
        : vendorReportType === 'weekly'
          ? `week-${selectedWeek}`
          : `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    const filename = `food-coupon-${reportType}-${period}.pdf`;
    
    doc.save(filename);
    
    const documentType = isAutorabitEmployee ? 'Report' : 'Invoice';
    toast({
      title: `${documentType} Downloaded`,
      description: `${getVendorInvoiceTitle() || 'Monthly report'} has been downloaded as PDF successfully.`,
    });
  };

  const getReportStats = () => {
    const totalRedemptions = redemptions.length;
    const totalValue = totalRedemptions * 160;
    const uniqueEmployees = new Set(redemptions.map(r => r.employee_number)).size;
    const reportPeriod = getReportPeriod();
    
    // Calculate tax for vendor invoices
    const taxAmount = isAutorabitEmployee ? 0 : Math.round(totalValue * 0.18);
    const totalWithTax = isAutorabitEmployee ? totalValue : totalValue + taxAmount;

    return { 
      totalRedemptions, 
      totalValue, 
      uniqueEmployees, 
      reportPeriod,
      taxAmount,
      totalWithTax
    };
  };

  const stats = getReportStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          ← Back
        </Button>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              {isAutorabitEmployee ? (
                <>
                  <FileText className="h-8 w-8" />
                  Monthly Reports
                </>
              ) : (
                <>
                  <Receipt className="h-8 w-8" />
                  Invoice Generation
                </>
              )}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isAutorabitEmployee 
                ? 'Generate monthly coupon redemption reports for AutoRABIT'
                : 'Generate professional invoices for meal coupon services'
              }
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={isAutorabitEmployee ? "default" : "secondary"}>
                {isAutorabitEmployee ? "AutoRABIT Internal" : "Vendor Invoice System"}
              </Badge>
              {hasHRAccess && (
                <Badge variant="outline">
                  HR Access
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Date Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isAutorabitEmployee ? 'Report Filters' : 'Invoice Period Selection'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isAutorabitEmployee 
                ? 'Select year and month for monthly report generation'
                : 'Choose invoice period type and date range'
              }
            </p>
          </CardHeader>
          <CardContent>
            {isAutorabitEmployee ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-select">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="month-select">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month-select">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-type">Invoice Type</Label>
                  <Select value={vendorReportType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setVendorReportType(value)}>
                    <SelectTrigger id="invoice-type">
                      <SelectValue placeholder="Select invoice type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Invoice</SelectItem>
                      <SelectItem value="weekly">Weekly Invoice</SelectItem>
                      <SelectItem value="monthly">Monthly Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {vendorReportType === 'daily' && (
                  <div className="space-y-2">
                    <Label htmlFor="date-select">Date</Label>
                    <input
                      id="date-select"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}

                {vendorReportType === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="week-select">Week Starting (Monday)</Label>
                    <input
                      id="week-select"
                      type="date"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}

                {vendorReportType === 'monthly' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor-year-select">Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="vendor-year-select">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vendor-month-select">Month</Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger id="vendor-month-select">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMonths.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Current {isAutorabitEmployee ? 'Report' : 'Invoice'}: {stats.reportPeriod}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.totalRedemptions} redemptions found for this period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.totalRedemptions}</div>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">₹{stats.totalValue}</div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
            </CardContent>
          </Card>
          
          {!isAutorabitEmployee && (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Building2 className="h-8 w-8 text-warning" />
                </div>
                <div className="text-2xl font-bold text-warning">₹{stats.totalWithTax}</div>
                <p className="text-sm text-muted-foreground">Total + GST</p>
              </CardContent>
            </Card>
          )}
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-info" />
              </div>
              <div className="text-2xl font-bold text-info">{stats.uniqueEmployees}</div>
              <p className="text-sm text-muted-foreground">Unique Employees</p>
            </CardContent>
          </Card>
          
          {isAutorabitEmployee && (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-lg font-bold">Monthly</div>
                <p className="text-sm text-muted-foreground">Report Type</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Report Data */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isAutorabitEmployee ? (
                    <>
                      <FileText className="h-5 w-5" />
                      Monthly Redemption Report
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      {getVendorInvoiceTitle()}
                    </>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isAutorabitEmployee 
                    ? `Detailed breakdown of coupon redemptions for ${stats.reportPeriod}`
                    : `Professional invoice for meal services - ${stats.reportPeriod}`
                  }
                </p>
              </div>
              <Button 
                onClick={downloadReport} 
                disabled={loading || redemptions.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF {isAutorabitEmployee ? 'Report' : 'Invoice'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report data...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">No {isAutorabitEmployee ? 'redemptions' : 'transactions'} found</p>
                <p className="text-sm text-muted-foreground">
                  No coupon redemptions were found for the selected {
                    isAutorabitEmployee ? 'month' : 
                    vendorReportType === 'daily' ? 'date' :
                    vendorReportType === 'weekly' ? 'week' : 'month'
                  }
                </p>
              </div>
            ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>S.No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Employee Number</TableHead>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Department</TableHead>
                            {isAutorabitEmployee && <TableHead>Company Email</TableHead>}
                            <TableHead>{isAutorabitEmployee ? 'Value' : 'Invoice Amount'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {redemptions.map((redemption, index) => (
                            <TableRow key={redemption.id}>
                              <TableCell className="font-mono text-sm">
                                {String(index + 1).padStart(3, '0')}
                              </TableCell>
                              <TableCell>{redemption.redemption_date}</TableCell>
                              <TableCell>
                                {new Date(redemption.redemption_time).toLocaleTimeString('en-IN', {
                                  hour12: true,
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="font-mono">{redemption.employee_number}</TableCell>
                              <TableCell className="font-medium">
                                {redemption.profile?.full_name || 'N/A'}
                              </TableCell>
                              <TableCell>{redemption.profile?.department || 'N/A'}</TableCell>
                              {isAutorabitEmployee && (
                                <TableCell className="text-sm">
                                  {redemption.profile?.company_email || 'N/A'}
                                </TableCell>
                              )}
                              <TableCell>
                                <Badge variant="secondary" className="bg-success text-success-foreground">
                                  ₹160
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Invoice Summary for Vendors */}
                  {!isAutorabitEmployee && redemptions.length > 0 && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Invoice Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal ({stats.totalRedemptions} meals × ₹160):</span>
                            <span className="font-semibold">₹{stats.totalValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST (18%):</span>
                            <span className="font-semibold">₹{stats.taxAmount}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total Amount:</span>
                              <span className="text-primary">₹{stats.totalWithTax}</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-4">
                            <p><strong>Payment Terms:</strong> Net 30 Days</p>
                            <p><strong>Service Period:</strong> {stats.reportPeriod}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};