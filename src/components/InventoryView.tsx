import React, { useState, useEffect } from 'react';
import { db, InventoryItem, CookedMeal } from '../db';
import { INITIAL_STAPLES, getProductImageUrl, FALLBACK_FOOD_IMAGE } from '../db/initialData';
import { Refrigerator, Archive, UtensilsCrossed, Plus, Trash2, Layers, X, Camera, Settings } from 'lucide-react';

const GRAM_OPTIONS = Array.from({ length: 60 }, (_, i) => (i + 1) * 50);
const PCS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30];

export const IOSWheelPicker: React.FC<{
  options: number[];
  value: number;
  unit: string;
  onChange: (val: number) => void;
}> = ({ options, value, unit, onChange }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemHeight = 44;

  React.useEffect(() => {
    if (containerRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, [value, options]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (options[index] !== undefined && options[index] !== value) {
      onChange(options[index]);
    }
  };

  return (
    <div style={{ position: 'relative', height: `${itemHeight * 5}px`, width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* iOS Selection Highlight Bar */}
      <div 
        style={{
          position: 'absolute',
          top: `${itemHeight * 2}px`,
          left: '8px',
          right: '8px',
          height: `${itemHeight}px`,
          background: 'rgba(16, 185, 129, 0.18)',
          borderTop: '1px solid rgba(52, 211, 153, 0.4)',
          borderBottom: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: 'var(--radius-sm)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Top & Bottom Fade Gradients for 3D Drum Effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${itemHeight * 2}px`,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.05) 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${itemHeight * 2}px`,
          background: 'linear-gradient(0deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.05) 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* Scrollable Container with Snap */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: `${itemHeight * 2}px`,
          paddingBottom: `${itemHeight * 2}px`,
          boxSizing: 'border-box'
        }}
      >
        {options.map((opt) => {
          const isSelected = opt === value;
          return (
            <div
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                height: `${itemHeight}px`,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isSelected ? '1.35rem' : '1rem',
                fontWeight: isSelected ? 800 : 500,
                color: isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                userSelect: 'none'
              }}
            >
              {opt} {unit === 'pcs' ? 'шт' : unit === 'ml' ? 'мл' : 'г'}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const InventoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'fridge' | 'pantry' | 'cooked'>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [cookedMeals, setCookedMeals] = useState<CookedMeal[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showWheelPicker, setShowWheelPicker] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // New item state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'fridge' | 'pantry'>('fridge');
  const [newQty, setNewQty] = useState(500);
  const [newUnit, setNewUnit] = useState<'g' | 'ml' | 'pcs'>('g');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [photoTarget, setPhotoTarget] = useState<'new' | 'edit'>('new');

  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (showCameraModal) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: 'environment' } } 
      }).then(stream => {
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch(err => {
        console.error("Direct camera stream access failed:", err);
      });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

  const takePhotoSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (photoTarget === 'edit' && selectedItem?.id) {
        await db.inventory.update(selectedItem.id, { imageUrl: dataUrl });
        await loadData();
      } else {
        setCustomPhotoUrl(dataUrl);
      }
    }
    setShowCameraModal(false);
  };

  const loadData = async () => {
    const inv = await db.inventory.toArray();
    // Prepend newer items to top
    const sortedInv = inv.reverse();
    setItems(sortedInv);

    // Keep selectedItem state in sync if open
    if (selectedItem) {
      const updated = sortedInv.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
      else setSelectedItem(null);
    }

    const cooked = await db.cookedMeals.toArray();
    setCookedMeals(cooked);
  };

  useEffect(() => {
    loadData();
  }, []);

  const [hideSuggestions, setHideSuggestions] = useState<boolean>(false);

  // Filtered suggestions for manual add input
  const filteredSuggestions = hideSuggestions ? [] : INITIAL_STAPLES.filter(s => 
    newName.trim().length > 0 && 
    s.name.toLowerCase().includes(newName.trim().toLowerCase()) &&
    s.name.toLowerCase() !== newName.trim().toLowerCase()
  ).slice(0, 6);

  const selectSuggestion = (stapleName: string) => {
    const meta = INITIAL_STAPLES.find(s => s.name === stapleName);
    if (meta) {
      setNewName(meta.name);
      setNewCategory(meta.category);
      setNewQty(meta.defaultQty);
      setNewUnit(meta.unit);
      setHideSuggestions(true);
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
      setSelectedItem(null);
    } else {
      await db.inventory.update(id, { quantityGrams: nextQty });
    }
    await loadData();
  };

  const deleteItem = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await db.inventory.delete(id);
    if (selectedItem?.id === id) setSelectedItem(null);
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
      isStaple: true,
      imageUrl: customPhotoUrl || getProductImageUrl(newName.trim())
    });

    setNewName('');
    setCustomPhotoUrl(null);
    setShowAddModal(false);
    setShowWheelPicker(false);
    setHideSuggestions(false);
    await loadData();
  };

  const filteredItems = activeSubTab === 'all' 
    ? items 
    : items.filter(i => i.category === activeSubTab);

  const currentWheelOptions = newUnit === 'pcs' ? PCS_OPTIONS : GRAM_OPTIONS;

  const handleCategoryClick = (target?: 'fridge' | 'pantry') => {
    if (target) {
      if (newCategory === target) {
        setNewCategory(target === 'fridge' ? 'pantry' : 'fridge');
      } else {
        setNewCategory(target);
      }
    } else {
      setNewCategory(prev => prev === 'fridge' ? 'pantry' : 'fridge');
    }
  };

  const handleUnitClick = (target?: 'g' | 'ml' | 'pcs') => {
    const cycleUnitsList: Array<'g' | 'ml' | 'pcs'> = ['g', 'ml', 'pcs'];
    if (target && newUnit !== target) {
      setNewUnit(target);
      if (target === 'pcs' && newQty > 30) setNewQty(10);
      if ((target === 'g' || target === 'ml') && newQty < 10) setNewQty(500);
    } else {
      setNewUnit((currentUnit) => {
        const currentIndex = cycleUnitsList.indexOf(currentUnit);
        const nextIndex = (currentIndex + 1) % cycleUnitsList.length;
        const nextUnit = cycleUnitsList[nextIndex];
        if (nextUnit === 'pcs' && newQty > 30) {
          setNewQty(10);
        } else if ((nextUnit === 'g' || nextUnit === 'ml') && newQty < 10) {
          setNewQty(500);
        }
        return nextUnit;
      });
    }
  };

  const [showEditWheelPicker, setShowEditWheelPicker] = useState<boolean>(false);

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Horizontally scrollable sub-tabs header */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          onClick={() => setActiveSubTab('all')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'all' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'all' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'all' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Layers size={15} /> Все ({items.length})
        </button>

        <button
          onClick={() => setActiveSubTab('fridge')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'fridge' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'fridge' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'fridge' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Refrigerator size={15} /> Холодильник
        </button>

        <button
          onClick={() => setActiveSubTab('pantry')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'pantry' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'pantry' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'pantry' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Archive size={15} /> Кладовая
        </button>

        <button
          onClick={() => setActiveSubTab('cooked')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeSubTab === 'cooked' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
            background: activeSubTab === 'cooked' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'cooked' ? '#34d399' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <UtensilsCrossed size={15} /> Готовое ({cookedMeals.length})
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.05rem' }}>
          {activeSubTab === 'all' && 'Все имеющиеся продукты'}
          {activeSubTab === 'fridge' && 'Продукты в холодильнике'}
          {activeSubTab === 'pantry' && 'Крупы, масла и бакалея'}
          {activeSubTab === 'cooked' && 'Приготовленная еда на потом'}
        </h2>
      </div>

      {/* Compact Add Product Modal */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '390px',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '22px',
              border: '1px solid var(--accent-emerald)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Добавить продукт</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Name Input */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Название продукта
              </label>
              <input 
                className="input-field" 
                placeholder="Например: Яйца, Молоко, Курица..." 
                value={newName} 
                onChange={e => {
                  setNewName(e.target.value);
                  setHideSuggestions(false);
                }} 
                style={{ fontSize: '1rem', padding: '12px 14px' }}
                autoFocus
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
                  boxShadow: 'var(--shadow-card)',
                  maxHeight: '180px',
                  overflowY: 'auto'
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

            {/* 2. Storage Location Interactive Card */}
            <div 
              onClick={() => handleCategoryClick()}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 600, cursor: 'pointer' }}>
                Где хранится?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setNewCategory('fridge'); }}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${newCategory === 'fridge' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                    background: newCategory === 'fridge' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: newCategory === 'fridge' ? '#34d399' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
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
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setNewCategory('pantry'); }}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${newCategory === 'pantry' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                    background: newCategory === 'pantry' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: newCategory === 'pantry' ? '#34d399' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Archive size={16} /> Кладовая
                </button>
              </div>
            </div>

            {/* 3. Unit Selector Interactive Card */}
            <div 
              onClick={() => handleUnitClick()}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 600, cursor: 'pointer' }}>
                Единица измерения
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setNewUnit('g');
                    if (newQty < 10) setNewQty(500);
                  }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${newUnit === 'g' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                    background: newUnit === 'g' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: newUnit === 'g' ? '#34d399' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  г
                </button>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setNewUnit('ml');
                    if (newQty < 10) setNewQty(500);
                  }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${newUnit === 'ml' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                    background: newUnit === 'ml' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: newUnit === 'ml' ? '#34d399' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  мл
                </button>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setNewUnit('pcs');
                    if (newQty > 30) setNewQty(10);
                  }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${newUnit === 'pcs' ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                    background: newUnit === 'pcs' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: newUnit === 'pcs' ? '#34d399' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  шт
                </button>
              </div>
            </div>

            {/* 3. Compact Quantity Trigger Button & Inline Drum Accordion */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Количество
              </label>
              <button
                type="button"
                onClick={() => setShowWheelPicker(!showWheelPicker)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${showWheelPicker ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.15)'}`,
                  background: showWheelPicker ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: showWheelPicker ? '#34d399' : 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{newQty} {newUnit === 'pcs' ? 'шт' : newUnit === 'ml' ? 'мл' : 'г'}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: showWheelPicker ? '#34d399' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Settings size={18} />
                </span>
              </button>

              {/* Inline Expanded iOS Drum Roller */}
              {showWheelPicker && (
                <div style={{ marginTop: '10px' }}>
                  <IOSWheelPicker 
                    options={currentWheelOptions} 
                    value={currentWheelOptions.includes(newQty) ? newQty : currentWheelOptions[0]} 
                    unit={newUnit}
                    onChange={(val) => setNewQty(val)}
                  />
                </div>
              )}
            </div>

            {/* 4. Direct Camera Photo Capture Section */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                Фото продукта
              </label>

              {customPhotoUrl ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '120px', border: '1px solid var(--accent-emerald)' }}>
                  <img src={customPhotoUrl} alt="Фото продукта" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setCustomPhotoUrl(null)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: '#fb7185',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Удалить фото"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => { setPhotoTarget('new'); setShowCameraModal(true); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.05)',
                    color: '#34d399',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Camera size={18} /> Открыть камеру 📸
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className="btn-secondary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }} onClick={() => { setShowAddModal(false); setShowWheelPicker(false); setCustomPhotoUrl(null); }}>
                Отмена
              </button>
              <button className="btn-primary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }} onClick={handleAddItem}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Direct Camera Viewfinder Modal */}
      {showCameraModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000000',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          {/* Header Close button */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>Сделайте фото продукта</span>
            <button
              onClick={() => setShowCameraModal(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Live Video Stream Viewfinder */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '60vh', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--accent-emerald)', marginTop: '20px', marginBottom: '20px' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          {/* Camera Shutter Trigger Button */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <button
              type="button"
              onClick={takePhotoSnapshot}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '4px solid #ffffff',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              title="Сделать снимок"
            >
              <Camera size={32} />
            </button>
          </div>
        </div>
      )}

      {/* Clean 2-column grid cards with photo background & title ONLY */}
      {activeSubTab !== 'cooked' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="glass-card" 
              onClick={() => {
                setSelectedItem(item);
                setShowEditWheelPicker(false);
              }}
              style={{ 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer'
              }}
            >
              {/* Full Background Photo */}
              <img 
                src={getProductImageUrl(item.name, item.imageUrl)} 
                alt={item.name} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_FOOD_IMAGE;
                }}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  zIndex: 0,
                  filter: 'brightness(0.95)',
                  transition: 'transform 0.3s ease'
                }} 
              />

              {/* Soft Dark Gradient Overlay for title readability */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.78) 100%)',
                  zIndex: 1
                }}
              />

              {/* Top Row: Delete button */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={(e) => deleteItem(item.id!, e)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Удалить продукт"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Bottom Row: Product Title ONLY */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                  {item.name}
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
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

      {/* Product Detail & Editable Management Modal */}
      {selectedItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--accent-emerald)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Modal Header Photo with Change Photo Camera Trigger */}
            <div style={{ position: 'relative', height: '170px', width: '100%' }}>
              <img 
                src={getProductImageUrl(selectedItem.name, selectedItem.imageUrl)} 
                alt={selectedItem.name} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_FOOD_IMAGE;
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.75) 100%)'
                }}
              />

              {/* Change Photo Camera Button */}
              <button 
                onClick={() => { setPhotoTarget('edit'); setShowCameraModal(true); }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Изменить фото продукта"
              >
                <Camera size={15} /> Изменить фото 📸
              </button>

              <button 
                onClick={() => setSelectedItem(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Editable Name & Quantity Drum Controls */}
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Editable Product Name */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Название продукта
                </label>
                <input 
                  className="input-field" 
                  value={selectedItem.name} 
                  onChange={async (e) => {
                    const updatedName = e.target.value;
                    await db.inventory.update(selectedItem.id!, { name: updatedName });
                    await loadData();
                  }}
                  style={{ fontSize: '1.05rem', fontWeight: 700, padding: '10px 14px' }}
                />
              </div>

              {/* 2. Editable Quantity Drum Roller Accordion */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
                  Остаток продукта
                </label>
                <button
                  type="button"
                  onClick={() => setShowEditWheelPicker(!showEditWheelPicker)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${showEditWheelPicker ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.15)'}`,
                    background: showEditWheelPicker ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: showEditWheelPicker ? '#34d399' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{selectedItem.quantityGrams} {getItemUnitLabel(selectedItem)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: showEditWheelPicker ? '#34d399' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <Settings size={18} />
                  </span>
                </button>

                {/* Inline Expanded iOS Drum Roller */}
                {showEditWheelPicker && (
                  <div style={{ marginTop: '10px' }}>
                    <IOSWheelPicker 
                      options={selectedItem.unit === 'pcs' ? PCS_OPTIONS : GRAM_OPTIONS} 
                      value={(selectedItem.unit === 'pcs' ? PCS_OPTIONS : GRAM_OPTIONS).includes(selectedItem.quantityGrams) ? selectedItem.quantityGrams : 500} 
                      unit={selectedItem.unit || 'g'}
                      onChange={async (val) => {
                        await db.inventory.update(selectedItem.id!, { quantityGrams: val });
                        await loadData();
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Quick Step Adjustment Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '10px', fontSize: '0.9rem', fontWeight: 700, justifyContent: 'center' }} 
                  onClick={() => updateQuantity(selectedItem.id!, selectedItem.quantityGrams, -getItemStepSize(selectedItem))}
                >
                  -{getItemStepSize(selectedItem)} {getItemUnitLabel(selectedItem)}
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '10px', fontSize: '0.9rem', fontWeight: 700, justifyContent: 'center' }} 
                  onClick={() => updateQuantity(selectedItem.id!, selectedItem.quantityGrams, getItemStepSize(selectedItem))}
                >
                  +{getItemStepSize(selectedItem)} {getItemUnitLabel(selectedItem)}
                </button>
              </div>

              {/* Nutritional Info */}
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Ккал</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedItem.caloriesPer100g}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Белки</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedItem.proteinPer100g}g</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Жиры</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedItem.fatPer100g}g</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Угл</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedItem.carbPer100g}g</div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                className="btn-secondary" 
                style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
                onClick={() => setSelectedItem(null)}
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Square Add Button (FAB) */}
      {activeSubTab !== 'cooked' && (
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '20px',
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45), 0 2px 8px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            zIndex: 100,
            cursor: 'pointer',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease'
          }}
          title="Добавить продукт"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};
