import React, { useState, useEffect } from 'react';
import { db, initDatabase, UserProfile } from './db';
import { Onboarding } from './components/Onboarding';
import { MealEngine } from './components/MealEngine';
import { ShoppingList } from './components/ShoppingList';
import { InventoryView } from './components/InventoryView';
import { SettingsView } from './components/SettingsView';
import { Navbar } from './components/Navbar';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'eat' | 'shopping' | 'inventory' | 'settings'>('eat');

  const checkOnboarding = async () => {
    await initDatabase();
    const p = await db.userProfile.get('default');
    setProfile(p || null);
    setLoading(false);
  };

  useEffect(() => {
    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
        <Sparkles size={32} className="animate-spin" />
      </div>
    );
  }

  if (!profile || !profile.onboardingCompleted) {
    return <Onboarding onComplete={checkOnboarding} />;
  }

  return (
    <>
      <PWAInstallPrompt />
      {/* App Header */}
      <header style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--accent-emerald)" size={22} />
          <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            Food<span className="gradient-text">ality</span>
          </h1>
        </div>

        <div className="chip chip-emerald" style={{ fontSize: '0.75rem' }}>
          {profile.targetCalories} ккал/день
        </div>
      </header>

      {/* Main Tab Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'eat' && <MealEngine />}
        {activeTab === 'shopping' && <ShoppingList />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default App;
