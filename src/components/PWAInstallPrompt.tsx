import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    // Check if already running in standalone mode (installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  // If already installed or closed by user, don't show
  if (isStandalone || !isVisible) return null;

  // Don't show if neither prompt event nor iOS
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 24px)',
      maxWidth: '560px',
      background: 'rgba(16, 185, 129, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      color: '#ffffff',
      padding: '14px 18px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      animation: 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <Smartphone size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Установите Foodality
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.95 }}>
            {isIOS ? (
              <span>Нажмите <Share size={12} style={{ display: 'inline', margin: '0 2px' }} /> ➔ «На экран «Домой»»</span>
            ) : (
              <span>Быстрый доступ на экране смартфона без интернета</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isIOS && deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            style={{
              background: '#ffffff',
              color: '#059669',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <Download size={16} /> Скачать
          </button>
        )}

        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
