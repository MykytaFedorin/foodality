import { describe, it, expect } from 'vitest';
import { generateShoppingList } from './shopping';
import { UserProfile, InventoryItem } from '../db';

describe('Smart Grocery Shopping Generator Tests', () => {
  const profile: UserProfile = {
    id: 'default',
    targetCalories: 2000,
    proteinPercent: 30,
    fatPercent: 30,
    carbPercent: 40,
    mealsPerDay: 3,
    blacklist: [],
    onboardingCompleted: true
  };

  it('deducts existing pantry items from shopping list', () => {
    const existingInventory: InventoryItem[] = [
      { name: 'Гречка', category: 'pantry', quantityGrams: 5000, unit: 'g', caloriesPer100g: 343, proteinPer100g: 13, fatPer100g: 3.4, carbPer100g: 72 }
    ];

    const list = generateShoppingList(4, profile, [], existingInventory);
    const buckwheatItem = list.find(item => item.name === 'Гречка');
    expect(buckwheatItem).toBeUndefined(); // Deducted completely because 5kg > needed
  });

  it('quantizes missing items into standard supermarket packages', () => {
    const list = generateShoppingList(4, profile, [], []);
    const chickenItem = list.find(item => item.name === 'Куриное филе');

    expect(chickenItem).toBeDefined();
    if (chickenItem) {
      expect(chickenItem.packageCount).toBeGreaterThan(0);
      expect(chickenItem.toBuyAmount % 400).toBe(0); // Meat quantized in 400g packs
    }
  });
});
