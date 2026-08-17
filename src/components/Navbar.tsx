import React from 'react';
import { Utensils, ShoppingBag, Refrigerator, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'eat' | 'shopping' | 'inventory' | 'settings';
  setActiveTab: (tab: 'eat' | 'shopping' | 'inventory' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navbar">
      <button 
        className={`nav-item ${activeTab === 'eat' ? 'active' : ''}`}
        onClick={() => setActiveTab('eat')}
      >
        <Utensils size={24} />
        <span>Хочу есть!</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'shopping' ? 'active' : ''}`}
        onClick={() => setActiveTab('shopping')}
      >
        <ShoppingBag size={24} />
        <span>Закупки</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
        onClick={() => setActiveTab('inventory')}
      >
        <Refrigerator size={24} />
        <span>Холодильник</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <Settings size={24} />
        <span>Цели</span>
      </button>
    </nav>
  );
};
