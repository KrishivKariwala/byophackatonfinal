/**
 * A restaurant "kitchen theme": the colours, signage, outlets and a starter menu that dress the 3D kitchen walk-through for one brand.
 * The walk-through itself (components/kitchen) is generic; a new restaurant is a new entry here. Prototype data: the menu below is a
 * demo subset (five dishes per station) and the brand is shown as a DEMO.
 */
export interface KitchenItem { id: string; name: string; about: string; veg: boolean; half?: number; full: number; mustTry?: boolean }
export interface KitchenStation { id: string; title: string; subtitle: string; items: KitchenItem[] }
export interface KitchenOutlet { id: string; name: string; address: string }
export interface KitchenTheme {
  id: string; brand: string; tagline: string;
  colors: { brand: string; brandDark: string; accent: string; cream: string; wood: string; ink: string };
  outlets: KitchenOutlet[];
  stations: KitchenStation[];
}

export const PARIS_PANINI: KitchenTheme = {
  id: "paris-panini",
  brand: "Paris Panini (Demo)",
  tagline: "gourmet sandwiches & wraps",
  colors: { brand: "#2a3a9e", brandDark: "#1b2670", accent: "#d92b2b", cream: "#f6efe0", wood: "#d6a566", ink: "#12163a" },
  outlets: [
    { id: "indiranagar", name: "Indiranagar", address: "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru" },
    { id: "sanjay-nagar", name: "Sanjay Nagar", address: "4th Cross, 80 Feet Rd, RMV 2nd Stage, Bengaluru" },
  ],
  stations: [
    { id: "veg-paninis", title: "Panini, vegetarian", subtitle: "Baked daily in our kitchen · classic or multigrain", items: [
      { id: "laura", name: "Laura", about: "Fresh mozzarella, sun-dried tomatoes, fresh and creamy basil pesto", veg: true, half: 195, full: 300 },
      { id: "julie", name: "Julie", about: "Herbed paneer, bell pepper, mozzarella, creamy pesto, onion rings", veg: true, half: 225, full: 380 },
      { id: "estelle", name: "Estelle", about: "Ratatouille, fresh mozzarella, jalapeno, olive tapenade", veg: true, half: 205, full: 320 },
      { id: "colette", name: "Colette", about: "Roasted mushrooms, ratatouille, fresh basil pesto", veg: true, half: 195, full: 300 },
      { id: "sophie", name: "Sophie", about: "Marinated olives, feta, cucumber, fried onions, sriracha aioli", veg: true, half: 195, full: 300 },
    ] },
    { id: "nonveg-paninis", title: "Panini, non veg", subtitle: "Every panini comes half or full", items: [
      { id: "mathieu", name: "Mathieu", about: "Chicken dipped in a french gravy sauce, onion rings, lettuce, sliced onions, garlic aioli", veg: false, half: 235, full: 390, mustTry: true },
      { id: "hugo", name: "Hugo", about: "Fried chicken, fresh mozzarella, sun-dried tomatoes, basil and sriracha aioli", veg: false, half: 235, full: 390 },
      { id: "michel", name: "Michel", about: "Peri peri chicken, fresh mozzarella, sliced onions, garlic aioli", veg: false, half: 225, full: 350 },
      { id: "aime", name: "Aimé", about: "Peri peri chicken, red paprika, chunky chilli, onions, garlic aioli", veg: false, half: 225, full: 350 },
      { id: "patrick", name: "Patrick", about: "Mustard chicken, hard boiled egg, fried onions, basil aioli", veg: false, half: 225, full: 350 },
    ] },
    { id: "wraps", title: "Grilled wraps", subtitle: "Veg and non veg, pressed to order", items: [
      { id: "roasted-veggies", name: "Roasted Veggies & Mozzarella", about: "Ratatouille, mozzarella, jalapeno, lettuce, olive tapenade", veg: true, full: 250 },
      { id: "herbed-paneer", name: "Herbed Paneer & Bell Pepper", about: "Herbed paneer, bell pepper, mozzarella, creamy pesto, onion rings", veg: true, full: 250 },
      { id: "french-dipped", name: "French Dipped Chicken", about: "Chicken dipped in a french roast gravy, onion rings, lettuce, garlic aioli", veg: false, full: 270, mustTry: true },
      { id: "peri-peri", name: "Peri-Peri Chicken & Mozzarella", about: "Peri peri chicken, fresh mozzarella, sliced onions, lettuce, garlic aioli", veg: false, full: 260 },
      { id: "lamb-aioli", name: "Lamb & Aioli", about: "Crumbled lamb, red paprika, onion, jalapeno, lettuce, garlic aioli", veg: false, full: 320 },
    ] },
    { id: "dips", title: "Homemade dips", subtitle: "Made fresh, in tubs of the kitchen", items: [
      { id: "garlic-aioli", name: "Garlic Aioli", about: "Our signature dip", veg: true, full: 40 },
      { id: "basil-mayo", name: "Basil Mayo", about: "Fresh basil, creamy mayo", veg: true, full: 40 },
      { id: "ketchup", name: "Homemade Ketchup", about: "Slow cooked tomato", veg: true, full: 40 },
      { id: "chunky-chilli", name: "Chunky Chilli", about: "Smoky and bold", veg: true, full: 60 },
      { id: "french-dip", name: "French Dip", about: "Homemade dipping sauce made from a flavorful chicken jus", veg: false, full: 80, mustTry: true },
    ] },
    { id: "combos", title: "Make it a meal", subtitle: "Pick a combo with any panini or wrap", items: [
      { id: "fries", name: "French Fries + Ketchup", about: "Salted or Cajun, homemade ketchup", veg: true, full: 0 },
      { id: "onion-rings", name: "Onion Rings + Garlic Dip", about: "Crisp rings, spiced garlic dip", veg: true, full: 0 },
      { id: "poppers", name: "Jalapeño & Cheese Poppers", about: "With spiced garlic dip", veg: true, full: 160 },
      { id: "soup", name: "Truffled Mushroom Soup", about: "Or minestrone soup", veg: true, full: 0 },
      { id: "chicken-strips", name: "Chicken Strips + Garlic Dip", about: "Crunchy strips, spiced garlic dip", veg: false, full: 190 },
    ] },
  ],
};

export const KITCHEN_THEMES: Record<string, KitchenTheme> = { [PARIS_PANINI.id]: PARIS_PANINI };
