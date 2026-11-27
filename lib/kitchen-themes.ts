/**
 * A restaurant "kitchen theme": the look, the dishes and the outlets that dress the 3D kitchen for one brand. The experience itself
 * (components/kitchen) is generic; a new restaurant is a new entry here. Every restaurant brings its OWN look (colours, fonts, door,
 * cursor), kept apart from the marketplace's look on purpose.
 *
 * DEMO DATA: the dishes below are real items from the Paris Panini menu, but the photos are representative stock photos from
 * Wikimedia Commons (CC0 / CC BY / CC BY-SA, credited in the app), NOT photos of this restaurant's own food. The brand is shown as a DEMO.
 */
export interface KitchenPhoto { src: string; title: string; author: string; license: string; licenseUrl: string; source: string }
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
export interface KitchenOutlet { id: string; name: string }
export interface KitchenTheme {
  id: string; brand: string; tagline: string;
  colors: { brand: string; brandDark: string; accent: string; cream: string; wood: string; ink: string; brass: string };
  outlets: KitchenOutlet[];
  dishes: KitchenDish[];
}

const CC0 = "http://creativecommons.org/publicdomain/zero/1.0/deed.en";
const BY2 = "https://creativecommons.org/licenses/by/2.0";
const BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0";
const BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0";
const W = "https://commons.wikimedia.org/wiki/File:";
const D = "/kitchen/paris-panini";
const photo = (id: string, title: string, author: string, license: string, licenseUrl: string, file: string): KitchenPhoto => ({ src: `${D}/${id}.webp`, title, author, license, licenseUrl, source: W + file });

export const PARIS_PANINI: KitchenTheme = {
  id: "paris-panini",
  brand: "Paris Panini (Demo)",
  tagline: "gourmet sandwiches & wraps",
  colors: { brand: "#2a3a9e", brandDark: "#141c52", accent: "#d92b2b", cream: "#f6efe0", wood: "#d6a566", ink: "#0d1033", brass: "#c9a24b" },
  outlets: [
    { id: "indiranagar", name: "Indiranagar" },
    { id: "sanjay-nagar", name: "Sanjay Nagar" },
  ],
  dishes: [
    {
      id: "laura", nameKey: "kitchen.dish.laura.name", aboutKey: "kitchen.dish.laura.about", veg: true, half: 195, full: 300, category: "Meals", allergens: ["Gluten", "Milk", "Nuts"], plate: `${D}/plate-laura.webp`,
      photos: [
        photo("laura-1", "Panini (Mozzarella, Pesto & Tomato), Dyke Road Park Cafe", "Andy Li", "CC0", CC0, "Panini_(Mozzarella,_Pesto_%26_Tomato)_-_Dyke_Road_Park_Cafe.jpg"),
        photo("laura-2", "Panini mozzarella at Down The Rabbit Hole", "FakirNL", "CC BY-SA 4.0", BYSA4, "Panini_mozzarella_at_Down_The_Rabbit_Hole_2018.jpg"),
        photo("laura-3", "Panini med gedeost, mozzarella og gorgonzola", "cyclonebill", "CC BY-SA 2.0", BYSA2, "Flickr_-_cyclonebill_-_Panini_med_gedeost,_mozzarella_og_gorgonzola.jpg"),
      ],
    },
    {
      id: "colette", nameKey: "kitchen.dish.colette.name", aboutKey: "kitchen.dish.colette.about", veg: true, half: 195, full: 300, category: "Meals", allergens: ["Gluten", "Milk", "Nuts"], plate: `${D}/plate-colette.webp`,
      photos: [
        photo("colette-1", "Panini (Spinach, mushrooms & fresh tomato), Breakfast At Tiffany's Brighton", "Andy Li", "CC0", CC0, "Panini_(Spinach,_mushrooms_%26_fresh_tomato)_-_Breakfast_At_Tiffany%27s_Brighton_2023-11-23.jpg"),
        photo("colette-2", "Panini hummus and vegetables at Down The Rabbit Hole", "FakirNL", "CC BY-SA 4.0", BYSA4, "Panini_hummus_and_vegetables_at_Down_The_Rabbit_Hole_2018.jpg"),
        photo("colette-3", "Sorta panini, warmed but not pressed", "jeffreyw", "CC BY 2.0", BY2, "Sorta_panini,_warmed_but_not_pressed_(4477070898).jpg"),
      ],
    },
    {
      id: "mathieu", nameKey: "kitchen.dish.mathieu.name", aboutKey: "kitchen.dish.mathieu.about", veg: false, half: 235, full: 390, mustTry: true, category: "Meals", allergens: ["Gluten", "Egg"], plate: `${D}/plate-mathieu.webp`,
      photos: [
        photo("mathieu-2", "Moroccan Chicken panini", "jeffreyw", "CC BY 2.0", BY2, "Moroccan_Chicken_panini_(4477824766).jpg"),
        photo("mathieu-1", "Chicken Panini with Peperonata and Basil", "Lets.Custodio", "CC BY-SA 4.0", BYSA4, "Chicken_Panini_with_Peperonata_and_Basil.jpg"),
      ],
    },
    {
      id: "veg-wrap", nameKey: "kitchen.dish.vegWrap.name", aboutKey: "kitchen.dish.vegWrap.about", veg: true, full: 250, category: "Meals", allergens: ["Gluten", "Milk"], plate: `${D}/plate-veg-wrap.webp`,
      photos: [
        photo("veg-wrap-1", "Falafel & Hummus Wrap, Lavash", "Andy Li", "CC0", CC0, "Falafel_%26_Hummus_Wrap_-_Lavash_2024-08-19.jpg"),
        photo("veg-wrap-2", "Falafel & Tzatziki Wrap, Lavash", "Andy Li", "CC0", CC0, "Falafel_%26Tzatziki_Wrap_-_Lavash.jpg"),
      ],
    },
    {
      id: "peri-peri", nameKey: "kitchen.dish.periPeri.name", aboutKey: "kitchen.dish.periPeri.about", veg: false, full: 260, category: "Meals", allergens: ["Gluten", "Milk", "Egg"], plate: `${D}/plate-peri-peri.webp`,
      photos: [
        photo("chicken-wrap-1", "Handmade Chicken Shawarma Wrap, Lavash", "Andy Li", "CC0", CC0, "Handmade_Chicken_Shawarma_Wrap_-_Lavash.jpg"),
        photo("chicken-wrap-2", "Chicken Shawarma Wrap, Lavash", "Andy Li", "CC0", CC0, "Chicken_Shawarma_Wrap_-_Lavash_2024-09-11.jpg"),
        photo("chicken-wrap-3", "Chicken Çöp Shish, Lavash", "Andy Li", "CC0", CC0, "Chicken_%C3%87%C3%B6p_Shish_-_Lavash_2023-12-13.jpg"),
      ],
    },
  ],
};

export const KITCHEN_THEMES: Record<string, KitchenTheme> = { [PARIS_PANINI.id]: PARIS_PANINI };

/** The 3D kitchen is a TEST feature: it exists on preview deployments and local development only, never on the live site. */
export function kitchenEnabled() {
  return process.env.VERCEL_ENV === "preview" || (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test");
}
