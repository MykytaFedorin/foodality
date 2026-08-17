import React, { useState, useEffect } from 'react';
import { db, InventoryItem, CookedMeal } from '../db';
import { INITIAL_STAPLES } from '../db/initialData';
import { Refrigerator, Archive, UtensilsCrossed, Plus, Trash2 } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'fridge' | 'pantry' | 'cooked'>('fridge');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cookedMeals, setCookedMeals] = useState<CookedMeal[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New item state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'fridge' | 'pantry'>('fridge');
  const [newQty, setNewQty] = useState(500);
  const [newUnit, setNewUnit] = useState<'g' | 'ml' | 'pcs'>('g');

  const loadData = async () => {
    const inv = await db.inventory.toArray();
    setItems(inv);

    const cooked = await db.cookedMeals.toArray();
    setCookedMeals(cooked);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered suggestions for manual add input
  const filteredSuggestions = INITIAL_STAPLES.filter(s => 
    newName.trim().length > 0 && s.name.toLowerCase().includes(newName.trim().toLowerCase())
  ).slice(0, 6);

  const selectSuggestion = (stapleName: string) => {
    const meta = INITIAL_STAPLES.find(s => s.name === stapleName);
    if (meta) {
      setNewName(meta.name);
      setNewCategory(meta.category);
      setNewQty(meta.defaultQty);
      setNewUnit(meta.unit);
    }
  };

  const getItemStepSize = (item: InventoryItem) => {
    if (item.unit === 'pcs' || item.name.toLowerCase().includes('яйц')) return 1;
    if (item.unit === 'ml') return 100;
    return 100;
  };

  const getItemUnitLabel = (item: InventoryItem) => {
    if (item.unit === 'pcs' || item.name.toLowerCase().includes('яйц')) return 'шт';
    if (item.unit === 'ml') return 'мл';
    return 'г';
  };

  const updateQuantity = async (id: number, currentQty: number, delta: number) => {
    const nextQty = Math.max(0, currentQty + delta);
    if (nextQty === 0) {
      await db.inventory.delete(id);
    } else {
      await db.inventory.update(id, { quantityGrams: nextQty });
    }
    await loadData();
  };

  const deleteItem = async (id: number) => {
    await db.inventory.delete(id);
    await loadData();
  };

  const deleteCookedMeal = async (id: number) => {
    await db.cookedMeals.delete(id);
    await loadData();
  };

  const handleAddItem = async () => {
    if (!newName.trim()) return;

    const stapleMeta = INITIAL_STAPLES.find(s => s.name.toLowerCase() === newName.trim().toLowerCase());
    
    await db.inventory.add({
      name: newName.trim(),
      category: newCategory,
      quantityGrams: newQty,
      unit: stapleMeta ? stapleMeta.unit : newUnit,
      caloriesPer100g: stapleMeta ? stapleMeta.c : 150,
      proteinPer100g: stapleMeta ? stapleMeta.p : 10,
      fatPer100g: stapleMeta ? stapleMeta.f : 5,
      carbPer100g: stapleMeta ? stapleMeta.carb : 15,
      isStaple: true
    });

    setNewName('');
    setShowAddModal(false);
    await loadData();
  };

  const filteredItems = items.filter(i => i.category === activeSubTab);

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub-tabs header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('fridge')}
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'fridge' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'fridge' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'fridge' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Refrigerator size={16} /> Холодильник
        </button>

        <button
          onClick={() => setActiveSubTab('pantry')}
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'pantry' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'pantry' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'pantry' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Archive size={16} /> Кладовая
        </button>

        <button
          onClick={() => setActiveSubTab('cooked')}
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'cooked' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'cooked' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'cooked' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <UtensilsCrossed size={16} /> Готовое ({cookedMeals.length})
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem' }}>
          {activeSubTab === 'fridge' && 'Продукты в холодильнике'}
          {activeSubTab === 'pantry' && 'Крупы, масла и бакалея'}
          {activeSubTab === 'cooked' && 'Приготовленная еда на потом'}
        </h2>
        {activeSubTab !== 'cooked' && (
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Добавить
          </button>
        )}
      </div>

      {/* Modal for adding item with autocomplete */}
      {showAddModal && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--accent-emerald)' }}>
          <h3 style={{ fontSize: '1rem' }}>Добавить продукт в запасы</h3>
          
          <div style={{ position: 'relative' }}>
            <input 
              className="input-field" 
              placeholder="Название продукта (например: Яйца куриные)..." 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />

            {filteredSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-md)',
                zIndex: 500,
                boxShadow: 'var(--shadow-card)'
              }}>
                {filteredSuggestions.map(s => (
                  <div 
                    key={s.name} 
                    onClick={() => selectSuggestion(s.name)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}
                  >
                    {s.name} ({s.defaultQty} {s.unit})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <select className="input-field" value={newCategory} onChange={e => setNewCategory(e.target.value as any)}>
              <option value="fridge">Холодильник</option>
              <option value="pantry">Кладовая</option>
            </select>
            <input 
              type="number" 
              className="input-field" 
              value={newQty} 
              onChange={e => setNewQty(Number(e.target.value))} 
              placeholder="Количество" 
            />
            <select className="input-field" value={newUnit} onChange={e => setNewUnit(e.target.value as any)}>
              <option value="g">грамм (г)</option>
              <option value="pcs">штук (шт)</option>
              <option value="ml">миллилитров (мл)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Отмена</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddItem}>Сохранить</button>
          </div>
        </div>
      )}

      {/* Items list with unit-aware step controls */}
      {activeSubTab !== 'cooked' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map(item => {
            const step = getItemStepSize(item);
            const unitLabel = getItemUnitLabel(item);

            return (
              <div key={item.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {item.quantityGrams} {unitLabel}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '0.82rem', fontWeight: 700 }} 
                    onClick={() => updateQuantity(item.id!, item.quantityGrams, -step)}
                  >
                    -{step}{unitLabel}
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '0.82rem', fontWeight: 700 }} 
                    onClick={() => updateQuantity(item.id!, item.quantityGrams, step)}
                  >
                    +{step}{unitLabel}
                  </button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }} onClick={() => deleteItem(item.id!)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              Раздел пуст
            </div>
          )}
        </div>
      ) : (
        /* Cooked meals list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cookedMeals.map(cm => (
            <div key={cm.id} className="glass-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={cm.imageUrl} alt={cm.recipeTitle} style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{cm.recipeTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                    Осталось: {cm.portionsRemaining} порция | {cm.caloriesPerPortion} ккал
                  </div>
                </div>
              </div>

              <button style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }} onClick={() => deleteCookedMeal(cm.id!)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {cookedMeals.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              Нет готовых порций в холодильнике
            </div>
          )}
        </div>
      )}
    </div>
  );
};
