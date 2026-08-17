import { Recipe, RecipeIngredient } from '../db/initialData';

interface MealDBItem {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: any;
}

// English to Russian ingredient translation dictionary
const EN_TO_RU_INGREDIENT: Record<string, string> = {
  // Grains & Flour
  flour: 'Пшеничная мука',
  'all purpose flour': 'Пшеничная мука',
  'plain flour': 'Пшеничная мука',
  'baking powder': 'Разрыхлитель',
  'baking soda': 'Сода пищевая',
  rice: 'Рис басмати',
  pasta: 'Макароны твердых сортов',
  spaghetti: 'Спагетти',
  macaroni: 'Макароны',
  noodle: 'Лапша',
  noodles: 'Лапша',
  oats: 'Овсяные хлопья',
  oatmeal: 'Овсянка',

  // Dairy & Eggs
  egg: 'Яйца куриные',
  eggs: 'Яйца куриные',
  milk: 'Молоко 2.5%',
  butter: 'Сливочное масло 82.5%',
  cheese: 'Сыр Твердый',
  cheddar: 'Сыр Чеддер',
  mozzarella: 'Сыр Моцарелла',
  parmesan: 'Сыр Пармезан',
  curd: 'Творог 5%',
  'cottage cheese': 'Творог 5%',
  cream: 'Сливки 20%',
  'sour cream': 'Сметана 15%',

  // Meat & Poultry
  chicken: 'Куриное филе',
  beef: 'Говядина постная',
  pork: 'Свинина постная',
  turkey: 'Филе индейки',
  bacon: 'Бекон',
  sausage: 'Колбаски',
  mince: 'Фарш мясной',
  'ground beef': 'Фарш из говядины',

  // Seafood
  salmon: 'Филе лосося',
  fish: 'Филе рыбы',
  tuna: 'Тунец',
  shrimp: 'Креветки',
  prawns: 'Креветки',

  // Vegetables & Herbs
  potato: 'Картофель',
  potatoes: 'Картофель',
  onion: 'Репчатый лук',
  onions: 'Репчатый лук',
  garlic: 'Чеснок',
  ginger: 'Имбирь',
  tomato: 'Помидоры',
  tomatoes: 'Помидоры',
  cucumber: 'Огурцы свежие',
  pepper: 'Болгарский перец',
  carrot: 'Морковь',
  carrots: 'Морковь',
  zucchini: 'Кабачки',
  broccoli: 'Брокколи',
  spinach: 'Шпинат',
  mushroom: 'Шампиньоны',
  mushrooms: 'Шампиньоны',
  parsley: 'Петрушка',
  coriander: 'Кинза / Кориандр',
  basil: 'Базилик',
  lemon: 'Лимон',
  lime: 'Лайм',

  // Oils & Condiments
  oil: 'Оливковое масло',
  'olive oil': 'Оливковое масло',
  'vegetable oil': 'Растительное масло',
  salt: 'Соль и Специи',
  sugar: 'Сахар',
  honey: 'Мед',
  'soy sauce': 'Соевый соус',
  vinegar: 'Уксус',
  water: 'Вода'
};

// Russian to English search term mapping for API calls
const RU_TO_EN_SEARCH: Record<string, string> = {
  яйц: 'egg',
  куриц: 'chicken',
  индейк: 'turkey',
  говядин: 'beef',
  свинин: 'pork',
  фарш: 'mince',
  рис: 'rice',
  макарон: 'pasta',
  спагетти: 'spaghetti',
  сыр: 'cheese',
  молок: 'milk',
  творог: 'cheese',
  сметан: 'cream',
  гречк: 'grain',
  овсян: 'oats',
  картофел: 'potato',
  рыб: 'fish',
  масло: 'oil',
  мука: 'flour'
};

const MACRO_LOOKUP: Record<string, { c: number; p: number; f: number; carb: number; category: 'fridge' | 'pantry' }> = {
  chicken: { c: 165, p: 31, f: 3.6, carb: 0, category: 'fridge' },
  beef: { c: 187, p: 19, f: 12, carb: 0, category: 'fridge' },
  pork: { c: 242, p: 17, f: 19, carb: 0, category: 'fridge' },
  turkey: { c: 130, p: 25, f: 2.5, carb: 0, category: 'fridge' },
  egg: { c: 157, p: 12.7, f: 11.5, carb: 0.7, category: 'fridge' },
  eggs: { c: 157, p: 12.7, f: 11.5, carb: 0.7, category: 'fridge' },
  milk: { c: 54, p: 2.9, f: 2.5, carb: 4.8, category: 'fridge' },
  rice: { c: 345, p: 7.5, f: 0.6, carb: 78, category: 'pantry' },
  pasta: { c: 350, p: 12, f: 1.5, carb: 71, category: 'pantry' },
  flour: { c: 364, p: 10, f: 1, carb: 76, category: 'pantry' },
  cheese: { c: 360, p: 26, f: 28, carb: 0, category: 'fridge' },
  butter: { c: 748, p: 0.6, f: 82.5, carb: 0.8, category: 'fridge' },
  oil: { c: 884, p: 0, f: 100, carb: 0, category: 'pantry' },
  potato: { c: 77, p: 2, f: 0.4, carb: 16.3, category: 'pantry' },
  tomato: { c: 18, p: 0.9, f: 0.2, carb: 3.9, category: 'fridge' }
};

const apiCache = new Map<string, Promise<Recipe[]>>();

export function fetchLiveRecipesFromAPI(searchQuery: string = 'egg'): Promise<Recipe[]> {
  const queryKey = searchQuery.toLowerCase().trim();
  if (apiCache.has(queryKey)) {
    return apiCache.get(queryKey)!;
  }

  const fetchPromise = (async (): Promise<Recipe[]> => {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(queryKey)}`);
      const data = await res.json();

      if (!data.meals || !Array.isArray(data.meals)) {
        return [];
      }

      return data.meals.slice(0, 10).map((meal: MealDBItem) => {
        const ingredients: RecipeIngredient[] = [];

        for (let i = 1; i <= 20; i++) {
          const ingName = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];

          if (ingName && ingName.trim().length > 0) {
            const cleanName = ingName.trim();
            const lowerName = cleanName.toLowerCase();

            // Translate English API ingredient to Russian for fridge matching
            let russianName = cleanName;
            for (const [enKey, ruVal] of Object.entries(EN_TO_RU_INGREDIENT)) {
              if (lowerName.includes(enKey)) {
                russianName = ruVal;
                break;
              }
            }

            let macro: { c: number; p: number; f: number; carb: number; category: 'fridge' | 'pantry' } = { c: 150, p: 10, f: 5, carb: 15, category: 'fridge' };
            for (const [key, val] of Object.entries(MACRO_LOOKUP)) {
              if (lowerName.includes(key)) {
                macro = val;
                break;
              }
            }

            let defaultGrams = 100;
            if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) {
              defaultGrams = 3;
            } else if (lowerName.includes('oil') || lowerName.includes('butter')) {
              defaultGrams = 10;
            } else if (lowerName.includes('water')) {
              defaultGrams = 150;
            } else if (measure) {
              const numMatch = measure.match(/(\d+)/);
              if (numMatch) {
                defaultGrams = Math.min(300, Math.max(20, parseInt(numMatch[1], 10)));
              }
            }

            // Deduplicate if ingredient name already exists in this recipe
            const existingIng = ingredients.find(i => i.productName === russianName);
            if (!existingIng) {
              ingredients.push({
                productId: `api-ing-${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
                productName: russianName,
                defaultGrams,
                caloriesPer100g: macro.c,
                proteinPer100g: macro.p,
                fatPer100g: macro.f,
                carbPer100g: macro.carb,
                category: macro.category
              });
            }
          }
        }

        const instructions = meal.strInstructions 
          ? meal.strInstructions.split('\r\n').filter(s => s.trim().length > 0)
          : ['Приготовить по рецепту.'];

        return {
          id: `mealdb-${meal.idMeal}`,
          title: meal.strMeal,
          category: (meal.strCategory && meal.strCategory.toUpperCase().includes('BREAKFAST')) ? 'BREAKFAST' : 'LUNCH',
          isBatchable: true,
          prepTimeMin: 20,
          imageUrl: meal.strMealThumb,
          ingredients,
          instructions
        };
      });
    } catch (err) {
      console.warn('TheMealDB API fetch warning:', err);
      return [];
    }
  })();

  apiCache.set(queryKey, fetchPromise);
  return fetchPromise;
}

export async function fetchLiveAPIRecipesForInventory(inventoryNames: string[]): Promise<Recipe[]> {
  const allFetchedRecipes: Recipe[] = [];

  const searchTerms = new Set<string>();

  for (const name of inventoryNames) {
    const lower = name.toLowerCase();
    for (const [ru, en] of Object.entries(RU_TO_EN_SEARCH)) {
      if (lower.includes(ru)) {
        searchTerms.add(en);
      }
    }
  }

  if (searchTerms.size === 0) {
    searchTerms.add('egg');
  }

  const fetchPromises = Array.from(searchTerms).map(term => fetchLiveRecipesFromAPI(term));
  const results = await Promise.all(fetchPromises);

  for (const list of results) {
    for (const recipe of list) {
      if (!allFetchedRecipes.some(r => r.id === recipe.id)) {
        allFetchedRecipes.push(recipe);
      }
    }
  }

  return allFetchedRecipes;
}
