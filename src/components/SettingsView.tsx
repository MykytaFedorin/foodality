import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../db';
import { INITIAL_STAPLES } from '../db/initialData';
import { Settings, Flame, ShieldAlert, Save, CheckCircle, Plus, Search } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [blacklistSearchQuery, setBlacklistSearchQuery] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadProfile = async () => {
      const p = await db.userProfile.get('default');
      if (p) {
        setProfile(p);
        setTargetCalories(p.targetCalories);
        setBlacklist(p.blacklist || []);
      }
    };
    loadProfile();
  }, []);

  const filteredSuggestions = INITIAL_STAPLES.filter(staple => {
    const isAlreadyBlacklisted = blacklist.some(b => b.toLowerCase() === staple.name.toLowerCase());
    const matchesQuery = blacklistSearchQuery.trim().length > 0 && 
      staple.name.toLowerCase().includes(blacklistSearchQuery.trim().toLowerCase());
    return !isAlreadyBlacklisted && matchesQuery;
  }).slice(0, 8);

  const addBlacklistItem = (nameToAdd?: string) => {
    const targetName = nameToAdd || blacklistSearchQuery.trim();
    if (targetName && !blacklist.includes(targetName)) {
      setBlacklist([targetName, ...blacklist]);
      setBlacklistSearchQuery('');
    }
  };

  const removeBlacklistItem = (item: string) => {
    setBlacklist(blacklist.filter(b => b !== item));
  };

  const handleSave = async () => {
    if (!profile) return;
    await db.userProfile.update('default', {
      targetCalories,
      blacklist
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!profile) return null;

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings color="var(--accent-emerald)" size={24} />
        <h2 style={{ fontSize: '1.25rem' }}>Настройки профиля</h2>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid var(--accent-emerald)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle size={20} />
          <span>Настройки успешно сохранены!</span>
        </div>
      )}

      {/* Target Calories Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame color="var(--accent-emerald)" size={20} />
          <h3 style={{ fontSize: '1.05rem' }}>Цель калорийности</h3>
        </div>

        <div>
          <label style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Суточный калораж: <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{targetCalories} ккал</strong>
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

      {/* Blacklist / Allergens Card with Autocomplete Search */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert color="var(--accent-rose)" size={20} />
          <h3 style={{ fontSize: '1.05rem' }}>Черный список продуктов и Исключения</h3>
        </div>

        {/* Autocomplete Input */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
              <input 
                className="input-field"
                placeholder="Поиск продуктов для исключения..."
                value={blacklistSearchQuery}
                onChange={(e) => setBlacklistSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBlacklistItem()}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <button className="btn-secondary" onClick={() => addBlacklistItem()}>
              Добавить
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {blacklistSearchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--accent-rose)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 500,
              boxShadow: 'var(--shadow-card)'
            }}>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map(item => (
                  <div 
                    key={item.name}
                    onClick={() => addBlacklistItem(item.name)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                    <span className="chip chip-rose" style={{ fontSize: '0.72rem' }}>
                      <Plus size={12} /> Исключить
                    </span>
                  </div>
                ))
              ) : (
                <div 
                  onClick={() => addBlacklistItem()}
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 600 }}
                >
                  + Исключить точное совпадение: "{blacklistSearchQuery.trim()}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blacklisted items list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '32px' }}>
          {blacklist.map((item) => (
            <span key={item} className="chip chip-rose" style={{ paddingRight: '6px' }}>
              {item}
              <button 
                onClick={() => removeBlacklistItem(item)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
              >
                ✕
              </button>
            </span>
          ))}
          {blacklist.length === 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Нет исключений</span>
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave}>
        <Save size={20} /> Сохранить настройки
      </button>
    </div>
  );
};
