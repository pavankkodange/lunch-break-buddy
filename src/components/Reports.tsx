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
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  BarChart3,
  Clock,
  ArrowLeft
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
  }, [selectedYear, selectedMonth, isAutorabitEmployee]);

  const getDateRange = () => {
    // Monthly report for AutoRABIT employees only
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const fetchRedemptions = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

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
            description: "Failed to fetch redemption data.",
            variant: "destructive"
          });
        } else if (simpleData) {
          setRedemptions(simpleData);
        }
      } else if (redemptionsData) {
        const formattedRedemptions = redemptionsData.map(item => ({
          ...item,
          profile: item.profiles
        }));
        setRedemptions(formattedRedemptions);
      }
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch redemption data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const reportType = 'Monthly Report';
    const period = getReportPeriod();

    let csvContent = '';
    
    // Regular report format for AutoRABIT
    csvContent = `${reportType} - ${period}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}\n`;
    csvContent += `Report Type: AutoRABIT Internal\n\n`;
    csvContent += "S.No,Date,Time,Employee Number,Employee Name,Department,Company Email,Value (₹)\n";
    
    let totalValue = 0;
    redemptions.forEach((redemption, index) => {
      const date = redemption.redemption_date;
      const time = new Date(redemption.redemption_time).toLocaleTimeString('en-IN');
      const value = 160;
      totalValue += value;
      
      csvContent += `${index + 1},${date},${time},${redemption.employee_number},"${redemption.profile?.full_name || 'N/A'}","${redemption.profile?.department || 'N/A'}","${redemption.profile?.company_email || 'N/A'}",${value}\n`;
    });
    
    csvContent += `\nSUMMARY\n`;
    csvContent += `Report Period:,${period}\n`;
    csvContent += `Total Redemptions:,${redemptions.length}\n`;
    csvContent += `Total Value:,₹${totalValue}\n`;
    csvContent += `Unique Employees:,${new Set(redemptions.map(r => r.employee_number)).size}\n`;
    
    const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
    csvContent += `Average per day:,${(redemptions.length / daysInMonth).toFixed(1)}\n`;
    
    csvContent += `\nGenerated by:,${user?.email || 'System'}\n`;
    csvContent += `User Type:,AutoRABIT Employee\n`;
    
    return csvContent;
  };

  const getReportPeriod = () => {
    return `${availableMonths.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
  };

  const downloadReport = () => {
    const csvContent = generateReport();
    const period = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    const filename = `food-coupon-monthly-report-${period}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Report Downloaded",
      description: "Monthly report has been downloaded successfully.",
    });
  };

  const getReportStats = () => {
    const totalRedemptions = redemptions.length;
    const totalValue = totalRedemptions * 160;
    const uniqueEmployees = new Set(redemptions.map(r => r.employee_number)).size;
    const reportPeriod = getReportPeriod();

    return { 
      totalRedemptions, 
      totalValue, 
      uniqueEmployees, 
      reportPeriod
    };
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <FileText className="h-8 w-8" />
              Monthly Reports
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Generate monthly coupon redemption reports for AutoRABIT HR
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="default">
                AutoRABIT Internal
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
              Report Filters
            </CardTitle>
            <p className="text-muted-foreground">
              Select year and month for monthly report generation
            </p>
          </CardHeader>
          <CardContent>
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
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Current Report: {stats.reportPeriod}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.totalRedemptions} redemptions found for this period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground">Total Value</p>
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

        {/* Report Data */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Monthly Redemption Report
                </CardTitle>
                <p className="text-muted-foreground">
                  Detailed breakdown of coupon redemptions for {stats.reportPeriod}
                </p>
              </div>
              <Button 
                onClick={downloadReport} 
                disabled={loading || redemptions.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV Report
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
                <p className="text-lg font-semibold text-muted-foreground">No redemptions found</p>
                <p className="text-sm text-muted-foreground">
                  No coupon redemptions were found for the selected month
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
                            <TableHead>Value</TableHead>
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
                              <TableCell className="text-sm">
                                {redemption.profile?.company_email || 'N/A'}
                              </TableCell>
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
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};