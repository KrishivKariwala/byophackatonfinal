/**
 * A restaurant "kitchen theme": the look, the dishes and the outlets that dress the 3D kitchen for one brand. The experience itself
 * (components/kitchen) is generic; a new restaurant is a new entry here. Every restaurant brings its OWN look (colours, fonts, door,
 * cursor), kept apart from the marketplace's look on purpose.
 *
 * DEMO DATA: the dishes below are real items from the Paris Panini menu, but the photos are AI-generated demo images (Google Gemini,
 * labelled as such in the app), NOT photos of this restaurant's own food. A real restaurant replaces them with its own photos. The brand is shown as a DEMO.
 */
export interface KitchenPhoto { src: string; title: string; author: string; license: string; licenseUrl?: string; source?: string }
export interface KitchenDish {
  id: string;
  /** i18n keys under "kitchen.dish.*" (names of the wraps are translated; the French first names are kept as they are) */
  nameKey: string; aboutKey: string;
  veg: boolean;
  /** menu price in whole rupees (full portion): the "original price" of the listing */
  full: number; half?: number;
  mustTry?: boolean;
  category: "Meals" | "Snacks" | "Bakery" | "Desserts";
  /** allergens that this recipe normally contains (the vendor can change them before listing) */
  allergens: string[];
  /** square, plate-shaped crop of photos[0], used on the 3D plate in the kitchen */
  plate: string;
  /** every reference photo; the viewer lets people click through them */
  photos: KitchenPhoto[];
}
export interface KitchenTheme {
  id: string; brand: string; tagline: string;
  colors: { brand: string; brandDark: string; accent: string; cream: string; wood: string; ink: string; brass: string };
  dishes: KitchenDish[];
}

const D = "/kitchen/paris-panini";
const gemini = (id: string, title: string): KitchenPhoto => ({ src: `${D}/${id}.webp`, title, author: "Google Gemini", license: "AI-generated" });

export const PARIS_PANINI: KitchenTheme = {
  id: "paris-panini",
  brand: "Paris Panini (Demo)",
  tagline: "gourmet sandwiches & wraps",
  colors: { brand: "#2a3a9e", brandDark: "#141c52", accent: "#d92b2b", cream: "#f6efe0", wood: "#d6a566", ink: "#0d1033", brass: "#c9a24b" },
  dishes: [
    {
      id: "laura", nameKey: "kitchen.dish.laura.name", aboutKey: "kitchen.dish.laura.about", veg: true, half: 195, full: 300, category: "Meals", allergens: ["Gluten", "Milk", "Nuts"], plate: `${D}/plate-laura.webp`,
      photos: [gemini("laura-a", "Mozzarella, sun-dried tomato and pesto panini, from above"), gemini("laura-b", "The same panini at an angle"), gemini("laura-c", "Close-up of the cut")],
    },
    {
      id: "colette", nameKey: "kitchen.dish.colette.name", aboutKey: "kitchen.dish.colette.about", veg: true, half: 195, full: 300, category: "Meals", allergens: ["Gluten", "Milk", "Nuts"], plate: `${D}/plate-colette.webp`,
      photos: [gemini("colette-a", "Mushroom, vegetable and pesto panini, from above"), gemini("colette-b", "The same panini at an angle")],
    },
    {
      id: "mathieu", nameKey: "kitchen.dish.mathieu.name", aboutKey: "kitchen.dish.mathieu.about", veg: false, half: 235, full: 390, mustTry: true, category: "Meals", allergens: ["Gluten", "Egg"], plate: `${D}/plate-mathieu.webp`,
      photos: [gemini("mathieu-a", "Chicken, onion ring and garlic aioli panini, from above"), gemini("mathieu-b", "The same panini at an angle")],
    },
    {
      id: "veg-wrap", nameKey: "kitchen.dish.vegWrap.name", aboutKey: "kitchen.dish.vegWrap.about", veg: true, full: 250, category: "Meals", allergens: ["Gluten", "Milk"], plate: `${D}/plate-veg-wrap.webp`,
      photos: [gemini("veg-wrap-a", "Roasted vegetable and mozzarella wrap, from above"), gemini("veg-wrap-b", "The same wrap at an angle")],
    },
    {
      id: "peri-peri", nameKey: "kitchen.dish.periPeri.name", aboutKey: "kitchen.dish.periPeri.about", veg: false, full: 260, category: "Meals", allergens: ["Gluten", "Milk", "Egg"], plate: `${D}/plate-peri-peri.webp`,
      photos: [gemini("peri-peri-a", "Peri-peri chicken and mozzarella wrap, from above"), gemini("peri-peri-b", "The same wrap at an angle")],
    },
  ],
};

export const KITCHEN_THEMES: Record<string, KitchenTheme> = { [PARIS_PANINI.id]: PARIS_PANINI };

/**
 * The 3D kitchen is a TEST feature: it exists on Vercel preview deployments and on `next dev`, never on the live site, in tests, or when a
 * script (such as the database seeder) runs.
 */
export function kitchenEnabled() {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";
}

/** which restaurant look each demo restaurant account gets. Every restaurant account will have its own entry here; the first one is the default. */
export const VENDOR_THEME: Record<string, string> = { v_paris: "paris-panini" };
/** the CSS variables that dress a page in a restaurant's own colours */
export const themeVars = (t: KitchenTheme): Record<string, string> => ({ "--k-brand": t.colors.brand, "--k-dark": t.colors.brandDark, "--k-accent": t.colors.accent, "--k-cream": t.colors.cream, "--k-wood": t.colors.wood, "--k-ink": t.colors.ink, "--k-brass": t.colors.brass });
export const themeForVendor = (vendorId: string): KitchenTheme => KITCHEN_THEMES[VENDOR_THEME[vendorId] ?? ""] ?? PARIS_PANINI;
