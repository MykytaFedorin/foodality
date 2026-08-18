import Dexie, { Table } from 'dexie';
import { Recipe, INITIAL_RECIPES, INITIAL_STAPLES, getProductImageUrl } from './initialData';

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
  imageUrl?: string;
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
  } else {
    for (const recipe of INITIAL_RECIPES) {
      await db.recipes.put(recipe);
    }
  }
}

export interface SelectedStapleWithQty {
  name: string;
  quantity: number;
}

export async function populateInitialInventory(selectedStaplesWithQty: SelectedStapleWithQty[]) {
  const itemsToAdd: InventoryItem[] = [];

  for (const item of selectedStaplesWithQty) {
    const meta = INITIAL_STAPLES.find(s => s.name === item.name);
    if (meta) {
      itemsToAdd.push({
        name: meta.name,
        category: meta.category,
        quantityGrams: item.quantity,
        unit: meta.unit,
        caloriesPer100g: meta.c,
        proteinPer100g: meta.p,
        fatPer100g: meta.f,
        carbPer100g: meta.carb,
        isStaple: true,
        imageUrl: getProductImageUrl(meta.name)
      });
    }
  }

  if (itemsToAdd.length > 0) {
    await db.inventory.bulkAdd(itemsToAdd);
  }
}
