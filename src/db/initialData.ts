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
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export const INITIAL_STAPLES = [
  { name: 'Гречка', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 343, p: 13, f: 3.4, carb: 72 },
  { name: 'Рис басмати', category: 'pantry' as const, defaultQty: 1000, unit: 'g' as const, c: 345, p: 7.5, f: 0.6, carb: 78 },
  { name: 'Макароны твердых сортов', category: 'pantry' as const, defaultQty: 500, unit: 'g' as const, c: 350, p: 12, f: 1.5, carb: 71 },
  { name: 'Овсяные хлопья', category: 'pantry' as const, defaultQty: 800, unit: 'g' as const, c: 366, p: 11.9, f: 7.2, carb: 69 },
  { name: 'Оливковое масло', category: 'pantry' as const, defaultQty: 500, unit: 'ml' as const, c: 884, p: 0, f: 100, carb: 0 },
  { name: 'Подсолнечное масло', category: 'pantry' as const, defaultQty: 1000, unit: 'ml' as const, c: 884, p: 0, f: 100, carb: 0 },
  { name: 'Соль и Специи', category: 'pantry' as const, defaultQty: 200, unit: 'g' as const, c: 0, p: 0, f: 0, carb: 0 },
  { name: 'Куриное филе', category: 'fridge' as const, defaultQty: 800, unit: 'g' as const, c: 165, p: 31, f: 3.6, carb: 0 },
  { name: 'Филе индейки', category: 'fridge' as const, defaultQty: 600, unit: 'g' as const, c: 130, p: 25, f: 2.5, carb: 0 },
  { name: 'Яйца куриные', category: 'fridge' as const, defaultQty: 10, unit: 'pcs' as const, c: 157, p: 12.7, f: 11.5, carb: 0.7 },
  { name: 'Творог 5%', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 121, p: 17, f: 5, carb: 3 },
  { name: 'Сыр Твердый', category: 'fridge' as const, defaultQty: 200, unit: 'g' as const, c: 360, p: 26, f: 28, carb: 0 },
  { name: 'Огурцы свежие', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 15, p: 0.8, f: 0.1, carb: 3 },
  { name: 'Помидоры', category: 'fridge' as const, defaultQty: 500, unit: 'g' as const, c: 18, p: 0.9, f: 0.2, carb: 3.9 },
  { name: 'Болгарский перец', category: 'fridge' as const, defaultQty: 400, unit: 'g' as const, c: 27, p: 1.3, f: 0.3, carb: 5.3 }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'chicken-buckwheat-salad',
    title: 'Сочное куриное филе с гречкой и фитнес-салатом',
    category: 'LUNCH',
    isBatchable: true,
    prepTimeMin: 20,
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
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { productId: 'cottage_cheese', productName: 'Творог 5%', defaultGrams: 200, caloriesPer100g: 121, proteinPer100g: 17, fatPer100g: 5, carbPer100g: 3, category: 'fridge' },
      { productId: 'oats', productName: 'Овсяные хлопья', defaultGrams: 50, caloriesPer100g: 366, proteinPer100g: 11.9, fatPer100g: 7.2, carbPer100g: 69, category: 'pantry' }
    ],
    instructions: [
      'Овсяные хлопья запарить кипятком на 3 минуты.',
      'Смешать с нежным творогом в глубокой пиале.'
    ]
  }
];
