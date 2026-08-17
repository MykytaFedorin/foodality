import Dexie, { Table } from 'dexie';
import { Recipe, INITIAL_RECIPES, INITIAL_STAPLES } from './initialData';

export interface UserProfile {
  id: string;
  targetCalories: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
  mealsPerDay: number;
  blacklist: string[];
  onboardingCompleted: boolean;
}

export interface InventoryItem {
  id?: number;
  name: string;
  category: 'fridge' | 'pantry';
  quantityGrams: number;
  unit: 'g' | 'ml' | 'pcs';
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  isStaple?: boolean;
}

export interface CookedMeal {
  id?: number;
  recipeTitle: string;
  imageUrl: string;
  portionsRemaining: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbPerPortion: number;
  cookedAt: string;
}

export interface MealLog {
  id?: number;
  mealTitle: string;
  calories: number;
  protein: number;
  fat: number;
  carb: number;
  timestamp: string;
}

class FoodalityDatabase extends Dexie {
  userProfile!: Table<UserProfile>;
  inventory!: Table<InventoryItem>;
  recipes!: Table<Recipe>;
  cookedMeals!: Table<CookedMeal>;
  mealLogs!: Table<MealLog>;

  constructor() {
    super('FoodalityDatabase');
    this.version(1).stores({
      userProfile: 'id',
      inventory: '++id, name, category, isStaple',
      recipes: 'id, category, isBatchable',
      cookedMeals: '++id, recipeTitle, portionsRemaining',
      mealLogs: '++id, timestamp'
    });
  }
}

export const db = new FoodalityDatabase();

export async function initDatabase() {
  const profileCount = await db.userProfile.count();
  if (profileCount === 0) {
    await db.userProfile.add({
      id: 'default',
      targetCalories: 2000,
      proteinPercent: 30,
      fatPercent: 30,
      carbPercent: 40,
      mealsPerDay: 3,
      blacklist: [],
      onboardingCompleted: false
    });
  }

  const recipeCount = await db.recipes.count();
  if (recipeCount === 0) {
    await db.recipes.bulkAdd(INITIAL_RECIPES);
  }
}

export async function populateInitialInventory(selectedStapleNames: string[]) {
  const itemsToAdd: InventoryItem[] = INITIAL_STAPLES
    .filter(staple => selectedStapleNames.includes(staple.name))
    .map(staple => ({
      name: staple.name,
      category: staple.category,
      quantityGrams: staple.defaultQty,
      unit: staple.unit,
      caloriesPer100g: staple.c,
      proteinPer100g: staple.p,
      fatPer100g: staple.f,
      carbPer100g: staple.carb,
      isStaple: true
    }));

  await db.inventory.bulkAdd(itemsToAdd);
}
