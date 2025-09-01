import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import QRCode from 'react-qr-code';

export const VendorQRGenerator: React.FC = () => {
  // Generate vendor QR code - simple identifier for the kiosk/vendor
  const generateVendorQR = () => {
    return btoa(JSON.stringify({
      vendorId: 'autorabit-cafeteria',
      type: 'vendor_redemption',
      timestamp: Date.now()
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src="/lovable-uploads/3d9649e2-b28f-4172-84c3-7b8510a34429.png" alt="AutoRABIT" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <span className="text-3xl">🏪</span>
              Vendor QR Code
            </CardTitle>
            <p className="text-muted-foreground">Employees scan this code for meal redemption</p>
          </CardHeader>
        </Card>

        {/* Vendor QR Code */}
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <span>📱</span>
              Scan Code for Employees
            </CardTitle>
            <p className="text-sm text-muted-foreground">Keep this visible for employees to scan</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-8 rounded-lg border-2 border-primary shadow-coupon">
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-primary">
                  AutoRABIT Cafeteria
                </p>
                <p className="text-sm text-muted-foreground">
                  Scan to redeem your meal
                </p>
              </div>
              <div className="flex justify-center">
                <QRCode
                  value={generateVendorQR()}
                  size={280}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <div className="text-center mt-6 space-y-2">
                <p className="text-sm font-medium">₹160 Meal Value</p>
                <p className="text-xs text-muted-foreground">One redemption per employee per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold">Instructions for Employees:</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p>Login to the employee portal</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p>Use "Scan for Meal" option</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p>Scan this QR code to redeem meal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};