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
  // Custom availability rating fields based on inventory
  availabilityMatchPercent: number; // 0..100%
  customAvailabilityRating: number; // 1.0..5.0
  inStockCount: number;
  totalIngredientCount: number;
  missingIngredients: string[];
}

export function calculateMealTargetCalories(profile: UserProfile, eatenCaloriesToday: number = 0): number {
  const remainingToday = Math.max(200, profile.targetCalories - eatenCaloriesToday);
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
        rating: 5.0,
        reviewCount: 1,
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
      cookedMealId: availableCooked.id,
      availabilityMatchPercent: 100,
      customAvailabilityRating: 5.0,
      inStockCount: 0,
      totalIngredientCount: 0,
      missingIngredients: []
    });
  }

  // 2. Filter recipes against user Blacklist
  const validRecipes = recipes.filter(recipe => {
    if (!profile.blacklist || profile.blacklist.length === 0) return true;

    const titleMatch = profile.blacklist.some(b => {
      const term = b.trim().toLowerCase();
      return term.length > 0 && recipe.title.toLowerCase().includes(term);
    });
    if (titleMatch) return false;

    const ingredientMatch = recipe.ingredients.some(ing => 
      profile.blacklist.some(b => {
        const term = b.trim().toLowerCase();
        const ingName = ing.productName.toLowerCase();
        return term.length > 0 && (ingName.includes(term) || term.includes(ingName));
      })
    );

    return !ingredientMatch;
  });

  // 3. Score and scale candidate recipes based on available inventory
  for (const recipe of validRecipes) {
    const baseCalories = recipe.ingredients.reduce((acc, ing) => {
      return acc + (ing.defaultGrams * ing.caloriesPer100g) / 100;
    }, 0);

    if (baseCalories === 0) continue;

    const scaleFactor = targetCalories / baseCalories;

    let inStockCount = 0;
    const missingIngredients: string[] = [];

    const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map(ing => {
      let scaledGrams = Math.round(ing.defaultGrams * scaleFactor);

      const lowerName = ing.productName.toLowerCase();
      if (lowerName.includes('куриц') || lowerName.includes('говядин') || lowerName.includes('свинин') || lowerName.includes('рыб') || lowerName.includes('фарш') || lowerName.includes('индейк')) {
        scaledGrams = Math.max(120, scaledGrams);
      } else if (lowerName.includes('рис') || lowerName.includes('макарон') || lowerName.includes('картофел') || lowerName.includes('гречк')) {
        scaledGrams = Math.max(80, scaledGrams);
      } else if (lowerName.includes('соль') || lowerName.includes('специ') || lowerName.includes('перец') || lowerName.includes('salt') || lowerName.includes('spice')) {
        scaledGrams = 3;
      } else if (lowerName.includes('сахар') || lowerName.includes('sugar')) {
        scaledGrams = 5;
      } else if (lowerName.includes('чеснок') || lowerName.includes('имбирь') || lowerName.includes('garlic') || lowerName.includes('ginger')) {
        scaledGrams = 5;
      } else if (lowerName.includes('лук') || lowerName.includes('onion')) {
        scaledGrams = 25;
      } else if (lowerName.includes('масло') || lowerName.includes('oil')) {
        scaledGrams = Math.min(15, Math.max(5, scaledGrams));
      } else if (lowerName.includes('вода') || lowerName.includes('water')) {
        scaledGrams = 150;
      }
      
      const inStock = inventory.find(inv => {
        const invName = inv.name.toLowerCase().trim();
        const ingName = ing.productName.toLowerCase().trim();
        return (invName === ingName || invName.includes(ingName) || ingName.includes(invName)) && inv.quantityGrams > 0;
      });

      const isStapleOrOptional = ing.category === 'pantry' || 
        ['water', 'salt', 'pepper', 'oil', 'flour', 'spices', 'spice', 'garlic', 'onion', 'ginger', 'sugar', 'vinegar', 'sauce', 'herb', 'parsley', 'coriander', 'turmeric', 'butter', 'cream', 'chives', 'oregano', 'basil', 'chili', 'paprika', 'mustard', 'вода', 'соль', 'перец', 'масло', 'специи', 'сахар', 'чеснок', 'лук', 'зелень', 'соус', 'мука', 'укроп', 'петрушка'].some(s => ing.productName.toLowerCase().includes(s));

      if (inStock || isStapleOrOptional) {
        inStockCount++;
      } else {
        missingIngredients.push(ing.productName);
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

    const totalIngredientCount = recipe.ingredients.length;
    const availabilityMatchPercent = totalIngredientCount > 0 
      ? Math.round((inStockCount / totalIngredientCount) * 100) 
      : 100;

    const customAvailabilityRating = Math.max(1, Number(((availabilityMatchPercent / 100) * 5).toFixed(1)));

    let portionsToCook = 1;
    if (recipe.isBatchable) {
      const canSupportTwoPortions = scaledIngredients.every(ing => {
        const inStock = inventory.find(inv => {
          const invName = inv.name.toLowerCase().trim();
          const ingName = ing.productName.toLowerCase().trim();
          return (invName === ingName || invName.includes(ingName) || ingName.includes(invName));
        });
        if (!inStock) return false;
        const isPieceUnit = inStock.unit === 'pcs' || inStock.name.toLowerCase().includes('яйц');
        const requiredAmount = isPieceUnit ? Math.ceil((ing.scaledGrams * 2) / 50) : (ing.scaledGrams * 2);
        return inStock.quantityGrams >= requiredAmount;
      });
      if (canSupportTwoPortions) {
        portionsToCook = 2;
      }
    }

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
      totalCarb,
      availabilityMatchPercent,
      customAvailabilityRating,
      inStockCount,
      totalIngredientCount,
      missingIngredients
    });
  }

  // Sort options: 1) Reheat options first, 2) Highest availability match %, 3) Highest public recipe rating
  options.sort((a, b) => {
    if (a.isReheatOption) return -1;
    if (b.isReheatOption) return 1;
    if (b.availabilityMatchPercent !== a.availabilityMatchPercent) {
      return b.availabilityMatchPercent - a.availabilityMatchPercent;
    }
    return (b.recipe.rating || 0) - (a.recipe.rating || 0);
  });

  return options;
}
