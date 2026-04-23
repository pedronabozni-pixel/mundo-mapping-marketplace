import { slugify } from "@/lib/utils";
import type { Ingredient, Recipe } from "@/types/kitchen";

const categoryLabels = {
  proteinas: "Proteínas",
  "legumes-verduras": "Legumes e verduras",
  temperos: "Temperos",
  laticinios: "Laticínios",
  "massas-graos": "Massas e grãos",
  enlatados: "Enlatados",
  padaria: "Padaria",
  outros: "Outros"
} as const;

function makeIngredient(
  name: string,
  category: Ingredient["category"],
  perishability: number,
  popular = false,
  aliases: string[] = []
): Ingredient {
  return {
    id: slugify(name),
    name,
    category,
    perishability,
    popular,
    aliases
  };
}

function recipeImage(title: string, accentA: string, accentB: string, emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
      </defs>
      <rect width="960" height="720" rx="48" fill="url(#g)" />
      <circle cx="770" cy="120" r="110" fill="rgba(255,255,255,0.14)" />
      <circle cx="150" cy="600" r="120" fill="rgba(255,255,255,0.08)" />
      <text x="90" y="220" font-family="Arial, sans-serif" font-size="156">${emoji}</text>
      <text x="90" y="420" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#12211b">${title}</text>
      <text x="90" y="500" font-family="Arial, sans-serif" font-size="30" fill="#18352d">Sugestao inteligente com os ingredientes da sua geladeira</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const ingredientCategories = Object.entries(categoryLabels).map(([id, label]) => ({
  id: id as Ingredient["category"],
  label
}));

export const initialIngredients: Ingredient[] = [
  makeIngredient("Ovo", "proteinas", 5, true),
  makeIngredient("Frango", "proteinas", 5, true),
  makeIngredient("Atum em lata", "proteinas", 1),
  makeIngredient("Queijo muçarela", "laticinios", 4, true, ["mussarela", "queijo"]),
  makeIngredient("Leite", "laticinios", 4, true),
  makeIngredient("Manteiga", "laticinios", 2),
  makeIngredient("Arroz", "massas-graos", 1, true),
  makeIngredient("Macarrão", "massas-graos", 1, true, ["espaguete"]),
  makeIngredient("Farinha de trigo", "massas-graos", 1),
  makeIngredient("Aveia", "massas-graos", 1),
  makeIngredient("Batata", "legumes-verduras", 4),
  makeIngredient("Cenoura", "legumes-verduras", 5, true),
  makeIngredient("Abobrinha", "legumes-verduras", 5),
  makeIngredient("Tomate", "legumes-verduras", 5, true),
  makeIngredient("Cebola", "legumes-verduras", 3, true),
  makeIngredient("Alho", "temperos", 2, true),
  makeIngredient("Alface", "legumes-verduras", 5),
  makeIngredient("Pepino", "legumes-verduras", 5),
  makeIngredient("Milho", "enlatados", 1),
  makeIngredient("Ervilha", "enlatados", 1),
  makeIngredient("Pão de forma", "padaria", 4, true, ["pao"]),
  makeIngredient("Azeite", "temperos", 1, true),
  makeIngredient("Sal", "temperos", 1, true),
  makeIngredient("Pimenta-do-reino", "temperos", 1),
  makeIngredient("Orégano", "temperos", 1),
  makeIngredient("Molho de tomate", "enlatados", 1),
  makeIngredient("Iogurte natural", "laticinios", 4),
  makeIngredient("Feijão pronto", "enlatados", 1),
  makeIngredient("Limão", "temperos", 4),
  makeIngredient("Salsinha", "temperos", 5)
];

function ingredientId(name: string) {
  return slugify(name);
}

export const initialRecipes: Recipe[] = [
  {
    id: "omelete",
    slug: "omelete",
    name: "Omelete prática",
    description: "Uma refeição rápida, versátil e perfeita para usar legumes e queijo que já estão na geladeira.",
    image: recipeImage("Omelete pratica", "#F6D365", "#FDA085", "🍳"),
    prepMinutes: 10,
    servings: "1 porção",
    difficulty: "Fácil",
    mealType: "Café da manhã",
    dietaryStyles: ["Vegetariano", "Econômico", "High protein"],
    tags: ["rápida", "frigideira", "anti-desperdício"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Ovo"), ingredientId("Queijo muçarela"), ingredientId("Tomate")],
    utensils: ["Frigideira antiaderente", "Espátula", "Tigela"],
    steps: [
      "Bata os ovos com sal e pimenta até a mistura ficar homogênea.",
      "Refogue rapidamente cebola, tomate ou outros legumes disponíveis.",
      "Despeje os ovos na frigideira, adicione queijo e cozinhe em fogo baixo.",
      "Dobre a omelete quando firmar e sirva em seguida."
    ],
    ingredients: [
      { ingredientId: ingredientId("Ovo"), quantity: "2 unidades" },
      { ingredientId: ingredientId("Sal"), quantity: "1 pitada" },
      { ingredientId: ingredientId("Azeite"), quantity: "1 fio" },
      { ingredientId: ingredientId("Queijo muçarela"), quantity: "2 colheres", optional: true },
      { ingredientId: ingredientId("Tomate"), quantity: "1/2 unidade", optional: true },
      { ingredientId: ingredientId("Cebola"), quantity: "2 colheres", optional: true },
      { ingredientId: ingredientId("Orégano"), quantity: "a gosto", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Queijo muçarela"), suggestion: "Troque por iogurte natural, requeijão ou retire sem perder a receita." },
      { ingredientId: ingredientId("Tomate"), suggestion: "Use cenoura ralada, abobrinha em cubos ou milho." }
    ]
  },
  {
    id: "arroz-com-legumes",
    slug: "arroz-com-legumes",
    name: "Arroz com legumes",
    description: "Prato coringa para transformar sobras e legumes esquecidos em uma refeição completa.",
    image: recipeImage("Arroz com legumes", "#84FAB0", "#8FD3F4", "🥕"),
    prepMinutes: 25,
    servings: "2 porções",
    difficulty: "Fácil",
    mealType: "Almoço",
    dietaryStyles: ["Vegetariano", "Econômico"],
    tags: ["panela única", "aproveitamento"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Arroz"), ingredientId("Cenoura"), ingredientId("Milho")],
    utensils: ["Panela média", "Colher de pau"],
    steps: [
      "Refogue alho e cebola no azeite.",
      "Adicione arroz cru e mexa por 1 minuto.",
      "Junte cenoura, milho, ervilha e água quente.",
      "Cozinhe até o arroz secar, finalize com salsinha e sirva."
    ],
    ingredients: [
      { ingredientId: ingredientId("Arroz"), quantity: "1 xícara" },
      { ingredientId: ingredientId("Alho"), quantity: "2 dentes" },
      { ingredientId: ingredientId("Cebola"), quantity: "1/2 unidade" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Cenoura"), quantity: "1 unidade", optional: true },
      { ingredientId: ingredientId("Milho"), quantity: "1/2 lata", optional: true },
      { ingredientId: ingredientId("Ervilha"), quantity: "1/2 lata", optional: true },
      { ingredientId: ingredientId("Salsinha"), quantity: "1 colher", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Cenoura"), suggestion: "Use abobrinha, tomate sem sementes ou batata em cubos pequenos." }
    ]
  },
  {
    id: "macarrao-alho-e-oleo",
    slug: "macarrao-alho-e-oleo",
    name: "Macarrão alho e óleo",
    description: "Receita clássica, econômica e rápida para quando a fome pede decisão imediata.",
    image: recipeImage("Macarrao alho e oleo", "#FBC2EB", "#A6C1EE", "🍝"),
    prepMinutes: 15,
    servings: "2 porções",
    difficulty: "Fácil",
    mealType: "Jantar",
    dietaryStyles: ["Vegetariano", "Econômico"],
    tags: ["rápida", "despensa"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Macarrão"), ingredientId("Alho"), ingredientId("Azeite")],
    utensils: ["Panela", "Escorredor", "Frigideira"],
    steps: [
      "Cozinhe o macarrão em água salgada até ficar al dente.",
      "Doure alho no azeite sem deixar amargar.",
      "Misture o macarrão escorrido ao alho dourado.",
      "Finalize com pimenta, salsinha ou queijo se tiver."
    ],
    ingredients: [
      { ingredientId: ingredientId("Macarrão"), quantity: "200 g" },
      { ingredientId: ingredientId("Alho"), quantity: "3 dentes" },
      { ingredientId: ingredientId("Azeite"), quantity: "3 colheres" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Pimenta-do-reino"), quantity: "a gosto", optional: true },
      { ingredientId: ingredientId("Salsinha"), quantity: "1 colher", optional: true },
      { ingredientId: ingredientId("Queijo muçarela"), quantity: "2 colheres", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Salsinha"), suggestion: "Finalize com orégano ou raspas de limão para mais frescor." }
    ]
  },
  {
    id: "frango-grelhado-com-legumes",
    slug: "frango-grelhado-com-legumes",
    name: "Frango grelhado com legumes",
    description: "Opção prática, rica em proteína e ótima para aproveitar legumes que precisam ser usados logo.",
    image: recipeImage("Frango com legumes", "#FCCB90", "#D57EEB", "🍗"),
    prepMinutes: 30,
    servings: "2 porções",
    difficulty: "Médio",
    mealType: "Almoço",
    dietaryStyles: ["Fit", "High protein"],
    tags: ["proteína", "frigideira", "sem forno"],
    noOven: true,
    lowDish: false,
    heroIngredientIds: [ingredientId("Frango"), ingredientId("Cenoura"), ingredientId("Abobrinha")],
    utensils: ["Frigideira grande", "Tábua", "Faca"],
    steps: [
      "Tempere o frango com sal, pimenta, alho e limão.",
      "Grelhe o frango até dourar dos dois lados.",
      "Na mesma frigideira, salteie cenoura, abobrinha e cebola.",
      "Sirva com o caldo da frigideira por cima."
    ],
    ingredients: [
      { ingredientId: ingredientId("Frango"), quantity: "2 filés" },
      { ingredientId: ingredientId("Alho"), quantity: "2 dentes" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Limão"), quantity: "1/2 unidade", optional: true },
      { ingredientId: ingredientId("Cenoura"), quantity: "1 unidade", optional: true },
      { ingredientId: ingredientId("Abobrinha"), quantity: "1 unidade", optional: true },
      { ingredientId: ingredientId("Cebola"), quantity: "1/2 unidade", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Abobrinha"), suggestion: "Pode usar tomate, pepino salteado rapidamente ou batata cozida em cubos." }
    ]
  },
  {
    id: "panqueca-simples",
    slug: "panqueca-simples",
    name: "Panqueca simples",
    description: "Massa básica que funciona com recheios doces ou salgados e salva refeições rápidas.",
    image: recipeImage("Panqueca simples", "#F9F586", "#96FBC4", "🥞"),
    prepMinutes: 20,
    servings: "6 unidades",
    difficulty: "Fácil",
    mealType: "Lanche",
    dietaryStyles: ["Econômico"],
    tags: ["versátil", "liquidificador"],
    noOven: true,
    lowDish: false,
    heroIngredientIds: [ingredientId("Ovo"), ingredientId("Leite"), ingredientId("Farinha de trigo")],
    utensils: ["Liquidificador", "Frigideira", "Concha"],
    steps: [
      "Bata leite, ovos, farinha e sal até formar uma massa lisa.",
      "Unte levemente a frigideira e despeje pequenas porções.",
      "Doure dos dois lados e reserve.",
      "Recheie com o que tiver em casa e sirva."
    ],
    ingredients: [
      { ingredientId: ingredientId("Ovo"), quantity: "2 unidades" },
      { ingredientId: ingredientId("Leite"), quantity: "1 xícara" },
      { ingredientId: ingredientId("Farinha de trigo"), quantity: "1 xícara" },
      { ingredientId: ingredientId("Sal"), quantity: "1 pitada" },
      { ingredientId: ingredientId("Manteiga"), quantity: "1 colher", optional: true },
      { ingredientId: ingredientId("Queijo muçarela"), quantity: "para rechear", optional: true },
      { ingredientId: ingredientId("Tomate"), quantity: "para rechear", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Leite"), suggestion: "Use água para uma massa mais leve ou iogurte diluído." }
    ]
  },
  {
    id: "omelete-de-forno",
    slug: "omelete-de-forno",
    name: "Omelete de forno",
    description: "Versão de assadeira para usar sobras de legumes e servir a família sem complicação.",
    image: recipeImage("Omelete de forno", "#FFDEE9", "#B5FFFC", "🧀"),
    prepMinutes: 35,
    servings: "4 porções",
    difficulty: "Fácil",
    mealType: "Jantar",
    dietaryStyles: ["Vegetariano", "Econômico", "High protein"],
    tags: ["forno", "família", "aproveitamento"],
    noOven: false,
    lowDish: false,
    heroIngredientIds: [ingredientId("Ovo"), ingredientId("Queijo muçarela"), ingredientId("Cebola")],
    utensils: ["Tigela", "Assadeira", "Forno"],
    steps: [
      "Bata os ovos com leite, sal e pimenta.",
      "Misture queijo, cebola, tomate e legumes disponíveis.",
      "Despeje em uma assadeira untada.",
      "Asse até firmar e dourar nas bordas."
    ],
    ingredients: [
      { ingredientId: ingredientId("Ovo"), quantity: "5 unidades" },
      { ingredientId: ingredientId("Leite"), quantity: "1/2 xícara" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Queijo muçarela"), quantity: "1 xícara", optional: true },
      { ingredientId: ingredientId("Tomate"), quantity: "1 unidade", optional: true },
      { ingredientId: ingredientId("Cebola"), quantity: "1/2 unidade", optional: true },
      { ingredientId: ingredientId("Orégano"), quantity: "a gosto", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Leite"), suggestion: "Substitua por iogurte natural ou água com um pouco de manteiga." }
    ]
  },
  {
    id: "arroz-com-ovo",
    slug: "arroz-com-ovo",
    name: "Arroz com ovo",
    description: "Comfort food direta ao ponto, ideal para dias corridos ou fim de geladeira.",
    image: recipeImage("Arroz com ovo", "#FFD26F", "#3677FF", "🍚"),
    prepMinutes: 12,
    servings: "1 porção",
    difficulty: "Fácil",
    mealType: "Almoço",
    dietaryStyles: ["Econômico", "High protein"],
    tags: ["rápida", "sobras"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Arroz"), ingredientId("Ovo"), ingredientId("Alho")],
    utensils: ["Frigideira", "Colher"],
    steps: [
      "Aqueça arroz já cozido com um fio de azeite e alho.",
      "Frite ou mexa o ovo na mesma frigideira.",
      "Misture ou sirva o ovo sobre o arroz.",
      "Finalize com pimenta e salsinha se tiver."
    ],
    ingredients: [
      { ingredientId: ingredientId("Arroz"), quantity: "1 xícara cozida" },
      { ingredientId: ingredientId("Ovo"), quantity: "1 ou 2 unidades" },
      { ingredientId: ingredientId("Alho"), quantity: "1 dente", optional: true },
      { ingredientId: ingredientId("Azeite"), quantity: "1 fio", optional: true },
      { ingredientId: ingredientId("Salsinha"), quantity: "a gosto", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Salsinha"), suggestion: "Use cebolinha, orégano ou apenas pimenta-do-reino." }
    ]
  },
  {
    id: "salada-proteica",
    slug: "salada-proteica",
    name: "Salada proteica",
    description: "Leve, saciante e ótima para aproveitar frango, atum e folhas antes que estraguem.",
    image: recipeImage("Salada proteica", "#C2FFD8", "#465EFB", "🥗"),
    prepMinutes: 15,
    servings: "2 porções",
    difficulty: "Fácil",
    mealType: "Jantar",
    dietaryStyles: ["Fit", "High protein"],
    tags: ["sem fogão", "refrescante"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Alface"), ingredientId("Frango"), ingredientId("Tomate")],
    utensils: ["Tigela", "Faca"],
    steps: [
      "Lave e seque folhas e legumes.",
      "Corte tomate, pepino e desfie frango ou abra o atum.",
      "Misture tudo com azeite, limão, sal e pimenta.",
      "Finalize com milho ou queijo se quiser."
    ],
    ingredients: [
      { ingredientId: ingredientId("Alface"), quantity: "1 maço pequeno" },
      { ingredientId: ingredientId("Tomate"), quantity: "1 unidade" },
      { ingredientId: ingredientId("Azeite"), quantity: "2 colheres" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Frango"), quantity: "1 filé cozido", optional: true },
      { ingredientId: ingredientId("Atum em lata"), quantity: "1 lata", optional: true },
      { ingredientId: ingredientId("Pepino"), quantity: "1/2 unidade", optional: true },
      { ingredientId: ingredientId("Milho"), quantity: "2 colheres", optional: true },
      { ingredientId: ingredientId("Limão"), quantity: "1/2 unidade", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Frango"), suggestion: "Troque por ovo cozido, atum ou feijão pronto escorrido." }
    ]
  },
  {
    id: "sanduiche-quente",
    slug: "sanduiche-quente",
    name: "Sanduíche quente",
    description: "Lanche quentinho e objetivo para qualquer hora, aproveitando pão, queijo e tomate.",
    image: recipeImage("Sanduiche quente", "#FAD0C4", "#FFD1FF", "🥪"),
    prepMinutes: 8,
    servings: "1 porção",
    difficulty: "Fácil",
    mealType: "Lanche",
    dietaryStyles: ["Econômico"],
    tags: ["rápida", "frigideira"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Pão de forma"), ingredientId("Queijo muçarela"), ingredientId("Tomate")],
    utensils: ["Frigideira", "Espátula"],
    steps: [
      "Monte o pão com queijo, tomate e orégano.",
      "Passe um pouco de manteiga por fora.",
      "Doure dos dois lados em frigideira tampada.",
      "Sirva assim que o queijo derreter."
    ],
    ingredients: [
      { ingredientId: ingredientId("Pão de forma"), quantity: "2 fatias" },
      { ingredientId: ingredientId("Queijo muçarela"), quantity: "2 fatias" },
      { ingredientId: ingredientId("Tomate"), quantity: "4 rodelas", optional: true },
      { ingredientId: ingredientId("Manteiga"), quantity: "1 colher", optional: true },
      { ingredientId: ingredientId("Orégano"), quantity: "a gosto", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Queijo muçarela"), suggestion: "Use frango desfiado, ovo mexido ou atum como recheio principal." }
    ]
  },
  {
    id: "sopa-de-legumes",
    slug: "sopa-de-legumes",
    name: "Sopa de legumes",
    description: "Receita acolhedora para usar vários legumes perecíveis em uma panela só.",
    image: recipeImage("Sopa de legumes", "#89F7FE", "#66A6FF", "🍲"),
    prepMinutes: 35,
    servings: "3 porções",
    difficulty: "Fácil",
    mealType: "Jantar",
    dietaryStyles: ["Vegetariano", "Fit", "Econômico"],
    tags: ["panela única", "conforto"],
    noOven: true,
    lowDish: true,
    heroIngredientIds: [ingredientId("Batata"), ingredientId("Cenoura"), ingredientId("Cebola")],
    utensils: ["Panela funda", "Concha"],
    steps: [
      "Refogue cebola e alho com azeite.",
      "Adicione batata, cenoura, abobrinha e cubra com água.",
      "Tempere e cozinhe até os legumes ficarem macios.",
      "Sirva com salsinha e pão, se tiver."
    ],
    ingredients: [
      { ingredientId: ingredientId("Batata"), quantity: "2 unidades" },
      { ingredientId: ingredientId("Cenoura"), quantity: "1 unidade" },
      { ingredientId: ingredientId("Cebola"), quantity: "1/2 unidade" },
      { ingredientId: ingredientId("Alho"), quantity: "2 dentes" },
      { ingredientId: ingredientId("Sal"), quantity: "a gosto" },
      { ingredientId: ingredientId("Abobrinha"), quantity: "1 unidade", optional: true },
      { ingredientId: ingredientId("Salsinha"), quantity: "a gosto", optional: true }
    ],
    substitutions: [
      { ingredientId: ingredientId("Batata"), suggestion: "Pode usar arroz já cozido para dar mais corpo ao caldo." }
    ]
  }
];
