import { describe, it, expect } from 'vitest';
import { generateMealOptions, calculateMealTargetCalories } from './planner';
import { Recipe } from '../db/initialData';
import { InventoryItem, UserProfile, CookedMeal } from '../db';

describe('Deterministic Planner Engine Tests', () => {
  const sampleProfile: UserProfile = {
    id: 'default',
    targetCalories: 2000,
    proteinPercent: 30,
    fatPercent: 30,
    carbPercent: 40,
    mealsPerDay: 3,
    blacklist: ['свинина'],
    onboardingCompleted: true
  };

  const sampleRecipes: Recipe[] = [
    {
      id: 'chicken-buckwheat',
      title: 'Куриное филе с гречкой',
      category: 'LUNCH',
      isBatchable: true,
      prepTimeMin: 20,
      imageUrl: 'http://example.com/photo.jpg',
      ingredients: [
        { productId: 'chicken', productName: 'Куриное филе', defaultGrams: 180, caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbPer100g: 0, category: 'fridge' },
        { productId: 'buckwheat', productName: 'Гречка', defaultGrams: 80, caloriesPer100g: 343, proteinPer100g: 13, fatPer100g: 3.4, carbPer100g: 72, category: 'pantry' }
      ],
      instructions: ['Сварить гречку', 'Пожарить курицу']
    },
    {
      id: 'pork-dish',
      title: 'Жаркое из свинины',
      category: 'LUNCH',
      isBatchable: false,
      prepTimeMin: 30,
      imageUrl: 'http://example.com/pork.jpg',
      ingredients: [
        { productId: 'pork', productName: 'Свинина', defaultGrams: 200, caloriesPer100g: 242, proteinPer100g: 27, fatPer100g: 14, carbPer100g: 0, category: 'fridge' }
      ],
      instructions: ['Пожарить свинину']
    }
  ];

  const sampleInventory: InventoryItem[] = [
    { name: 'Куриное филе', category: 'fridge', quantityGrams: 1000, unit: 'g', caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbPer100g: 0 },
    { name: 'Гречка', category: 'pantry', quantityGrams: 1000, unit: 'g', caloriesPer100g: 343, proteinPer100g: 13, fatPer100g: 3.4, carbPer100g: 72 }
  ];

  it('calculates meal target calories correctly', () => {
    const target = calculateMealTargetCalories(sampleProfile, 0);
    expect(target).toBe(667); // 2000 / 3 = 667 kcal
  });

  it('filters out blacklisted recipes (e.g. pork)', () => {
    const options = generateMealOptions(sampleRecipes, sampleInventory, [], sampleProfile, 0);
    const hasPork = options.some(opt => opt.recipe.title.includes('свинины'));
    expect(hasPork).toBe(false);
  });

  it('decides 2-portion batching when inventory supports it', () => {
    const options = generateMealOptions(sampleRecipes, sampleInventory, [], sampleProfile, 0);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].portionsToCook).toBe(2);
  });

  it('prioritizes ready-to-reheat cooked meals as Option #1', () => {
    const cookedMeals: CookedMeal[] = [
      {
        id: 1,
        recipeTitle: 'Куриное филе с гречкой',
        imageUrl: 'http://example.com/photo.jpg',
        portionsRemaining: 1,
        caloriesPerPortion: 650,
        proteinPerPortion: 50,
        fatPerPortion: 15,
        carbPerPortion: 60,
        cookedAt: new Date().toISOString()
      }
    ];

    const options = generateMealOptions(sampleRecipes, sampleInventory, cookedMeals, sampleProfile, 0);
    expect(options[0].isReheatOption).toBe(true);
    expect(options[0].recipe.title).toContain('Разогреть');
  });
});
