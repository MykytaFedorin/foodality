import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../db';
import { generateMealOptions, MealOption } from '../engine/planner';
import { fetchLiveAPIRecipesForInventory } from '../engine/api';
import { Utensils, Clock, Flame, CheckCircle, Sparkles, ChefHat, RefreshCw } from 'lucide-react';

export const MealEngine: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [options, setOptions] = useState<MealOption[]>([]);
  const [eatenCaloriesToday, setEatenCaloriesToday] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetchingAPI, setIsFetchingAPI] = useState<boolean>(false);

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

  const activeOption = options[selectedOptionIndex];
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

      {/* Main Meal Cards Section */}
      {options.length > 0 && activeOption ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChefHat color="var(--accent-emerald)" size={20} /> Выберите вариант ({selectedOptionIndex + 1}/{options.length}):
            </h2>

            <div style={{ display: 'flex', gap: '6px' }}>
              {options.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIndex(idx)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: selectedOptionIndex === idx ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Option Card */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '190px', width: '100%' }}>
              <img 
                src={activeOption.recipe.imageUrl} 
                alt={activeOption.recipe.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, transparent 35%, rgba(7, 10, 18, 0.95) 100%)'
              }} />

              {/* Badges */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {activeOption.isReheatOption ? (
                  <span className="chip chip-amber">
                    ⚡ Разогреть (2 мин)
                  </span>
                ) : (
                  <span className="chip chip-emerald">
                    <Clock size={12} /> {activeOption.recipe.prepTimeMin} мин
                  </span>
                )}

                {activeOption.portionsToCook > 1 && (
                  <span className="chip chip-amber">
                    Варим 2 порции (1 на завтра)
                  </span>
                )}
              </div>

              <div style={{ position: 'absolute', bottom: '10px', left: '14px', right: '14px' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {activeOption.recipe.title}
                </h3>
              </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Responsive Macro breakdown grid */}
              <div className="macro-grid">
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {Math.round(activeOption.totalCalories / activeOption.portionsToCook)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ккал/порц</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>
                    {Math.round(activeOption.totalProtein / activeOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Белки</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24' }}>
                    {Math.round(activeOption.totalFat / activeOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Жиры</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa' }}>
                    {Math.round(activeOption.totalCarb / activeOption.portionsToCook)}g
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Углеводы</div>
                </div>
              </div>

              {/* Exact ingredient weights for scales */}
              {!activeOption.isReheatOption && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Ингредиенты на весах {activeOption.portionsToCook > 1 ? '(на 2 порции)' : ''}:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {activeOption.scaledIngredients.map((ing) => {
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
              {activeOption.recipe.instructions && activeOption.recipe.instructions.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChefHat size={16} /> Пошаговый рецепт приготовления:
                  </h4>
                  <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {activeOption.recipe.instructions.map((step, idx) => (
                      <li key={idx} style={{ lineHeight: '1.4' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Single Hero Action Button */}
              <button className="btn-primary btn-hero" onClick={() => handleEat(activeOption)}>
                <Utensils size={22} /> СКУШАЛ 🚀
              </button>
            </div>
          </div>
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
    </div>
  );
};
