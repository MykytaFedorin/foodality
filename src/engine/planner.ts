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
    if (!profile.blacklist || profile.blacklist.length === 0) return true;

    // Check if recipe title matches blacklisted term
    const titleMatch = profile.blacklist.some(b => {
      const term = b.trim().toLowerCase();
      return term.length > 0 && recipe.title.toLowerCase().includes(term);
    });
    if (titleMatch) return false;

    // Check if any ingredient matches blacklisted term
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
    // Calculate raw recipe default total calories
    const baseCalories = recipe.ingredients.reduce((acc, ing) => {
      return acc + (ing.defaultGrams * ing.caloriesPer100g) / 100;
    }, 0);

    if (baseCalories === 0) continue;

    // Scale multiplier to hit target calories
    const scaleFactor = targetCalories / baseCalories;

    // Check if inventory has ingredients
    let hasIngredientsInInventory = true;
    let mainFridgeIngredientCount = 0;

    const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map(ing => {
      let scaledGrams = Math.round(ing.defaultGrams * scaleFactor);

      // Smart weight caps for non-caloric/low-caloric staples so salt/sugar/spices never scale to 45g!
      const lowerName = ing.productName.toLowerCase();
      if (lowerName.includes('соль') || lowerName.includes('специ') || lowerName.includes('перец') || lowerName.includes('salt') || lowerName.includes('spice')) {
        scaledGrams = 3; // Max 3g of salt/spices per portion
      } else if (lowerName.includes('сахар') || lowerName.includes('sugar')) {
        scaledGrams = 5; // Max 5g of sugar per portion
      } else if (lowerName.includes('чеснок') || lowerName.includes('имбирь') || lowerName.includes('garlic') || lowerName.includes('ginger')) {
        scaledGrams = 5; // Max 5g garlic/ginger
      } else if (lowerName.includes('лук') || lowerName.includes('onion')) {
        scaledGrams = 25; // Max 25g onion
      } else if (lowerName.includes('масло') || lowerName.includes('oil')) {
        scaledGrams = Math.min(15, Math.max(5, scaledGrams)); // 5-15g oil
      } else if (lowerName.includes('вода') || lowerName.includes('water')) {
        scaledGrams = 150; // 150g water
      }
      
      // Flexible inventory matching (e.g. "Яйца" matching "Яйца куриные")
      const inStock = inventory.find(inv => {
        const invName = inv.name.toLowerCase().trim();
        const ingName = ing.productName.toLowerCase().trim();
        return invName === ingName || invName.includes(ingName) || ingName.includes(invName);
      });

      const isStapleOrOptional = ing.category === 'pantry' || 
        ['water', 'salt', 'pepper', 'oil', 'flour', 'spices', 'spice', 'garlic', 'onion', 'ginger', 'sugar', 'vinegar', 'sauce', 'herb', 'parsley', 'coriander', 'turmeric', 'butter', 'cream', 'chives', 'oregano', 'basil', 'chili', 'paprika', 'mustard', 'вода', 'соль', 'перец', 'масло', 'специи', 'сахар', 'чеснок', 'лук', 'зелень', 'соус', 'мука', 'укроп', 'петрушка'].some(s => ing.productName.toLowerCase().includes(s));

      if (inStock && !isStapleOrOptional) {
        mainFridgeIngredientCount++;
      }

      if (!inStock) {
        if (!isStapleOrOptional) {
          hasIngredientsInInventory = false;
        }
      } else {
        // Unit-aware stock check: If item is measured in pieces (e.g. eggs @ 50g per egg)
        const isPieceUnit = inStock.unit === 'pcs' || inStock.name.toLowerCase().includes('яйц');
        const requiredAmount = isPieceUnit ? Math.ceil(scaledGrams / 50) : (scaledGrams * 0.5);

        if (inStock.quantityGrams < requiredAmount) {
          hasIngredientsInInventory = false;
        }
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
        const inStock = inventory.find(inv => {
          const invName = inv.name.toLowerCase().trim();
          const ingName = ing.productName.toLowerCase().trim();
          return invName === ingName || invName.includes(ingName) || ingName.includes(invName);
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
  }

  // Sort options by how many main fridge ingredients they utilize (best utilization first!), keeping reheat options at top!
  options.sort((a, b) => {
    if (a.isReheatOption) return -1;
    if (b.isReheatOption) return 1;
    const aUsed = a.scaledIngredients.filter(ing => inventory.some(inv => inv.name.toLowerCase().includes(ing.productName.toLowerCase()))).length;
    const bUsed = b.scaledIngredients.filter(ing => inventory.some(inv => inv.name.toLowerCase().includes(ing.productName.toLowerCase()))).length;
    return bUsed - aUsed;
  });

  return options.slice(0, 4);
}
