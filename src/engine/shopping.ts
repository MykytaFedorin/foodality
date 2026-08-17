import { InventoryItem, UserProfile } from '../db';
import { Recipe } from '../db/initialData';

export interface ShoppingItem {
  id: string;
  name: string;
  category: 'Мясо и Рыба' | 'Овощи и Фрукты' | 'Молочные продукты' | 'Крупы и Бакалея' | 'Масла и Соусы';
  requiredAmount: number;
  existingAmount: number;
  toBuyAmount: number;
  packageCount: number;
  packageDescription: string;
  unit: 'g' | 'ml' | 'pcs';
  isChecked: boolean;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
}

export function generateShoppingList(
  days: number,
  profile: UserProfile,
  _recipes: Recipe[],
  currentInventory: InventoryItem[]
): ShoppingItem[] {
  const totalTargetCalories = days * profile.targetCalories;
  
  // Categorical calorie ratios
  // Protein: 30%, Carbs: 45%, Vegetables/Fiber: 10%, Dairy/Fats: 15%
  const proteinCalTarget = totalTargetCalories * 0.30;
  const carbCalTarget = totalTargetCalories * 0.45;
  const vegCalTarget = totalTargetCalories * 0.10;
  const fatCalTarget = totalTargetCalories * 0.15;

  const rawNeededGrams: Record<string, { amount: number; unit: 'g' | 'ml' | 'pcs'; category: ShoppingItem['category']; c: number; p: number; f: number; carb: number }> = {
    'Куриное филе': { amount: Math.round((proteinCalTarget * 0.6) / (165 / 100)), unit: 'g', category: 'Мясо и Рыба', c: 165, p: 31, f: 3.6, carb: 0 },
    'Филе индейки': { amount: Math.round((proteinCalTarget * 0.4) / (130 / 100)), unit: 'g', category: 'Мясо и Рыба', c: 130, p: 25, f: 2.5, carb: 0 },
    'Гречка': { amount: Math.round((carbCalTarget * 0.4) / (343 / 100)), unit: 'g', category: 'Крупы и Бакалея', c: 343, p: 13, f: 3.4, carb: 72 },
    'Рис басмати': { amount: Math.round((carbCalTarget * 0.3) / (345 / 100)), unit: 'g', category: 'Крупы и Бакалея', c: 345, p: 7.5, f: 0.6, carb: 78 },
    'Макароны твердых сортов': { amount: Math.round((carbCalTarget * 0.3) / (350 / 100)), unit: 'g', category: 'Крупы и Бакалея', c: 350, p: 12, f: 1.5, carb: 71 },
    'Огурцы свежие': { amount: Math.round((vegCalTarget * 0.5) / (15 / 100)), unit: 'g', category: 'Овощи и Фрукты', c: 15, p: 0.8, f: 0.1, carb: 3 },
    'Помидоры': { amount: Math.round((vegCalTarget * 0.5) / (18 / 100)), unit: 'g', category: 'Овощи и Фрукты', c: 18, p: 0.9, f: 0.2, carb: 3.9 },
    'Яйца куриные': { amount: Math.round(days * 2.5), unit: 'pcs', category: 'Молочные продукты', c: 157, p: 12.7, f: 11.5, carb: 0.7 },
    'Сыр Твердый': { amount: Math.round((fatCalTarget * 0.5) / (360 / 100)), unit: 'g', category: 'Молочные продукты', c: 360, p: 26, f: 28, carb: 0 },
    'Оливковое масло': { amount: Math.round((fatCalTarget * 0.5) / (884 / 100)), unit: 'ml', category: 'Масла и Соусы', c: 884, p: 0, f: 100, carb: 0 }
  };

  const result: ShoppingItem[] = [];

  for (const [name, meta] of Object.entries(rawNeededGrams)) {
    // 1. Deduct existing inventory
    const existing = currentInventory.find(inv => inv.name.toLowerCase() === name.toLowerCase());
    const existingAmount = existing ? existing.quantityGrams : 0;
    const netToBuy = Math.max(0, meta.amount - existingAmount);

    if (netToBuy <= 0) continue;

    // 2. Packaging Quantization
    let packageSize = 500;
    let packageUnitStr = 'пачек по 500г';

    if (meta.unit === 'pcs') {
      packageSize = 10; // Eggs 10 pcs
      packageUnitStr = 'десятков (10 шт)';
    } else if (meta.category === 'Мясо и Рыба') {
      packageSize = 400; // Meat 400g packs
      packageUnitStr = 'упак. по 400г';
    } else if (meta.category === 'Масла и Соусы') {
      packageSize = 500; // Oil 500ml bottles
      packageUnitStr = 'бутылка 500мл';
    }

    const packageCount = Math.ceil(netToBuy / packageSize);
    const finalToBuy = packageCount * packageSize;

    result.push({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      category: meta.category,
      requiredAmount: meta.amount,
      existingAmount,
      toBuyAmount: finalToBuy,
      packageCount,
      packageDescription: `${packageCount} ${packageUnitStr} (${finalToBuy} ${meta.unit})`,
      unit: meta.unit,
      isChecked: false,
      caloriesPer100g: meta.c,
      proteinPer100g: meta.p,
      fatPer100g: meta.f,
      carbPer100g: meta.carb
    });
  }

  return result;
}
