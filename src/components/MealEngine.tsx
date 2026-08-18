import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../db';
import { generateMealOptions, MealOption } from '../engine/planner';
import { fetchLiveAPIRecipesForInventory } from '../engine/api';
import { Utensils, Flame, CheckCircle, Sparkles, ChefHat, RefreshCw, Star, ShoppingCart } from 'lucide-react';

export const MealEngine: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [options, setOptions] = useState<MealOption[]>([]);
  const [eatenCaloriesToday, setEatenCaloriesToday] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetchingAPI, setIsFetchingAPI] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<MealOption | null>(null);

  const loadMealData = async () => {
    const p = await db.userProfile.get('default');
    if (!p) return;
    setProfile(p);

    const inventory = await db.inventory.toArray();
    const cooked = await db.cookedMeals.toArray();

    // Calculate eaten calories today
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await db.mealLogs.filter(log => log.timestamp.startsWith(todayStr)).toArray();
    const totalEaten = logs.reduce((acc, log) => acc + log.calories, 0);
    setEatenCaloriesToday(totalEaten);

    setIsFetchingAPI(true);
    const inventoryNames = inventory.map(i => i.name);
    const liveRecipes = await fetchLiveAPIRecipesForInventory(inventoryNames);
    const generated = generateMealOptions(liveRecipes, inventory, cooked, p, totalEaten);
    setIsFetchingAPI(false);

    setOptions(generated);
  };

  useEffect(() => {
    loadMealData();
  }, []);

  const handleEat = async (option: MealOption) => {
    if (!profile) return;

    if (option.isReheatOption && option.cookedMealId) {
      const cooked = await db.cookedMeals.get(option.cookedMealId);
      if (cooked) {
        if (cooked.portionsRemaining <= 1) {
          await db.cookedMeals.delete(option.cookedMealId);
        } else {
          await db.cookedMeals.update(option.cookedMealId, {
            portionsRemaining: cooked.portionsRemaining - 1
          });
        }
      }
    } else {
      const inventory = await db.inventory.toArray();
      for (const ing of option.scaledIngredients) {
        const inStock = inventory.find(inv => inv.name.toLowerCase() === ing.productName.toLowerCase());
        if (inStock) {
          const newQty = Math.max(0, inStock.quantityGrams - ing.scaledGrams);
          await db.inventory.update(inStock.id!, { quantityGrams: newQty });
        }
      }

      if (option.portionsToCook > 1) {
        const singlePortionCal = Math.round(option.totalCalories / option.portionsToCook);
        const singlePortionP = Math.round(option.totalProtein / option.portionsToCook);
        const singlePortionF = Math.round(option.totalFat / option.portionsToCook);
        const singlePortionC = Math.round(option.totalCarb / option.portionsToCook);

        await db.cookedMeals.add({
          recipeTitle: option.recipe.title,
          imageUrl: option.recipe.imageUrl,
          portionsRemaining: option.portionsToCook - 1,
          caloriesPerPortion: singlePortionCal,
          proteinPerPortion: singlePortionP,
          fatPerPortion: singlePortionF,
          carbPerPortion: singlePortionC,
          cookedAt: new Date().toISOString()
        });
      }
    }

    const portionCalories = option.portionsToCook > 1 ? Math.round(option.totalCalories / option.portionsToCook) : option.totalCalories;
    const portionP = option.portionsToCook > 1 ? Math.round(option.totalProtein / option.portionsToCook) : option.totalProtein;
    const portionF = option.portionsToCook > 1 ? Math.round(option.totalFat / option.portionsToCook) : option.totalFat;
    const portionC = option.portionsToCook > 1 ? Math.round(option.totalCarb / option.portionsToCook) : option.totalCarb;

    await db.mealLogs.add({
      mealTitle: option.recipe.title,
      calories: portionCalories,
      protein: portionP,
      fat: portionF,
      carb: portionC,
      timestamp: new Date().toISOString()
    });

    setSuccessMessage(`Приятного аппетита! Приём пищи записан (+${portionCalories} ккал).`);
    setTimeout(() => setSuccessMessage(null), 4000);

    await loadMealData();
  };

  if (!profile) return null;

  const progressPercent = Math.min(100, Math.round((eatenCaloriesToday / profile.targetCalories) * 100));

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Calorie Tracker Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Съедено сегодня</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {eatenCaloriesToday} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {profile.targetCalories} ккал</span>
            </div>
          </div>
          <div className="chip chip-emerald">
            <Flame size={14} /> {profile.targetCalories - eatenCaloriesToday} ккал остаток
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Hero Notification */}
      {successMessage && (
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
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChefHat color="var(--accent-emerald)" size={20} /> Рекомендованные рецепты ({options.length}):
        </h2>
      </div>

      {/* 2-Column Grid of Recipe Tiles (Photo & Title ONLY) */}
      {options.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {options.map((option, idx) => (
            <div
              key={idx}
              className="glass-card"
              onClick={() => setSelectedOption(option)}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                minHeight: '170px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, boxShadow 0.2s ease'
              }}
            >
              {/* Background Photo */}
              <img
                src={option.recipe.imageUrl}
                alt={option.recipe.title}
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

              {/* Top Badges (Public rating & Our Custom Availability Rating) */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                {/* 1. Public Community Rating */}
                {option.recipe.rating ? (
                  <span style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#fbbf24',
                    borderRadius: 'var(--radius-md)',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <Star size={10} fill="#fbbf24" color="#fbbf24" /> {option.recipe.rating}
                  </span>
                ) : <span />}

                {/* 2. Our Custom Availability Rating based on pantry/fridge */}
                <span style={{
                  background: option.availabilityMatchPercent === 100 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                  backdropFilter: 'blur(6px)',
                  border: `1px solid ${option.availabilityMatchPercent === 100 ? '#34d399' : '#fbbf24'}`,
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  ⭐ {Number(option.customAvailabilityRating).toFixed(1)}
                </span>
              </div>

              {/* Bottom Row: Product Title ONLY */}
              <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', lineHeight: '1.3', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                  {option.recipe.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <Sparkles color="var(--accent-amber)" size={32} style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Холодильник почти пуст!</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 16px 0', fontSize: '0.9rem' }}>
            Нет продуктов для приготовления целого блюда под калораж.
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', minHeight: '48px', color: 'var(--accent-emerald)' }}
            onClick={loadMealData}
          >
            <RefreshCw size={16} className={isFetchingAPI ? 'animate-spin' : ''} />
            {isFetchingAPI ? 'Загрузка рецептов из TheMealDB API...' : '🌐 Запросить рецепты по API из интернета'}
          </button>
        </div>
      )}

      {/* Recipe Details Modal Popover */}
      {selectedOption && (
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
          onClick={() => setSelectedOption(null)}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '390px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--accent-emerald)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Header photo & Title */}
            <div style={{ position: 'relative', height: '180px', width: '100%' }}>
              <img
                src={selectedOption.recipe.imageUrl}
                alt={selectedOption.recipe.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.75) 100%)'
              }} />

              <button
                onClick={() => setSelectedOption(null)}
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
                ✕
              </button>

              <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {selectedOption.recipe.title}
                </h3>
              </div>
            </div>

            {/* Modal Body with All Detailed Info */}
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Dual Ratings & Availability Summary */}
              {!selectedOption.isReheatOption && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Рейтинг сообщества:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#fbbf24" color="#fbbf24" /> {selectedOption.recipe.rating || '4.8'} ({selectedOption.recipe.reviewCount || 120} отзывов)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Наша оценка (наличие):</span>
                    <span style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: selectedOption.availabilityMatchPercent === 100 ? '#34d399' : selectedOption.availabilityMatchPercent >= 70 ? '#fbbf24' : '#fb7185'
                    }}>
                      ⭐ {Number(selectedOption.customAvailabilityRating).toFixed(1)} / 5.0
                    </span>
                  </div>

                  {selectedOption.missingIngredients.length > 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShoppingCart size={14} /> Докупить: <strong>{selectedOption.missingIngredients.join(', ')}</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> Все ингредиенты в наличии!
                    </div>
                  )}
                </div>
              )}

              {/* Macro breakdown grid */}
              <div className="macro-grid">
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {Math.round(selectedOption.totalCalories / selectedOption.portionsToCook)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ккал/порц</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
                    {Math.round(selectedOption.totalProtein / selectedOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Белки</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24' }}>
                    {Math.round(selectedOption.totalFat / selectedOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Жиры</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa' }}>
                    {Math.round(selectedOption.totalCarb / selectedOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Углеводы</div>
                </div>
              </div>

              {/* Exact ingredient weights for scales */}
              {!selectedOption.isReheatOption && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Ингредиенты на весах {selectedOption.portionsToCook > 1 ? '(на 2 порции)' : ''}:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {selectedOption.scaledIngredients.map((ing) => {
                      const isEggs = ing.productName.toLowerCase().includes('яйц');
                      const pcsCount = Math.max(1, Math.round(ing.scaledGrams / 50));
                      return (
                        <div key={ing.productName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                          <span>• {ing.productName}</span>
                          <strong style={{ color: 'var(--accent-emerald)' }}>
                            {isEggs ? `${pcsCount} шт (${ing.scaledGrams}г)` : `${ing.scaledGrams} г`}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step-by-Step Cooking Instructions */}
              {selectedOption.recipe.instructions && selectedOption.recipe.instructions.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChefHat size={16} /> Пошаговый рецепт приготовления:
                  </h4>
                  <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedOption.recipe.instructions.map((step, idx) => (
                      <li key={idx} style={{ lineHeight: '1.4' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Hero Action Button */}
              <button
                className="btn-primary btn-hero"
                onClick={async () => {
                  await handleEat(selectedOption);
                  setSelectedOption(null);
                }}
              >
                <Utensils size={22} /> СКУШАЛ 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
