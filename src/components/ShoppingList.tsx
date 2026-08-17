import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../db';
import { generateShoppingList, ShoppingItem } from '../engine/shopping';
import { ShoppingBag, CheckCircle, RefreshCw, Package } from 'lucide-react';

export const ShoppingList: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [days, setDays] = useState<number>(4);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [importedSuccess, setImportedSuccess] = useState<boolean>(false);

  const loadShoppingList = async (targetDays: number = days) => {
    const p = await db.userProfile.get('default');
    if (!p) return;
    setProfile(p);

    const recipes = await db.recipes.toArray();
    const inventory = await db.inventory.toArray();

    const items = generateShoppingList(targetDays, p, recipes, inventory);
    setShoppingItems(items);
  };

  useEffect(() => {
    loadShoppingList(days);
  }, [days]);

  const toggleCheck = (id: string) => {
    setShoppingItems(shoppingItems.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const handleImportToFridge = async () => {
    const itemsToImport = shoppingItems.filter(item => item.isChecked || shoppingItems.every(i => !i.isChecked));
    
    for (const item of itemsToImport) {
      const existing = await db.inventory.filter(i => i.name.toLowerCase() === item.name.toLowerCase()).first();
      const isFridgeCategory = item.category === 'Мясо и Рыба' || item.category === 'Молочные продукты' || item.category === 'Овощи и Фрукты';
      
      if (existing) {
        await db.inventory.update(existing.id!, {
          quantityGrams: existing.quantityGrams + item.toBuyAmount
        });
      } else {
        await db.inventory.add({
          name: item.name,
          category: isFridgeCategory ? 'fridge' : 'pantry',
          quantityGrams: item.toBuyAmount,
          unit: item.unit,
          caloriesPer100g: item.caloriesPer100g,
          proteinPer100g: item.proteinPer100g,
          fatPer100g: item.fatPer100g,
          carbPer100g: item.carbPer100g
        });
      }
    }

    setImportedSuccess(true);
    setTimeout(() => setImportedSuccess(false), 4000);
    await loadShoppingList(days);
  };

  if (!profile) return null;

  // Group items by category
  const categories: ShoppingItem['category'][] = [
    'Мясо и Рыба', 'Овощи и Фрукты', 'Молочные продукты', 'Крупы и Бакалея', 'Масла и Соусы'
  ];

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header controls */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag color="var(--accent-emerald)" size={22} /> Умный список покупок
          </h2>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => loadShoppingList(days)}>
            <RefreshCw size={14} /> Обновить
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Закупка на сколько дней: <strong>{days} дней</strong> ({days * profile.targetCalories} ккал)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {[3, 4, 5, 7].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${days === d ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                  background: days === d ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: days === d ? '#34d399' : 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {d} дней
              </button>
            ))}
          </div>
        </div>
      </div>

      {importedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid var(--accent-emerald)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          <CheckCircle size={22} />
          <span>Продукты успешно внесены в ваш Виртуальный Холодильник!</span>
        </div>
      )}

      {/* Shopping Categories */}
      {shoppingItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map(cat => {
            const catItems = shoppingItems.filter(i => i.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="glass-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-emerald)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} /> {cat}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: item.isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${item.isChecked ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        opacity: item.isChecked ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`custom-checkbox ${item.isChecked ? 'checked' : ''}`}>
                          {item.isChecked && <CheckCircle size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, textDecoration: item.isChecked ? 'line-through' : 'none' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.packageDescription}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button className="btn-primary btn-hero" onClick={handleImportToFridge}>
            Завершить покупку $\rightarrow$ В холодильник 🚀
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <CheckCircle color="var(--accent-emerald)" size={36} style={{ marginBottom: '12px' }} />
          <h3>Всё необходимое уже есть!</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
            Ваших запасов в Кладовой и Холодильнике достаточно на {days} дней. Покупки не требуются!
          </p>
        </div>
      )}
    </div>
  );
};
