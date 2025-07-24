import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    let stream: MediaStream | null = null;
    let animationFrame: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isActive]);

  const handleManualInput = () => {
    const input = prompt('Enter QR code data manually:');
    if (input) {
      onScan(input);
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
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 border-2 border-primary rounded-lg">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-48 h-48 border-2 border-primary rounded-lg">
                <div className="w-full h-1 bg-primary animate-scan"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <Button onClick={handleManualInput} variant="outline" className="flex-1">
            Manual Input
          </Button>
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};