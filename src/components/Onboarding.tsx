import React, { useState } from 'react';
import { db, populateInitialInventory, UserProfile } from '../db';
import { INITIAL_STAPLES } from '../db/initialData';
import { Sparkles, Check, Flame, ShieldAlert, PackageCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [selectedStaples, setSelectedStaples] = useState<string[]>([
    'Гречка', 'Макароны твердых сортов', 'Оливковое масло', 'Соль и Специи'
  ]);
  const [blacklistInput, setBlacklistInput] = useState<string>('');
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const toggleStaple = (name: string) => {
    if (selectedStaples.includes(name)) {
      setSelectedStaples(selectedStaples.filter(s => s !== name));
    } else {
      setSelectedStaples([...selectedStaples, name]);
    }
  };

  const addBlacklistItem = () => {
    if (blacklistInput.trim() && !blacklist.includes(blacklistInput.trim())) {
      setBlacklist([...blacklist, blacklistInput.trim()]);
      setBlacklistInput('');
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
    await populateInitialInventory(selectedStaples);
    onComplete();
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', margin: '20px 0 10px 0' }}>
        <div className="chip chip-emerald" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} /> Zero Cognitive Load Nutrition
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Добро пожаловать в <span className="gradient-text">Foodality</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Переложите заботу о своем питании на приложение. Больше никаких мыслей "что приготовить".
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 1 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 2 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
        <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: step >= 3 ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
      </div>

      {step === 1 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame color="var(--accent-emerald)" size={24} />
            <h2 style={{ fontSize: '1.25rem' }}>Шаг 1: Ваша суточная цель калорий</h2>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>30%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Белки</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>30%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Жиры</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>40%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Углеводы</div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setStep(2)}>
            Далее: Что есть дома?
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PackageCheck color="var(--accent-emerald)" size={24} />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Шаг 2: Что уже есть дома?</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Отметьте продукты, которые есть у вас на кухне прямо сейчас.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
            {INITIAL_STAPLES.map((staple) => {
              const isChecked = selectedStaples.includes(staple.name);
              return (
                <div 
                  key={staple.name}
                  onClick={() => toggleStaple(staple.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{staple.name}</span>
                  <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                    {isChecked && <Check size={16} />}
                  </div>
                </div>
              );
            })}
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
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color="var(--accent-rose)" size={24} />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Шаг 3: Исключения и Аллергены</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Укажите продукты, которые вы НЕ едите (например: свинина, кинза, арахис).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className="input-field"
              placeholder="Введите продукт (например, Свинина)"
              value={blacklistInput}
              onChange={(e) => setBlacklistInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBlacklistItem()}
            />
            <button className="btn-secondary" onClick={addBlacklistItem}>
              Добавить
            </button>
          </div>

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
