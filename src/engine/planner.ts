import { Recipe } from '../db/initialData';
import { InventoryItem, UserProfile, CookedMeal } from '../db';

export interface ScaledIngredient {
  productName: string;
  scaledGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carb: number;
}

export interface MealOption {
  recipe: Recipe;
  targetMealCalories: number;
  portionsToCook: number; // 1 or 2 (Batch decision)
  scaledIngredients: ScaledIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
  isReheatOption?: boolean;
  cookedMealId?: number;
}

export function calculateMealTargetCalories(profile: UserProfile, eatenCaloriesToday: number = 0): number {
  const remainingToday = Math.max(200, profile.targetCalories - eatenCaloriesToday);
  // Default target per meal slot (e.g. 35% of total for lunch/dinner)
  const slotTarget = Math.round(profile.targetCalories / profile.mealsPerDay);
  return Math.min(slotTarget, remainingToday);
}

export function generateMealOptions(
  recipes: Recipe[],
  inventory: InventoryItem[],
  cookedMeals: CookedMeal[],
  profile: UserProfile,
  eatenCaloriesToday: number = 0
): MealOption[] {
  const options: MealOption[] = [];
  const targetCalories = calculateMealTargetCalories(profile, eatenCaloriesToday);

  // 1. Check for ready-to-reheat Cooked Meals first!
  const availableCooked = cookedMeals.find(cm => cm.portionsRemaining > 0);
  if (availableCooked) {
    options.push({
      recipe: {
        id: 'reheat-' + availableCooked.id,
        title: `⚡ Разогреть: ${availableCooked.recipeTitle}`,
        category: 'LUNCH',
        isBatchable: false,
        prepTimeMin: 2,
        imageUrl: availableCooked.imageUrl,
        ingredients: [],
        instructions: ['Достать порцию из холодильника.', 'Разогреть в микроволновке 2 минуты.']
      },
      targetMealCalories: availableCooked.caloriesPerPortion,
      portionsToCook: 1,
      scaledIngredients: [],
      totalCalories: availableCooked.caloriesPerPortion,
      totalProtein: availableCooked.proteinPerPortion,
      totalFat: availableCooked.fatPerPortion,
      totalCarb: availableCooked.carbPerPortion,
      isReheatOption: true,
      cookedMealId: availableCooked.id
    });
  }

  // 2. Filter recipes against user Blacklist
  const validRecipes = recipes.filter(recipe => {
    return !recipe.ingredients.some(ing => 
      profile.blacklist.some(b => b.toLowerCase() === ing.productName.toLowerCase())
    );
  });

  // 3. Score and scale candidate recipes based on available inventory
  for (const recipe of validRecipes) {
    // Calculate raw recipe default total calories
    const baseCalories = recipe.ingredients.reduce((acc, ing) => {
      return acc + (ing.defaultGrams * ing.caloriesPer100g) / 100;
    }, 0);

    if (baseCalories === 0) continue;

    // Scale multiplier to hit target calories
    const scaleFactor = targetCalories / baseCalories;

    // Check if inventory has ingredients
    let hasIngredientsInInventory = true;

    const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map(ing => {
      const scaledGrams = Math.round(ing.defaultGrams * scaleFactor);
      
      // Check inventory quantity
      const inStock = inventory.find(inv => inv.name.toLowerCase() === ing.productName.toLowerCase());
      if (!inStock || inStock.quantityGrams < scaledGrams * 0.5) {
        hasIngredientsInInventory = false;
      }

      return {
        productName: ing.productName,
        scaledGrams,
        calories: Math.round((scaledGrams * ing.caloriesPer100g) / 100),
        protein: Math.round((scaledGrams * ing.proteinPer100g) / 100),
        fat: Math.round((scaledGrams * ing.fatPer100g) / 100),
        carb: Math.round((scaledGrams * ing.carbPer100g) / 100)
      };
    });

    if (!hasIngredientsInInventory) continue;

    // Deterministic Batching Decision: Should we cook 1 portion or 2 portions?
    // If recipe is batchable and we have enough ingredients for 2 portions, default to 2!
    let portionsToCook = 1;
    if (recipe.isBatchable) {
      const canSupportTwoPortions = scaledIngredients.every(ing => {
        const inStock = inventory.find(inv => inv.name.toLowerCase() === ing.productName.toLowerCase());
        return inStock && inStock.quantityGrams >= ing.scaledGrams * 2;
      });
      if (canSupportTwoPortions) {
        portionsToCook = 2;
      }
    }

    // Multiply ingredient grams if portionsToCook === 2
    const finalIngredients = scaledIngredients.map(ing => ({
      ...ing,
      scaledGrams: ing.scaledGrams * portionsToCook,
      calories: ing.calories * portionsToCook,
      protein: ing.protein * portionsToCook,
      fat: ing.fat * portionsToCook,
      carb: ing.carb * portionsToCook
    }));

    const totalCalories = finalIngredients.reduce((sum, i) => sum + i.calories, 0);
    const totalProtein = finalIngredients.reduce((sum, i) => sum + i.protein, 0);
    const totalFat = finalIngredients.reduce((sum, i) => sum + i.fat, 0);
    const totalCarb = finalIngredients.reduce((sum, i) => sum + i.carb, 0);

    options.push({
      recipe,
      targetMealCalories: targetCalories,
      portionsToCook,
      scaledIngredients: finalIngredients,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarb
    });

    if (options.length >= 4) break; // Limit to top 3-4 options
  }

  return options;
}
