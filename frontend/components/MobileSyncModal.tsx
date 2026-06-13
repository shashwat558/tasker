import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSyncModal({ isOpen, onClose }: MobileSyncModalProps) {
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateSyncToken();
    } else {
      setSyncUrl(null);
      setError(null);
    }
  }, [isOpen]);

  const generateSyncToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/auth/sync-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate sync token');
      
      // Get the current origin, but if it's localhost, we need the local IP for mobile access.
      // Since we can't reliably get the local IP from the browser, we use window.location.origin
      // Note: For actual mobile sync on local dev, the user must access the desktop site via Local IP first
      // OR we just use window.location.origin and assume they are accessing via Local IP or production domain.
      const baseUrl = window.location.origin;
      setSyncUrl(`${baseUrl}/sync?token=${data.syncToken}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="pointer-events-auto relative w-full max-w-sm border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-950 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-slate-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center border-2 border-black dark:border-white mb-4">
                  <Smartphone className="size-6" />
                </div>
                
                <h2 className="text-xl font-bold uppercase tracking-widest text-black dark:text-white mb-2">
                  Sync to Mobile
                </h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">
                  Scan this QR code with your phone's camera to instantly log in.
                </p>

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-48 w-48 border-2 border-black dark:border-white p-4">
                    <Loader2 className="size-8 animate-spin text-black dark:text-white" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-48 w-full border-2 border-red-500 p-4 text-red-500">
                    <p className="text-sm font-bold uppercase">{error}</p>
                    <Button onClick={generateSyncToken} className="mt-4" variant="outline">Retry</Button>
                  </div>
                ) : syncUrl ? (
                  <div className="p-4 border-4 border-black dark:border-white bg-white">
                    <QRCodeSVG value={syncUrl} size={200} level="H" />
                  </div>
                ) : null}

                <p className="mt-6 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  This code expires in 5 minutes
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
