import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';

interface EmployeeLoginProps {
  onLogin: (employee: { id: string; name: string; empNo: string }) => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onLogin }) => {
  const [empNo, setEmpNo] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!empNo.trim() || !name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both employee number and name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate authentication - in real app, this would verify against your employee database
    setTimeout(() => {
      const employee = {
        id: `emp_${empNo}`,
        name: name.trim(),
        empNo: empNo.trim()
      };
      
      localStorage.setItem('currentEmployee', JSON.stringify(employee));
      onLogin(employee);
      setIsLoading(false);
      
      toast({
        title: "Welcome!",
        description: `Logged in as ${name}`,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <CardTitle className="text-2xl">Employee Food Coupons</CardTitle>
          <p className="text-muted-foreground">Sign in to claim your daily meal coupon</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empNo">Employee Number</Label>
            <Input
              id="empNo"
              placeholder="Enter your employee number"
              value={empNo}
              onChange={(e) => setEmpNo(e.target.value)}
              className="transition-smooth"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="transition-smooth"
            />
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full transition-spring hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Daily coupon value: ₹160</p>
            <p className="text-xs mt-1">Available Monday to Friday</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};