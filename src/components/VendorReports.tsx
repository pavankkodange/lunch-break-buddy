import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Receipt, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  Building2,
  ArrowLeft,
  LogOut
} from 'lucide-react';

interface CompanySettings {
  company_name: string;
  company_address: string;
  email: string;
  contact_number: string;
  gst_number: string;
  gst_percentage: number;
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

interface VendorReportsProps {
  onBack: () => void;
}

export const VendorReports: React.FC<VendorReportsProps> = ({ onBack }) => {
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: 'AutoRABIT Technologies Pvt Ltd',
    company_address: 'Bangalore, Karnataka, India',
    email: 'info@autorabit.com',
    contact_number: '+91-80-xxxx-xxxx',
    gst_number: '',
    gst_percentage: 18.0,
    logo_url: '/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png',
    primary_color: '#3b82f6',
    currency: '₹',
    coupon_value: 160
  });
  
  const { user, signOut } = useAuth();
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
  }, [selectedYear, selectedMonth, selectedDate, reportType, selectedWeek]);

  // Initialize current week
  useEffect(() => {
    if (reportType === 'weekly' && !selectedWeek) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      const weekString = startOfWeek.toISOString().split('T')[0];
      console.log('Initializing week to:', weekString);
      setSelectedWeek(weekString);
    }
  }, [reportType, selectedWeek]);

  const getDateRange = () => {
    console.log('Getting date range for:', { reportType, selectedWeek, selectedYear, selectedMonth, selectedDate });
    
    switch (reportType) {
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
          coupon_value: data.coupon_value || 160,
          gst_percentage: data.gst_percentage || 18.0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const generatePDFInvoice = () => {
    const period = getInvoicePeriod();
    const doc = new jsPDF();
    
    // Set company colors from settings
    const primaryColor = hexToRgb(companySettings.primary_color);
    const secondaryColor = hexToRgb('#6b7280'); // Gray for secondary text

    // Header section
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: INV-${Date.now()}`, 20, 35);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 42);
    doc.text(`Invoice Period: ${period}`, 20, 49);

    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 65);
    doc.setFont('helvetica', 'normal');
    
    const companyInfo = [
      companySettings.company_name,
      companySettings.company_address,
      `Email: ${companySettings.email}`,
      `Phone: ${companySettings.contact_number}`,
    ];
    
    if (companySettings.gst_number) {
      companyInfo.push(`GST: ${companySettings.gst_number}`);
    }

    let yPos = 72;
    companyInfo.forEach(info => {
      doc.text(info, 20, yPos);
      yPos += 5;
    });

    // Vendor details (right side)
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 120, 65);
    doc.setFont('helvetica', 'normal');
    
    const vendorInfo = [
      'External Food Service Provider',
      `Contact: ${user?.email || 'vendor@company.com'}`,
      'Service: Employee Meal Coupons',
    ];
    
    yPos = 72;
    vendorInfo.forEach(info => {
      doc.text(info, 120, yPos);
      yPos += 5;
    });

    // Service details
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Service Period: ${period}`, 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Service Type: Employee Meal Coupon Redemption`, 20, yPos);
    doc.text(`Rate per Meal: ${companySettings.currency}${companySettings.coupon_value}`, 20, yPos + 7);

    // Table data - ensure proper string conversion and formatting
    const tableData = redemptions.map((redemption, index) => [
      (index + 1).toString().padStart(3, '0'),
      redemption.redemption_date || '',
      new Date(redemption.redemption_time).toLocaleTimeString('en-IN', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }),
      redemption.employee_number || '',
      (redemption.profile?.full_name || 'N/A').toString(),
      (redemption.profile?.department || 'N/A').toString(),
      `${companySettings.currency}${companySettings.coupon_value}`
    ]);

    const tableColumns = [
      'S.No', 'Date', 'Time', 'Employee ID', 'Employee Name', 'Department', 'Amount'
    ];

    // Add table with improved formatting
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: yPos + 20,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // S.No - center aligned
        1: { halign: 'center', cellWidth: 22 }, // Date - center aligned
        2: { halign: 'center', cellWidth: 20 }, // Time - center aligned
        3: { halign: 'center', cellWidth: 28 }, // Employee ID - center aligned
        4: { halign: 'left', cellWidth: 50 }, // Name - left aligned, wider
        5: { halign: 'left', cellWidth: 35 }, // Department - left aligned
        6: { halign: 'right', cellWidth: 20 }, // Amount - right aligned
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });

    // Invoice totals
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalValue = redemptions.length * companySettings.coupon_value;
    const taxRate = companySettings.gst_percentage / 100;
    const taxAmount = Math.round(totalValue * taxRate);
    const totalWithTax = totalValue + taxAmount;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TOTALS', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const summaryY = finalY + 10;
    
    // Show GST details if GST number is provided
    if (companySettings.gst_number) {
      doc.text(`GST Number: ${companySettings.gst_number}`, 20, summaryY);
      doc.text(`GST (${companySettings.gst_percentage}%): ${companySettings.currency}${taxAmount}`, 20, summaryY + 7);
    }
    
    // Add line above total
    doc.setDrawColor(0, 0, 0);
    const lineY = companySettings.gst_number ? summaryY + 14 : summaryY + 7;
    doc.line(20, lineY, 180, lineY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL AMOUNT DUE:', 20, lineY + 10);
    doc.text(`${companySettings.currency}${totalWithTax}`, 150, lineY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const detailsY = companySettings.gst_number ? lineY + 20 : lineY + 20;
    doc.text(`Meals Served: ${redemptions.length} × ${companySettings.currency}${companySettings.coupon_value} = ${companySettings.currency}${totalValue}`, 20, detailsY);
    doc.text(`Unique Employees Served: ${new Set(redemptions.map(r => r.employee_number)).size}`, 20, detailsY + 7);
    
    // Payment terms
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT TERMS:', 20, detailsY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text('Net 30 Days from invoice date', 20, detailsY + 27);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, pageHeight - 20);
    doc.text(`Generated by: ${user?.email || 'Vendor System'}`, 20, pageHeight - 15);
    doc.text(`Invoice Type: ${getInvoiceTitle()}`, 20, pageHeight - 10);

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

  const getInvoiceTitle = () => {
    switch (reportType) {
      case 'daily': return 'Daily Invoice';
      case 'weekly': return 'Weekly Invoice';
      case 'monthly': return 'Monthly Invoice';
      default: return 'Invoice';
    }
  };

  const getInvoicePeriod = () => {
    switch (reportType) {
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
  };

  const downloadInvoice = () => {
    try {
      const doc = generatePDFInvoice();
      const period = reportType === 'daily' 
        ? selectedDate
        : reportType === 'weekly'
          ? `week-${selectedWeek}`
          : `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      const filename = `vendor-invoice-${reportType}-${period}.pdf`;
      
      doc.save(filename);
      
      toast({
        title: "Invoice Downloaded",
        description: `${getInvoiceTitle()} has been downloaded as PDF successfully.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getReportStats = () => {
    const totalRedemptions = redemptions.length;
    const totalValue = totalRedemptions * companySettings.coupon_value;
    const uniqueEmployees = new Set(redemptions.map(r => r.employee_number)).size;
    const reportPeriod = getInvoicePeriod();
    
    const taxAmount = Math.round(totalValue * (companySettings.gst_percentage / 100));
    const totalWithTax = totalValue + taxAmount;

    return { 
      totalRedemptions, 
      totalValue, 
      uniqueEmployees, 
      reportPeriod,
      taxAmount,
      totalWithTax
    };
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stats = getReportStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {user && (
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src={companySettings.logo_url} alt="Company Logo" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <Receipt className="h-8 w-8" />
              Vendor Invoice Generation
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Generate professional PDF invoices for meal coupon services
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary">
                Vendor Invoice System
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Period Selection */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Invoice Period Selection
            </CardTitle>
            <p className="text-muted-foreground">
              Choose invoice period type and date range
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-type">Invoice Type</Label>
                <Select value={reportType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setReportType(value)}>
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

              {reportType === 'daily' && (
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

              {reportType === 'weekly' && (
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

              {reportType === 'monthly' && (
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
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Current Invoice: {stats.reportPeriod}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.totalRedemptions} redemptions found for this period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{stats.totalRedemptions}</div>
              <p className="text-sm text-muted-foreground">Total Meals</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">{companySettings.currency}{stats.totalValue}</div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-8 w-8 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">{companySettings.currency}{stats.totalWithTax}</div>
              <p className="text-sm text-muted-foreground">Total + GST</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-info" />
              </div>
              <div className="text-2xl font-bold text-info">{stats.uniqueEmployees}</div>
              <p className="text-sm text-muted-foreground">Unique Employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Data */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {getInvoiceTitle()}
                </CardTitle>
                <p className="text-muted-foreground">
                  Professional invoice for meal services - {stats.reportPeriod}
                </p>
              </div>
              <Button 
                onClick={downloadInvoice} 
                disabled={loading || redemptions.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading invoice data...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground">
                  No coupon redemptions were found for the selected {
                    reportType === 'daily' ? 'date' :
                    reportType === 'weekly' ? 'week' : 'month'
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
                            <TableHead>Invoice Amount</TableHead>
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
                              <TableCell>
                                <Badge variant="secondary" className="bg-success text-success-foreground">
                                  {companySettings.currency}{companySettings.coupon_value}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Invoice Summary */}
                  {redemptions.length > 0 && (
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
                            <span>Service Amount ({stats.totalRedemptions} meals × {companySettings.currency}{companySettings.coupon_value}):</span>
                            <span className="font-semibold">{companySettings.currency}{stats.totalValue}</span>
                          </div>
                          {companySettings.gst_number && (
                            <div className="flex justify-between">
                              <span>GST ({companySettings.gst_percentage}%) - {companySettings.gst_number}:</span>
                              <span className="font-semibold">{companySettings.currency}{stats.taxAmount}</span>
                            </div>
                          )}
                          <div className="border-t pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total Amount Due:</span>
                              <span className="text-primary">{companySettings.currency}{stats.totalWithTax}</span>
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