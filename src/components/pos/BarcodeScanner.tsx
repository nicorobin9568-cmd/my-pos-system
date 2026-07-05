'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  useEffect(() => {
    let scanner: { stop: () => Promise<void> } | null = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode('barcode-reader');
        html5QrCodeRef.current = html5QrCode;
        scanner = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            onDetected(decodedText);
          },
          undefined
        );
      } catch (err) {
        console.error('Scanner error:', err);
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <h2 className="text-lg font-semibold">Barcode Scan လုပ်ရန်</h2>
        <button onClick={onClose} className="p-2">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div id="barcode-reader" ref={scannerRef} className="w-full max-w-sm" />
      </div>
      <p className="text-white text-center pb-8 text-sm opacity-70">
        Barcode ကို Camera ရှေ့မှာ ကိုင်ပါ
      </p>
    </div>
  );
}
