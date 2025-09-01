import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import QrScanner from 'qr-scanner';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const initScanner = async () => {
      try {
        // Check if QR Scanner is supported
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        // Create QR Scanner instance
        qrScannerRef.current = new QrScanner(
          videoRef.current!,
          (result) => {
            console.log('QR Code detected:', result.data);
            onScan(result.data);
            qrScannerRef.current?.stop();
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment' // Use back camera on mobile
          }
        );

        // Start scanning
        await qrScannerRef.current.start();
        setHasPermission(true);
        setError('');
        
      } catch (err) {
        console.error('Scanner error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera permission denied. Please allow camera access and try again.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found on this device.');
          } else if (err.name === 'NotSupportedError' || err.name === 'InsecureContextError') {
            setError('Camera not supported. Please use HTTPS or localhost.');
          } else {
            setError(`Camera error: ${err.message}`);
          }
        } else {
          setError('Failed to access camera. Please check your permissions.');
        }
        setHasPermission(false);
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [isActive, onScan]);

  const handleManualInput = () => {
    const input = prompt('Enter QR code data manually (paste the employee data):');
    if (input) {
      onScan(input);
    }
  };

  const handleTestScan = () => {
    // Create a test employee QR code for testing purposes
    const testEmployeeData = {
      employeeId: 'test-user-id',
      empNo: 'TEST001',
      name: 'Test Employee',
      type: 'employee_id'
    };
    const testQR = btoa(JSON.stringify(testEmployeeData));
    onScan(testQR);
  };

  const handleRetry = () => {
    setError('');
    setHasPermission(null);
    if (qrScannerRef.current) {
      qrScannerRef.current.start().catch(console.error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-muted"
            autoPlay
            playsInline
            muted
            style={{ maxHeight: '300px' }}
          />
          
          {/* Loading/Error States */}
          {hasPermission === null && !error && (
            <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-lg">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button onClick={handleRetry} size="sm">
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {/* Success state - scanning active */}
          {hasPermission && !error && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
              📷 Scanning for QR codes...
            </div>
          )}
        </div>
        
          <div className="flex gap-2 mt-4">
            <Button onClick={handleTestScan} variant="default" className="flex-1" size="sm">
              🧪 Test Scan
            </Button>
            <Button onClick={handleManualInput} variant="outline" className="flex-1" size="sm">
              Manual Input
            </Button>
            <Button onClick={onClose} variant="secondary" className="flex-1" size="sm">
              Close
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Position the QR code within the camera view. The scanner will automatically detect it.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: If camera doesn't work, try "Manual Input" to paste QR data directly
            </p>
          </div>
      </CardContent>
    </Card>
  );
};