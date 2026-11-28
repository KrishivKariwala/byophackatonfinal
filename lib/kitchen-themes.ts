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
/** The shopfront the vendor pushes open. The picture has the doorway cut out (so the live kitchen shows through) and the two door leaves are separate pictures; every number is in picture pixels. */
export interface DoorSpec {
  /** folder under /public holding facade.webp, door-left.webp and door-right.webp */
  dir: string; w: number; h: number;
  leaf: { x: number; y: number; w: number; h: number };
  /** where the PUSH plate sits on the right leaf (distance from the top of the leaf) */
  plateTop: number;
  /** soft lights painted over the picture (lantern, lit windows): CSS background, picture-pixel box, flicker offset */
  glows: { x: number; y: number; w: number; h: number; bg: string; radius?: number | string; delay?: string }[];
  /** plain colour where the picture does not reach the screen edges */
  fills: { top: string; bottom: string; left: string; right: string; loading: string };
  /** the colour of the spill of light on the step */
  spill: string;
}
export type KitchenLayout = "round" | "diner";
export interface KitchenTheme {
  id: string; brand: string; /** the restaurant's name without "(Demo)" */ name: string; tagline: string;
  /** "round": the Paris Panini back kitchen; "diner": a straight walk past tables */
  layout: KitchenLayout;
  colors: { brand: string; brandDark: string; accent: string; cream: string; wood: string; ink: string; brass: string };
  /** fonts to wait for before the painted signs are drawn: a CSS font shorthand and the text that must be drawable in it (so the right subset is fetched) */
  fonts: { load: { font: string; text?: string }[] };
  /** how long the scroll track is, as a percentage of the screen height per dish */
  scrollPerDish: number;
  door: DoorSpec;
  /** the restaurant's box on the owner page (the page itself stays in the website's look) */
  hub: { background: string; border: string; text: string; sub: string; shadow: string; /** CSS font size of the restaurant's name in its box */ titleSize: string; add: { border: string; text: string } };
  dishes: KitchenDish[];
}

const D = "/kitchen/paris-panini";
const gemini = (id: string, title: string): KitchenPhoto => ({ src: `${D}/${id}.webp`, title, author: "Google Gemini", license: "AI-generated" });

export const PARIS_PANINI: KitchenTheme = {
  id: "paris-panini",
  brand: "Paris Panini (Demo)", name: "Paris Panini",
  tagline: "gourmet sandwiches & wraps",
  layout: "round",
  fonts: { load: [{ font: '48px "Abril Fatface"' }, { font: '40px "Josefin Sans"' }] },
  scrollPerDish: 112,
  door: {
    dir: "/kitchen/paris-panini", w: 1376, h: 768, leaf: { x: 606, y: 302, w: 166, h: 327 }, plateTop: 217,
    glows: [
      { x: 826 - 70, y: 312 - 70, w: 140, h: 140, bg: "radial-gradient(circle, rgba(255,196,110,.9), rgba(255,170,80,.25) 45%, transparent 70%)" },
      { x: 285, y: 225, w: 225, h: 270, radius: 40, bg: "radial-gradient(ellipse, rgba(255,190,100,.28), transparent 70%)", delay: "-1.2s" },
      { x: 865, y: 225, w: 225, h: 270, radius: 40, bg: "radial-gradient(ellipse, rgba(255,190,100,.28), transparent 70%)", delay: "-2.1s" },
    ],
    fills: { top: "linear-gradient(#0d1b33, #2f5d90 55%, #5890c4)", bottom: "linear-gradient(#524a4c, #1c1b20 45%, #07080d)", left: "#040608", right: "#050607", loading: "#070a22" },
    spill: "rgba(255,198,120,.95), rgba(255,160,70,.35) 45%, transparent 72%",
  },
  hub: { background: "radial-gradient(120% 90% at 50% 0%, #1c2a78 0%, #141c52 45%, #0d1033 100%)", border: "#c9a24b", text: "#f6efe0", sub: "#c9a24b", shadow: "0 18px 44px rgba(13,16,51,.35)", titleSize: "2rem", add: { border: "#c9a24b", text: "#f6efe0" } },
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

const S = "/kitchen/smash-guys";
const geminiS = (id: string, title: string): KitchenPhoto => ({ src: `${S}/${id}.webp`, title, author: "Google Gemini", license: "AI-generated" });
/** a Smash Guys dish: slug is the file name stem (slug-a = from above, slug-b = at an angle, plate-slug = the round crop that goes on the tray) */
const smash = (slug: string, key: string, rest: Pick<KitchenDish, "veg" | "full" | "category" | "allergens"> & { mustTry?: boolean }, a: string, b: string): KitchenDish => ({
  id: slug, nameKey: `kitchen.dish.${key}.name`, aboutKey: `kitchen.dish.${key}.about`, plate: `${S}/plate-${slug}.webp`, ...rest, photos: [geminiS(`${slug}-a`, a), geminiS(`${slug}-b`, b)],
});

/**
 * Smash Guys (a demo of the Bengaluru burger kitchen): yellow glazed tile, black lettering, red leather booths. The dishes are real items from its menu (mains and sides only);
 * the photos are AI-generated demo images, like Paris Panini's.
 */
export const SMASH_GUYS: KitchenTheme = {
  id: "smash-guys",
  brand: "Smash Guys (Demo)", name: "Smash Guys",
  tagline: "burger kitchen",
  layout: "diner",
  fonts: { load: [{ font: '48px "Anton"' }, { font: '40px "Outfit"' }, { font: '40px "Yellowtail"' }, { font: '700 40px "Noto Sans Kannada"', text: "ಸ್ಮ್ಯಾಶ್ ಗಾಯ್ಸ್" }] },
  scrollPerDish: 100,
  door: {
    dir: "/kitchen/smash-guys", w: 1376, h: 768, leaf: { x: 590, y: 292, w: 192, h: 320 }, plateTop: 150,
    glows: [
      { x: 190, y: 285, w: 300, h: 215, radius: 24, bg: "radial-gradient(ellipse, rgba(255,190,100,.30), transparent 70%)", delay: "-1.2s" },
      { x: 885, y: 285, w: 300, h: 215, radius: 24, bg: "radial-gradient(ellipse, rgba(255,190,100,.30), transparent 70%)", delay: "-2.1s" },
    ],
    fills: { top: "linear-gradient(#071428, #103666)", bottom: "linear-gradient(#585860, #2a2a2e 40%, #121214)", left: "#1c1818", right: "#1c1818", loading: "#0c1830" },
    spill: "rgba(255,214,110,.95), rgba(255,180,60,.35) 45%, transparent 72%",
  },
  hub: {
    background: "#f7d65a url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f7d65a'/%3E%3Cpath d='M32 0 64 32 32 64 0 32z' fill='%23efc13a'/%3E%3C/svg%3E\")",
    border: "#141414", text: "#141414", sub: "#4a3a00", shadow: "0 18px 44px rgba(20,20,20,.28)", titleSize: "2.6rem", add: { border: "#141414", text: "#141414" },
  },
  colors: { brand: "#141414", brandDark: "#0c0c0c", accent: "#c8201b", cream: "#fff3c4", wood: "#b9803f", ink: "#1a1409", brass: "#f4b400" },
  dishes: [
    smash("og-smash", "ogSmash", { veg: false, full: 490, category: "Meals", allergens: ["Gluten", "Milk"] }, "OG Smash from above: two smash patties, melted American cheese, pickles, white onions and mustard", "The OG Smash at an angle"),
    smash("oklahoma-smash", "oklahomaSmash", { veg: false, full: 550, category: "Meals", allergens: ["Gluten", "Milk"] }, "Oklahoma Smash from above: onion-smashed patties, chimichurri, pickles and lettuce", "The Oklahoma Smash at an angle"),
    smash("chilli-cheese-smash", "chilliCheeseSmash", { veg: false, full: 590, category: "Meals", allergens: ["Gluten", "Milk"], mustTry: true }, "Chilli Cheese Smash from above: patties under chilli cheese sauce with chilli sofrito", "The Chilli Cheese Smash at an angle"),
    smash("brisket-smash", "brisketSmash", { veg: false, full: 690, category: "Meals", allergens: ["Gluten", "Milk"], mustTry: true }, "8 Hr Braised Brisket burger from above", "The braised brisket burger at an angle"),
    smash("nashville-chicken", "nashvilleChicken", { veg: false, full: 410, category: "Meals", allergens: ["Gluten", "Milk", "Egg"] }, "Nashville Chicken burger from above: fried chicken in hot oil with chilli sofrito and pickles", "The Nashville Chicken burger at an angle"),
    smash("truffle-fries", "truffleFries", { veg: true, full: 378, category: "Snacks", allergens: ["Milk", "Egg"] }, "Truffle Fries from above: truffle mayo, parmesan and parsley", "The truffle fries at an angle"),
    smash("mac-cheese", "macCheese", { veg: true, full: 410, category: "Meals", allergens: ["Gluten", "Milk"] }, "Mac & Cheese from above: creamy macaroni with a golden cheddar crust", "The mac and cheese at an angle"),
  ],
};

export const KITCHEN_THEMES: Record<string, KitchenTheme> = { [PARIS_PANINI.id]: PARIS_PANINI, [SMASH_GUYS.id]: SMASH_GUYS };

/**
 * The 3D kitchen is a TEST feature: it exists on Vercel preview deployments and on `next dev`, never on the live site, in tests, or when a
 * script (such as the database seeder) runs.
 */
export function kitchenEnabled() {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";
}

/**
 * A vendor can run several restaurants, each with several outlets. An outlet's name is "<restaurant> · <area>" (for example "Paris Panini · Indiranagar"), so
 * the restaurant is the part before the dot and no extra data is stored. A restaurant with an entry here has its own look and 3D kitchen; one without is shown
 * plain on the outlet page and has no 3D kitchen yet (it gets one when its look and photos are added).
 */
export const RESTAURANT_THEME: Record<string, string> = { "Paris Panini": "paris-panini", "Smash Guys": "smash-guys" };
export const SEP = " · ";
export const restaurantOf = (outlet: { name?: string; address: string }, fallback: string): string => (outlet.name?.includes(SEP) ? outlet.name.split(SEP)[0] : fallback).trim();
export const areaOf = (outlet: { name?: string; address: string }): string => (outlet.name?.includes(SEP) ? outlet.name.split(SEP).slice(1).join(SEP) : outlet.name ?? outlet.address).trim();
export const themeForRestaurant = (restaurant: string): KitchenTheme | null => KITCHEN_THEMES[RESTAURANT_THEME[restaurant] ?? ""] ?? null;
/** the CSS variables that dress a page in a restaurant's own colours */
export const themeVars = (t: KitchenTheme): Record<string, string> => ({ "--k-brand": t.colors.brand, "--k-dark": t.colors.brandDark, "--k-accent": t.colors.accent, "--k-cream": t.colors.cream, "--k-wood": t.colors.wood, "--k-ink": t.colors.ink, "--k-brass": t.colors.brass });
