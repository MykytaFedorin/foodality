import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../db';
import { Flame, ShieldAlert, RotateCcw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newBlacklistItem, setNewBlacklistItem] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const loadProfile = async () => {
    const p = await db.userProfile.get('default');
    if (p) {
      setProfile(p);
      setTargetCalories(p.targetCalories);
      setBlacklist(p.blacklist || []);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    await db.userProfile.update('default', {
      targetCalories,
      blacklist
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const addBlacklist = () => {
    if (newBlacklistItem.trim() && !blacklist.includes(newBlacklistItem.trim())) {
      setBlacklist([...blacklist, newBlacklistItem.trim()]);
      setNewBlacklistItem('');
    }
  };

  const removeBlacklist = (item: string) => {
    setBlacklist(blacklist.filter(b => b !== item));
  };

  const handleResetAll = async () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные и запустить настройку заново?')) {
      await db.delete();
      window.location.reload();
    }
  };

  if (!profile) return null;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '1.2rem' }}>Настройки профиля и целей</h2>

      {savedSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--accent-emerald)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#34d399', fontWeight: 600 }}>
          ✓ Настройки успешно сохранены!
        </div>
      )}

      {/* Target calories */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame color="var(--accent-emerald)" size={20} />
          <h3 style={{ fontSize: '1rem' }}>Суточная норма калорий</h3>
        </div>

        <div>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Цель: <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{targetCalories} ккал</strong>
          </label>
          <input 
            type="range" 
            min="1200" 
            max="4000" 
            step="50" 
            value={targetCalories}
            onChange={(e) => setTargetCalories(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Blacklist editor */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert color="var(--accent-rose)" size={20} />
          <h3 style={{ fontSize: '1rem' }}>Черный список продуктов (Исключения)</h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            className="input-field" 
            placeholder="Добавить продукт (например, Кинза)" 
            value={newBlacklistItem} 
            onChange={e => setNewBlacklistItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBlacklist()}
          />
          <button className="btn-secondary" onClick={addBlacklist}>Добавить</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {blacklist.map(b => (
            <span key={b} className="chip chip-rose">
              {b}
              <button onClick={() => removeBlacklist(b)} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '4px', cursor: 'pointer' }}>✕</button>
            </span>
          ))}
          {blacklist.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Нет исключений</span>}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave}>
        Сохранить изменения
      </button>

      <button className="btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)', marginTop: '20px' }} onClick={handleResetAll}>
        <RotateCcw size={16} /> Сбросить все данные приложения
      </button>
    </div>
  );
};
