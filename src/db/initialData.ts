export interface RecipeIngredient {
  productId: string;
  productName: string;
  defaultGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  category: 'fridge' | 'pantry';
}

export interface Recipe {
  id: string;
  title: string;
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  isBatchable: boolean;
  prepTimeMin: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export const INITIAL_STAPLES = [
  // Крупы и каши
  { name: 'Гречка', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 343, p: 13, f: 3.4, carb: 72 },
  { name: 'Рис басмати', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 345, p: 7.5, f: 0.6, carb: 78 },
  { name: 'Рис круглозерный', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 340, p: 6.5, f: 0.7, carb: 79 },
  { name: 'Овсяные хлопья', category: 'pantry' as const, defaultQty: 800, unit: 'g' as const, c: 366, p: 11.9, f: 7.2, carb: 69 },
  { name: 'Булгур', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 342, p: 12.3, f: 1.3, carb: 76 },
  { name: 'Кускус', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 376, p: 12.8, f: 0.6, carb: 77 },
  { name: 'Перловка', category: 'pantry' as const, defaultQty: 800, unit: 'g' as const, c: 320, p: 9.3, f: 1.1, carb: 73 },
  { name: 'Пшено', category: 'pantry' as const, defaultQty: 800, unit: 'g' as const, c: 348, p: 11.5, f: 3.3, carb: 69 },

  // Макароны и бобовые
  { name: 'Макароны твердых сортов', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 350, p: 12, f: 1.5, carb: 71 },
  { name: 'Спагетти', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 350, p: 12, f: 1.5, carb: 71 },
  { name: 'Чечевица красная', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 314, p: 21.6, f: 1.1, carb: 48 },
  { name: 'Нут', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 364, p: 19, f: 6, carb: 61 },
  { name: 'Фасоль консервированная', category: 'pantry' as const, defaultQty: 400, unit: 'g' as const, c: 90, p: 6, f: 0.5, carb: 15 },

  // Мясо и птица
  { name: 'Куриное филе', category: 'fridge' as const, defaultQty: 800, unit: 'g' as const, c: 165, p: 31, f: 3.6, carb: 0 },
  { name: 'Бедро куриное (без кожи)', category: 'fridge' as const, defaultQty: 800, unit: 'g' as const, c: 185, p: 20, f: 11, carb: 0 },
  { name: 'Филе индейки', category: 'fridge' as const, defaultQty: 600, unit: 'g' as const, c: 130, p: 25, f: 2.5, carb: 0 },
  { name: 'Говядина постная', category: 'fridge' as const, defaultQty: 600, unit: 'g' as const, c: 187, p: 19, f: 12, carb: 0 },
  { name: 'Фарш говяжий', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 254, p: 17.2, f: 20, carb: 0 },
  { name: 'Фарш куриный', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 143, p: 17.4, f: 8.1, carb: 0 },

  // Рыба и морепродукты
  { name: 'Филе лосося', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 208, p: 20, f: 13, carb: 0 },
  { name: 'Филе трески', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 82, p: 18, f: 0.7, carb: 0 },
  { name: 'Тунец консервированный в с/с', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 96, p: 23, f: 0.5, carb: 0 },
  { name: 'Креветки', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 99, p: 24, f: 0.3, carb: 0 },

  // Молочные продукты и сыры
  { name: 'Яйца куриные', category: 'fridge' as const, defaultQty: 10, unit: 'pcs' as const, c: 157, p: 12.7, f: 11.5, carb: 0.7 },
  { name: 'Творог 5%', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 121, p: 17, f: 5, carb: 3 },
  { name: 'Творог 0%', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 71, p: 18, f: 0.2, carb: 3.3 },
  { name: 'Сыр Твердый', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 360, p: 26, f: 28, carb: 0 },
  { name: 'Сыр Моцарелла', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 280, p: 28, f: 17, carb: 3.1 },
  { name: 'Сыр Фета', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 264, p: 14, f: 21, carb: 4 },
  { name: 'Сметана 15%', category: 'fridge' as const, defaultQty: 300, unit: 'g' as const, c: 160, p: 2.6, f: 15, carb: 3.6 },
  { name: 'Молоко 2.5%', category: 'fridge' as const, defaultQty: 1000, unit: 'ml' as const, c: 54, p: 2.9, f: 2.5, carb: 4.8 },
  { name: 'Йогурт греческий 2%', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 60, p: 9, f: 2, carb: 3.5 },
  { name: 'Сливочное масло 82.5%', category: 'fridge' as const, defaultQty: 180, unit: 'g' as const, c: 748, p: 0.6, f: 82.5, carb: 0.8 },

  // Овощи, зелень и картофель
  { name: 'Огурцы свежие', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 15, p: 0.8, f: 0.1, carb: 3 },
  { name: 'Помидоры', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 18, p: 0.9, f: 0.2, carb: 3.9 },
  { name: 'Болгарский перец', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 27, p: 1.3, f: 0.3, carb: 5.3 },
  { name: 'Брокколи', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 34, p: 2.8, f: 0.4, carb: 6.6 },
  { name: 'Цветная капуста', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 25, p: 2, f: 0.3, carb: 5 },
  { name: 'Кабачки', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 17, p: 1.2, f: 0.2, carb: 3.1 },
  { name: 'Баклажаны', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 25, p: 1, f: 0.2, carb: 5.8 },
  { name: 'Морковь', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 35, p: 1.3, f: 0.1, carb: 6.9 },
  { name: 'Лук репчатый', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 41, p: 1.4, f: 0.2, carb: 8.2 },
  { name: 'Чеснок', category: 'pantry' as const, defaultQty: 100, unit: 'g' as const, c: 149, p: 6.5, f: 0.5, carb: 33 },
  { name: 'Картофель', category: 'pantry' as const, defaultQty: 1500, unit: 'g' as const, c: 77, p: 2, f: 0.4, carb: 16.3 },
  { name: 'Шпинат свежий', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 23, p: 2.9, f: 0.4, carb: 3.6 },
  { name: 'Зелень (укроп/петрушка)', category: 'fridge' as const, defaultQty: 100, unit: 'g' as const, c: 38, p: 3, f: 0.5, carb: 6 },

  // Фрукты и орехи
  { name: 'Яблоки', category: 'fridge' as const, defaultQty: 1000, unit: 'g' as const, c: 52, p: 0.4, f: 0.4, carb: 11.4 },
  { name: 'Бананы', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 89, p: 1.1, f: 0.3, carb: 22.8 },
  { name: 'Апельсины', category: 'fridge' as const, defaultQty: 1000, unit: 'g' as const, c: 47, p: 0.9, f: 0.2, carb: 11.8 },
  { name: 'Лимон', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 29, p: 1.1, f: 0.3, carb: 9 },
  { name: 'Арахис', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 567, p: 26, f: 49, carb: 16 },
  { name: 'Миндаль', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 579, p: 21, f: 50, carb: 22 },

  // Масла, соусы и специи
  { name: 'Оливковое масло', category: 'pantry' as const, defaultQty: 500, unit: 'ml' as const, c: 884, p: 0, f: 100, carb: 0 },
  { name: 'Подсолнечное масло', category: 'pantry' as const, defaultQty: 1000, unit: 'ml' as const, c: 884, p: 0, f: 100, carb: 0 },
  { name: 'Соевый соус', category: 'pantry' as const, defaultQty: 250, unit: 'ml' as const, c: 53, p: 5.6, f: 0, carb: 4.9 },
  { name: 'Томатная паста', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 82, p: 4.8, f: 0.5, carb: 15 },
  { name: 'Соль и Специи', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 0, p: 0, f: 0, carb: 0 },
  { name: 'Мука пшеничная', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 364, p: 10.3, f: 1, carb: 76 }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'chicken-buckwheat-salad',
    title: 'Сочное куриное филе с гречкой и фитнес-салатом',
    category: 'LUNCH',
    isBatchable: true,
    prepTimeMin: 20,
    rating: 4.9,
    reviewCount: 184,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'chicken', productName: 'Куриное филе', defaultGrams: 180, caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbPer100g: 0, category: 'fridge' },
      { productId: 'buckwheat', productName: 'Гречка', defaultGrams: 80, caloriesPer100g: 343, proteinPer100g: 13, fatPer100g: 3.4, carbPer100g: 72, category: 'pantry' },
      { productId: 'cucumber', productName: 'Огурцы свежие', defaultGrams: 100, caloriesPer100g: 15, proteinPer100g: 0.8, fatPer100g: 0.1, carbPer100g: 3, category: 'fridge' },
      { productId: 'tomato', productName: 'Помидоры', defaultGrams: 100, caloriesPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbPer100g: 3.9, category: 'fridge' },
      { productId: 'olive_oil', productName: 'Оливковое масло', defaultGrams: 10, caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbPer100g: 0, category: 'pantry' }
    ],
    instructions: [
      'Отварить гречку в слегка подсоленной воде (15 минут).',
      'Нарезать куриное филе ломтиками и обжарить на антипригарной сковороде с 5г масла.',
      'Нарезать огурец и помидор, заправить оставшимся маслом.',
      'Подать курицу с гречкой и свежими овощами.'
    ]
  },
  {
    id: 'scrambled-eggs-toast',
    title: 'Пышный скрэмбл с сыром и томатами',
    category: 'BREAKFAST',
    isBatchable: false,
    prepTimeMin: 10,
    rating: 4.8,
    reviewCount: 96,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'eggs', productName: 'Яйца куриные', defaultGrams: 150, caloriesPer100g: 157, proteinPer100g: 12.7, fatPer100g: 11.5, carbPer100g: 0.7, category: 'fridge' },
      { productId: 'cheese', productName: 'Сыр Твердый', defaultGrams: 40, caloriesPer100g: 360, proteinPer100g: 26, fatPer100g: 28, carbPer100g: 0, category: 'fridge' },
      { productId: 'tomato', productName: 'Помидоры', defaultGrams: 100, caloriesPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbPer100g: 3.9, category: 'fridge' },
      { productId: 'olive_oil', productName: 'Оливковое масло', defaultGrams: 8, caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbPer100g: 0, category: 'pantry' }
    ],
    instructions: [
      'Взбить яйца щепоткой соли.',
      'Разогреть сковороду с оливковым маслом, вылить яичную смесь.',
      'Помешивать лопаткой на умеренном огне до нежной текстуры скрэмбла.',
      'Посыпать тертым сыром и подать со свежими томатами.'
    ]
  },
  {
    id: 'turkey-rice-bowl',
    title: 'Нежное филе индейки с рисом Басмати и перцем',
    category: 'DINNER',
    isBatchable: true,
    prepTimeMin: 25,
    rating: 4.9,
    reviewCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'turkey', productName: 'Филе индейки', defaultGrams: 190, caloriesPer100g: 130, proteinPer100g: 25, fatPer100g: 2.5, carbPer100g: 0, category: 'fridge' },
      { productId: 'rice', productName: 'Рис басмати', defaultGrams: 75, caloriesPer100g: 345, proteinPer100g: 7.5, fatPer100g: 0.6, carbPer100g: 78, category: 'pantry' },
      { productId: 'pepper', productName: 'Болгарский перец', defaultGrams: 120, caloriesPer100g: 27, proteinPer100g: 1.3, fatPer100g: 0.3, carbPer100g: 5.3, category: 'fridge' },
      { productId: 'olive_oil', productName: 'Оливковое масло', defaultGrams: 10, caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbPer100g: 0, category: 'pantry' }
    ],
    instructions: [
      'Промыть рис и отварить до готовности (12 минут).',
      'Индейку и болгарский перец нарезать соломкой.',
      'Обжарить индейку с перцем на оливковом масле 8-10 минут.',
      'Соединить с рисом и подать горячим.'
    ]
  },
  {
    id: 'pasta-chicken-cheese',
    title: 'Итальянская паста с курицей и тертым пармезаном',
    category: 'LUNCH',
    isBatchable: true,
    prepTimeMin: 18,
    rating: 4.7,
    reviewCount: 145,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'pasta', productName: 'Макароны твердых сортов', defaultGrams: 85, caloriesPer100g: 350, proteinPer100g: 12, fatPer100g: 1.5, carbPer100g: 71, category: 'pantry' },
      { productId: 'chicken', productName: 'Куриное филе', defaultGrams: 160, caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbPer100g: 0, category: 'fridge' },
      { productId: 'cheese', productName: 'Сыр Твердый', defaultGrams: 30, caloriesPer100g: 360, proteinPer100g: 26, fatPer100g: 28, carbPer100g: 0, category: 'fridge' },
      { productId: 'olive_oil', productName: 'Оливковое масло', defaultGrams: 10, caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbPer100g: 0, category: 'pantry' }
    ],
    instructions: [
      'Отварить макароны al dente.',
      'Куриное филе нарезать кубиками и обжарить на масле со специями.',
      'Смешать пасту с курицей и посыпать сыром.'
    ]
  },
  {
    id: 'cottage-cheese-oats-bowl',
    title: 'Белковый творожный боул с овсянкой',
    category: 'BREAKFAST',
    isBatchable: false,
    prepTimeMin: 5,
    rating: 4.6,
    reviewCount: 78,
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'cottage_cheese', productName: 'Творог 5%', defaultGrams: 200, caloriesPer100g: 121, proteinPer100g: 17, fatPer100g: 5, carbPer100g: 3, category: 'fridge' },
      { productId: 'oats', productName: 'Овсяные хлопья', defaultGrams: 50, caloriesPer100g: 366, proteinPer100g: 11.9, fatPer100g: 7.2, carbPer100g: 69, category: 'pantry' }
    ],
    instructions: [
      'Овсяные хлопья запарить кипятком на 3 минуты.',
      'Смешать с нежным творогом в глубокой пиале.'
    ]
  },
  {
    id: 'classic-milk-omelette',
    title: 'Нежный пышный омлет на молоке',
    category: 'BREAKFAST',
    isBatchable: false,
    prepTimeMin: 7,
    rating: 4.8,
    reviewCount: 112,
    imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'eggs', productName: 'Яйца куриные', defaultGrams: 150, caloriesPer100g: 157, proteinPer100g: 12.7, fatPer100g: 11.5, carbPer100g: 0.7, category: 'fridge' },
      { productId: 'milk', productName: 'Молоко 2.5%', defaultGrams: 100, caloriesPer100g: 54, proteinPer100g: 2.9, fatPer100g: 2.5, carbPer100g: 4.8, category: 'fridge' }
    ],
    instructions: [
      'Взбить яйца с молоком и щепоткой соли венчиком до однородности.',
      'Вылить смесь на разогретую антипригарную сковороду.',
      'Готовить под крышкой на слабом огне 5-7 минут до пышности.'
    ]
  },
  {
    id: 'french-scrambled-eggs-milk',
    title: 'Французская яичница-болтунья на молоке',
    category: 'BREAKFAST',
    isBatchable: false,
    prepTimeMin: 6,
    imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'eggs', productName: 'Яйца куриные', defaultGrams: 200, caloriesPer100g: 157, proteinPer100g: 12.7, fatPer100g: 11.5, carbPer100g: 0.7, category: 'fridge' },
      { productId: 'milk', productName: 'Молоко 2.5%', defaultGrams: 50, caloriesPer100g: 54, proteinPer100g: 2.9, fatPer100g: 2.5, carbPer100g: 4.8, category: 'fridge' }
    ],
    instructions: [
      'Взбить яйца с молоком в сотейнике.',
      'Готовить на постоянном медленном огне, постоянно помешивая силиконовой лопаткой.',
      'Снять с огня, когда яичница станет шелковистой и крем-образной.'
    ]
  }
];

// Tier 1: Local static photo map (100% Offline PWA Ready!)
const LOCAL_STATIC_FOOD_IMAGES: Record<string, string> = {
  яйц: '/ingredients/eggs.jpg',
  молок: '/ingredients/milk.jpg',
  куриц: '/ingredients/chicken.jpg',
  индейк: '/ingredients/turkey.jpg',
  говядин: '/ingredients/beef.jpg',
  свинин: '/ingredients/pork.jpg',
  фарш: '/ingredients/mince.jpg',
  бедрон: '/ingredients/chicken.jpg',
  рис: '/ingredients/rice.jpg',
  макарон: '/ingredients/pasta.jpg',
  спагетти: '/ingredients/spaghetti.jpg',
  сыр: '/ingredients/cheese.jpg',
  творог: '/ingredients/cottage-cheese.jpg',
  сметан: '/ingredients/sour-cream.jpg',
  йогурт: '/ingredients/yogurt.jpg',
  гречк: '/ingredients/buckwheat.jpg',
  овсян: '/ingredients/oats.jpg',
  картофел: '/ingredients/potatoes.jpg',
  рыб: '/ingredients/fish.jpg',
  лосос: '/ingredients/salmon.jpg',
  тунец: '/ingredients/tuna.jpg',
  креветк: '/ingredients/shrimp.jpg',
  огурец: '/ingredients/cucumber.jpg',
  помидор: '/ingredients/tomatoes.jpg',
  перец: '/ingredients/pepper.jpg',
  броккол: '/ingredients/broccoli.jpg',
  кабачок: '/ingredients/zucchini.jpg',
  морков: '/ingredients/carrot.jpg',
  лук: '/ingredients/onion.jpg',
  чеснок: '/ingredients/garlic.jpg',
  яблок: '/ingredients/apples.jpg',
  банан: '/ingredients/bananas.jpg',
  апельсин: '/ingredients/oranges.jpg',
  лимон: '/ingredients/lemon.jpg',
  масло: '/ingredients/olive-oil.jpg',
  соль: '/ingredients/salt.jpg',
  мука: '/ingredients/flour.jpg'
};

// Tier 3: Local fallback placeholder image
export const FALLBACK_FOOD_IMAGE = '/ingredients/placeholder.jpg';

export function getProductImageUrl(name: string, existingUrl?: string): string {
  if (existingUrl && existingUrl.length > 5) return existingUrl;
  
  const lower = name.toLowerCase();

  // Tier 1: Check local static photo map (100% Offline PWA Ready)
  for (const [key, val] of Object.entries(LOCAL_STATIC_FOOD_IMAGES)) {
    if (lower.includes(key)) {
      return val;
    }
  }

  // Tier 2: Dynamic live CDN lookup for custom ingredients
  const cleanName = name.replace(/\d+/g, '').replace(/%/g, '').trim().split(' ')[0];
  if (cleanName.length > 0) {
    return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(cleanName)}-Small.png`;
  }

  // Tier 3: Local fallback placeholder
  return FALLBACK_FOOD_IMAGE;
}
