import React, { useState } from 'react';
import { db, populateInitialInventory, UserProfile, SelectedStapleWithQty } from '../db';
import { INITIAL_STAPLES } from '../db/initialData';
import { Sparkles, Flame, ShieldAlert, PackageCheck, Search, Plus, X, Minus } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

interface StapleItemState {
  name: string;
  quantity: number;
  unit: 'g' | 'ml' | 'pcs';
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  
  // Default selected staples with default quantities
  const [selectedStaples, setSelectedStaples] = useState<StapleItemState[]>([
    { name: 'Гречка', quantity: 1000, unit: 'g' },
    { name: 'Макароны твердых сортов', quantity: 500, unit: 'g' },
    { name: 'Оливковое масло', quantity: 500, unit: 'ml' },
    { name: 'Соль и Специи', quantity: 200, unit: 'g' },
    { name: 'Яйца куриные', quantity: 10, unit: 'pcs' }
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [blacklistSearchQuery, setBlacklistSearchQuery] = useState<string>('');
  const [blacklist, setBlacklist] = useState<string[]>([]);

  // Filtered staples for step 2 autocomplete dropdown
  const filteredSuggestions = INITIAL_STAPLES.filter(staple => {
    const isAlreadySelected = selectedStaples.some(s => s.name === staple.name);
    const matchesQuery = searchQuery.trim().length === 0 || 
      staple.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return !isAlreadySelected && matchesQuery;
  }).slice(0, 8);

  // Filtered staples for step 3 blacklist autocomplete dropdown
  const filteredBlacklistSuggestions = INITIAL_STAPLES.filter(staple => {
    const isAlreadyBlacklisted = blacklist.some(b => b.toLowerCase() === staple.name.toLowerCase());
    const matchesQuery = blacklistSearchQuery.trim().length > 0 && 
      staple.name.toLowerCase().includes(blacklistSearchQuery.trim().toLowerCase());
    return !isAlreadyBlacklisted && matchesQuery;
  }).slice(0, 8);

  const addStaple = (name: string) => {
    const meta = INITIAL_STAPLES.find(s => s.name === name);
    if (meta && !selectedStaples.some(s => s.name === name)) {
      setSelectedStaples([
        { name: meta.name, quantity: meta.defaultQty, unit: meta.unit },
        ...selectedStaples
      ]);
      setSearchQuery('');
    }
  };

  const removeStaple = (name: string) => {
    setSelectedStaples(selectedStaples.filter(s => s.name !== name));
  };

  const updateQuantity = (name: string, delta: number) => {
    setSelectedStaples(selectedStaples.map(s => {
      if (s.name === name) {
        const stepSize = s.unit === 'pcs' ? 1 : 100;
        const newQty = Math.max(stepSize, s.quantity + (delta * stepSize));
        return { ...s, quantity: newQty };
      }
      return s;
    }));
  };

  const handleQtyInputChange = (name: string, rawValue: string) => {
    const val = parseInt(rawValue, 10);
    if (isNaN(val) || val < 0) return;
    setSelectedStaples(selectedStaples.map(s => {
      if (s.name === name) {
        return { ...s, quantity: val };
      }
      return s;
    }));
  };

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

  const handleFinish = async () => {
    const profile: UserProfile = {
      id: 'default',
      targetCalories,
      proteinPercent: 30,
      fatPercent: 30,
      carbPercent: 40,
      mealsPerDay: 3,
      blacklist,
      onboardingCompleted: true
    };

    await db.userProfile.put(profile);

    const staplesToSave: SelectedStapleWithQty[] = selectedStaples.map(s => ({
      name: s.name,
      quantity: s.quantity
    }));

    await populateInitialInventory(staplesToSave);
    onComplete();
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ textAlign: 'center', margin: '12px 0 4px 0' }}>
        <div className="chip chip-emerald" style={{ marginBottom: '8px' }}>
          <Sparkles size={14} /> Zero Cognitive Load Nutrition
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>
          Добро пожаловать в <span className="gradient-text">Foodality</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Переложите заботу о своем питании на приложение.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 1 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 2 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 3 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
      </div>

      {step === 1 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame color="var(--accent-emerald)" size={24} />
            <h2 style={{ fontSize: '1.2rem' }}>Шаг 1: Ваша суточная цель калорий</h2>
          </div>

          <div>
            <label style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Калораж в день: <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>{targetCalories} ккал</strong>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>30%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Белки</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>30%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Жиры</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>40%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Углеводы</div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setStep(2)}>
            Далее: Что есть дома?
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PackageCheck color="var(--accent-emerald)" size={24} />
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Шаг 2: Что уже есть дома?</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Найдите продукты и укажите их количество.
              </p>
            </div>
          </div>

          {/* Autocomplete Search Input */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
              <input 
                className="input-field"
                placeholder="Поиск продуктов (например: сыр, курица, гречка)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>

            {/* Autocomplete Dropdown List */}
            {searchQuery.trim().length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-md)',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 500,
                boxShadow: 'var(--shadow-card)'
              }}>
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map(item => (
                    <div 
                      key={item.name}
                      onClick={() => addStaple(item.name)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                      <span className="chip chip-emerald" style={{ fontSize: '0.72rem' }}>
                        <Plus size={12} /> Добавить ({item.defaultQty} {item.unit})
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Ничего не найдено. Попробуйте другое слово.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Products with Editable Quantities */}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Выбранные запасы и их количество:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{selectedStaples.length} позиций</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
              {selectedStaples.map(item => (
                <div 
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1, paddingRight: '8px' }}>
                    {item.name}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => updateQuantity(item.name, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQtyInputChange(item.name, e.target.value)}
                        style={{
                          width: '56px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--accent-emerald)',
                          fontWeight: 700,
                          textAlign: 'center',
                          fontSize: '0.88rem',
                          padding: '4px'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>

                    <button 
                      onClick={() => updateQuantity(item.name, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                    </button>

                    <button 
                      onClick={() => removeStaple(item.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        padding: '4px',
                        marginLeft: '4px'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {selectedStaples.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Нет добавленных продуктов. Воспользуйтесь поиском выше.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
              Назад
            </button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>
              Далее: Исключения
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color="var(--accent-rose)" size={24} />
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Шаг 3: Исключения и Аллергены</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Найдите или введите продукты, которые вы НЕ едите.
              </p>
            </div>
          </div>

          {/* Autocomplete Input for Blacklist */}
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

            {/* Blacklist Autocomplete Dropdown */}
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
                {filteredBlacklistSuggestions.length > 0 ? (
                  filteredBlacklistSuggestions.map(item => (
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Нет исключений (все продукты разрешены)</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
              Назад
            </button>
            <button className="btn-primary btn-hero" style={{ flex: 2 }} onClick={handleFinish}>
              Завершить настройку 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
