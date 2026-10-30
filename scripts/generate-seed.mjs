// Generates the demo catalogue (seed/*.json) and placeholder product images (public/placeholder/*.svg).
// Banner photos live in public/images (see public/images/CREDITS.md).
// Run with: npm run generate-seed
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const imgDir = path.join(root, "public", "placeholder");
const seedDir = path.join(root, "seed");
rmSync(imgDir, { recursive: true, force: true });
mkdirSync(imgDir, { recursive: true });
mkdirSync(seedDir, { recursive: true });

// Product tiles are 5:6, like the cards on lululemon.com.
const W = 800;
const H = 960;
const TILE = "#eeeeee";
const S = 'stroke="rgba(0,0,0,.14)" stroke-width="3" stroke-linejoin="round"';
const seam = (d) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="3"/>`;
const tab = (x, y) => `<rect x="${x}" y="${y}" width="26" height="12" rx="6" fill="rgba(0,0,0,.22)"/>`;

const SHAPES = {
  puffer: (c) => `
    <path d="M285 170 L225 205 L160 280 L120 690 L195 700 L235 380 L230 770 L570 770 L565 380 L605 700 L680 690 L640 280 L575 205 L515 170 L400 215 Z" fill="${c}" ${S}/>
    <path d="M285 170 Q290 120 340 110 L460 110 Q510 120 515 170 L470 230 L400 215 L330 230 Z" fill="${c}" ${S}/>
    ${seam("M230 330 Q400 360 570 330 M232 430 Q400 460 568 430 M231 530 Q400 560 569 530 M230 630 Q400 660 570 630 M150 400 L235 410 M140 520 L233 528 M130 620 L232 628 M650 400 L565 410 M660 520 L567 528 M670 620 L568 628")}
    <path d="M400 215 L400 770" stroke="rgba(0,0,0,.25)" stroke-width="4"/>`,
  jacket: (c) => `
    <path d="M300 160 L235 190 L165 255 L125 700 L195 710 L240 360 L240 780 L560 780 L560 360 L605 710 L675 700 L635 255 L565 190 L500 160 Q400 110 300 160 Z" fill="${c}" ${S}/>
    <path d="M300 160 Q400 60 500 160 Q470 200 400 205 Q330 200 300 160 Z" fill="${c}" ${S}/>
    <path d="M400 205 L400 780" stroke="rgba(0,0,0,.25)" stroke-width="4"/>
    ${seam("M255 520 L330 520 M545 520 L470 520")}${tab(450, 300)}`,
  hoodie: (c) => `
    <path d="M300 170 L230 200 L165 265 L130 690 L200 700 L240 380 L245 760 L555 760 L560 380 L600 700 L670 690 L635 265 L570 200 L500 170 Z" fill="${c}" ${S}/>
    <path d="M300 170 Q300 80 400 80 Q500 80 500 170 Q450 230 400 230 Q350 230 300 170 Z" fill="${c}" ${S}/>
    ${seam("M330 520 L470 520 L490 640 L310 640 Z M380 230 L375 320 M420 230 L425 320 M245 720 L555 720")}`,
  tee: (c) => `
    <path d="M320 180 L245 205 L140 290 L190 390 L250 360 L250 760 L550 760 L550 360 L610 390 L660 290 L555 205 L480 180 Q400 240 320 180 Z" fill="${c}" ${S}/>
    ${seam("M320 180 Q400 240 480 180")}${tab(470, 300)}`,
  longsleeve: (c) => `
    <path d="M320 180 L245 205 L170 270 L120 690 L190 700 L245 380 L250 760 L550 760 L555 380 L610 700 L680 690 L630 270 L555 205 L480 180 Q400 240 320 180 Z" fill="${c}" ${S}/>
    ${seam("M320 180 Q400 240 480 180 M245 205 Q275 290 245 380 M555 205 Q525 290 555 380")}`,
  polo: (c) => `
    <path d="M300 180 L240 205 L165 270 L120 690 L190 700 L245 380 L250 760 L550 760 L555 380 L610 700 L680 690 L635 270 L560 205 L500 180 Q400 230 300 180 Z" fill="${c}" ${S}/>
    <path d="M300 180 L335 260 L400 215 Z M500 180 L465 260 L400 215 Z" fill="${c}" ${S}/>
    ${seam("M400 215 L400 340")}<circle cx="400" cy="265" r="5" fill="rgba(0,0,0,.25)"/><circle cx="400" cy="305" r="5" fill="rgba(0,0,0,.25)"/>`,
  leggings: (c) => `
    <path d="M300 130 L500 130 L520 840 L430 840 L400 330 L370 840 L280 840 Z" fill="${c}" ${S}/>
    ${seam("M300 180 L500 180 M400 180 L400 330")}`,
  joggers: (c) => `
    <path d="M285 140 L515 140 L555 800 L430 800 L400 340 L370 800 L245 800 Z" fill="${c}" ${S}/>
    ${seam("M285 185 L515 185 M250 760 L370 760 M430 760 L550 760 M400 185 L400 340 M300 230 Q330 300 310 380 M500 230 Q470 300 490 380")}`,
  trousers: (c) => `
    <path d="M285 140 L515 140 L545 820 L425 820 L400 340 L375 820 L255 820 Z" fill="${c}" ${S}/>
    ${seam("M285 185 L515 185 M400 185 L400 340 M330 340 L320 820 M470 340 L480 820")}`,
  shorts: (c) => `
    <path d="M270 260 L530 260 L585 600 L430 620 L400 440 L370 620 L215 600 Z" fill="${c}" ${S}/>
    ${seam("M270 300 L530 300 M400 300 L400 440")}${tab(480, 540)}`,
  bra: (c) => `
    <path d="M270 300 Q300 230 340 230 L400 330 L460 230 Q500 230 530 300 L560 520 L240 520 Z" fill="${c}" ${S}/>
    ${seam("M245 470 L555 470 M300 380 Q350 330 400 380 Q450 330 500 380")}`,
  dress: (c) => `
    <path d="M330 150 L300 320 L240 800 L560 800 L500 320 L470 150 Q400 195 330 150 Z" fill="${c}" ${S}/>
    ${seam("M300 360 L500 360 M300 420 L270 790 M360 420 L350 795 M440 420 L450 795 M500 420 L530 790")}`,
  cap: (c) => `
    <path d="M230 520 Q230 300 400 300 Q570 300 570 520 Z" fill="${c}" ${S}/>
    <path d="M230 520 Q400 490 690 560 Q560 600 230 555 Z" fill="${c}" ${S}/>
    <circle cx="400" cy="302" r="10" fill="rgba(0,0,0,.2)"/>${tab(388, 420)}`,
  beanie: (c) => `
    <path d="M250 600 Q240 300 400 280 Q560 300 550 600 Z" fill="${c}" ${S}/>
    <rect x="235" y="560" width="330" height="120" rx="18" fill="${c}" ${S}/>
    ${seam("M290 570 L290 670 M340 570 L340 670 M390 570 L390 670 M440 570 L440 670 M490 570 L490 670")}`,
  socks: (c) => `
    <path d="M330 200 L450 200 L450 560 Q450 620 520 660 L600 700 Q640 730 610 770 Q590 790 540 780 L380 720 Q330 700 330 640 Z" fill="${c}" ${S}/>
    ${seam("M330 250 L450 250 M330 270 L450 270")}`,
  bottle: (c) => `
    <rect x="320" y="270" width="160" height="540" rx="40" fill="${c}" ${S}/>
    <rect x="345" y="190" width="110" height="90" rx="16" fill="#2a2a2a"/>
    <path d="M370 190 Q400 140 430 190" fill="none" stroke="#2a2a2a" stroke-width="12"/>`,
  mat: (c) => `
    <rect x="200" y="300" width="400" height="460" rx="30" fill="${c}" ${S}/>
    <ellipse cx="400" cy="300" rx="200" ry="70" fill="${c}" ${S}/>
    <ellipse cx="400" cy="300" rx="120" ry="40" fill="rgba(0,0,0,.08)"/>`,
  backpack: (c) => `
    <path d="M330 230 Q330 160 400 160 Q470 160 470 230" fill="none" stroke="${c}" stroke-width="18"/>
    <rect x="240" y="220" width="320" height="560" rx="70" fill="${c}" ${S}/>
    <rect x="290" y="500" width="220" height="220" rx="30" fill="${c}" ${S}/>
    ${seam("M290 560 L510 560")}${tab(388, 280)}`,
  crossbody: (c) => `
    <path d="M220 420 Q400 120 580 420" fill="none" stroke="#2a2a2a" stroke-width="10"/>
    <rect x="220" y="400" width="360" height="230" rx="80" fill="${c}" ${S}/>
    ${seam("M250 470 Q400 440 550 470")}${tab(388, 520)}`,
  tote: (c) => `
    <path d="M320 380 Q320 220 400 220 Q480 220 480 380" fill="none" stroke="${c}" stroke-width="16"/>
    <path d="M210 370 L590 370 L620 780 L180 780 Z" fill="${c}" ${S}/>${tab(388, 430)}`,
};

function productSvg(shape, hex) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${TILE}"/>${SHAPES[shape](hex)}<ellipse cx="400" cy="880" rx="230" ry="16" fill="rgba(0,0,0,.05)"/></svg>`;
}

const image = (shape, hex) => {
  const file = `${shape}-${hex.replace("#", "").toLowerCase()}.svg`;
  writeFileSync(path.join(imgDir, file), productSvg(shape, hex));
  return `/placeholder/${file}`;
};

const created = (daysAgo) => new Date(Date.UTC(2026, 9, 28) - daysAgo * 86400000).toISOString();

// ---------- Brands ----------

const brand = (id, name, slug, order, description, image = null) => ({
  id, name, slug, description, logo: null, image, order, createdAt: created(60),
});

const brands = [
  brand("b_volae", "Volae", "volae", 1, "Our own technical apparel, designed to move from the studio to the street.", "/images/story.jpg"),
  brand("b_northline", "Northline", "northline", 2, "Outerwear engineered for cold snaps, rainy days and windy runs.", "/images/men.jpg"),
  brand("b_kinetiq", "Kinetiq", "kinetiq", 3, "Lightweight running and training gear built for speed.", "/images/home.jpg"),
  brand("b_sola", "Sola Studio", "sola-studio", 4, "Buttery-soft yoga and lounge essentials.", "/images/women.jpg"),
  brand("b_harbor", "Harbor & Pine", "harbor-and-pine", 5, "Bags and accessories for every commute and every trip.", "/images/sale.jpg"),
];

// ---------- Categories ----------

const cat = (id, name, slug, parentId, order, description = "", image = null) => ({
  id, name, slug, parentId, description, image, order, createdAt: created(60),
});

const categories = [
  cat("c_women", "Women", "women", null, 1, "Leggings, outerwear and tops designed for how you move.", "/images/women.jpg"),
  cat("c_men", "Men", "men", null, 2, "Technical layers and everyday essentials that keep up with you.", "/images/men.jpg"),
  cat("c_accessories", "Accessories", "accessories", null, 3, "The finishing touches: caps, socks, bottles and mats.", "/images/sale.jpg"),
  cat("c_bags", "Bags", "bags", null, 4, "Backpacks, crossbody and belt bags for every day.", "/images/new-in.jpg"),

  cat("c_w_coats", "Coats & Jackets", "women-coats-jackets", "c_women", 1, "Puffers, rain shells and running jackets."),
  cat("c_w_hoodies", "Hoodies & Sweatshirts", "women-hoodies-sweatshirts", "c_women", 2),
  cat("c_w_leggings", "Leggings", "women-leggings", "c_women", 3),
  cat("c_w_joggers", "Joggers", "women-joggers", "c_women", 4),
  cat("c_w_tops", "Tops", "women-tops", "c_women", 5),
  cat("c_w_bras", "Sports Bras", "women-sports-bras", "c_women", 6),
  cat("c_w_shorts", "Shorts", "women-shorts", "c_women", 7),
  cat("c_w_dresses", "Dresses", "women-dresses", "c_women", 8),

  cat("c_m_hoodies", "Hoodies & Sweatshirts", "men-hoodies-sweatshirts", "c_men", 1),
  cat("c_m_coats", "Coats & Jackets", "men-coats-jackets", "c_men", 2, "Puffers, rain shells and running jackets."),
  cat("c_m_shorts", "Shorts", "men-shorts", "c_men", 3),
  cat("c_m_trousers", "Trousers", "men-trousers", "c_men", 4),
  cat("c_m_joggers", "Joggers", "men-joggers", "c_men", 5),
  cat("c_m_tees", "T-Shirts", "men-t-shirts", "c_men", 6),
  cat("c_m_longsleeve", "Long Sleeve Tops", "men-long-sleeve-tops", "c_men", 7),
  cat("c_m_polos", "Polo Shirts", "men-polo-shirts", "c_men", 8),

  cat("c_a_caps", "Caps", "caps", "c_accessories", 1),
  cat("c_a_hats", "Hats", "hats", "c_accessories", 2),
  cat("c_a_socks", "Socks", "socks", "c_accessories", 3),
  cat("c_a_bottles", "Water Bottles", "water-bottles", "c_accessories", 4),
  cat("c_a_mats", "Yoga Mats", "yoga-mats", "c_accessories", 5),

  cat("c_b_backpacks", "Backpacks", "backpacks", "c_bags", 1),
  cat("c_b_crossbody", "Crossbody Bags", "crossbody-bags", "c_bags", 2),
  cat("c_b_totes", "Tote Bags", "tote-bags", "c_bags", 3),
];

// ---------- Products ----------

const C = {
  black: { name: "Black", hex: "#1c1c1c" },
  white: { name: "White", hex: "#f7f5f0" },
  bone: { name: "Bone", hex: "#e2dccf" },
  navy: { name: "True Navy", hex: "#2b3550" },
  graphite: { name: "Graphite Grey", hex: "#4a4d52" },
  espresso: { name: "Espresso", hex: "#3b2a24" },
  taupe: { name: "Taupe", hex: "#a39789" },
  olive: { name: "Dark Olive", hex: "#2f3a2b" },
  blue: { name: "Oasis Blue", hex: "#6a85c1" },
  teal: { name: "Storm Teal", hex: "#1f5868" },
  red: { name: "Love Red", hex: "#b4232f" },
  pink: { name: "Pink Mist", hex: "#e8c4c8" },
  sage: { name: "Sage", hex: "#a8b5a0" },
  heather: { name: "Heathered Grey", hex: "#9a9ca0" },
};

const APPAREL = ["XS", "S", "M", "L", "XL", "XXL"];
const WOMEN = ["0", "2", "4", "6", "8", "10", "12", "14"];
const ONE = ["One Size"];
let n = 0;

const product = ({
  name, brandId, categoryId, price, salePrice = null, shape, colors, sizes = APPAREL,
  activities = [], badge = null, isNew = false, days, description, features = [],
}) => {
  n += 1;
  const colorList = colors.map((c) => ({ ...c, image: image(shape, c.hex) }));
  return {
    id: `p_${String(n).padStart(3, "0")}`,
    name,
    slug: name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    brandId, categoryId, price, salePrice, description, features,
    colors: colorList,
    sizes, activities,
    images: colorList.map((c) => c.image),
    badge, isNew, isActive: true,
    createdAt: created(days), updatedAt: created(days),
  };
};

const PUFFER_FEATURES = ["Water-repellent fabric", "Responsibly sourced down", "Hidden interior pocket", "Two-way zip"];
const RUN_FEATURES = ["Sweat-wicking", "Four-way stretch", "Reflective details", "Zippered pocket"];

const products = [
  product({ name: "Women's Featherweight Cropped Quilted Puffer", brandId: "b_volae", categoryId: "c_w_coats", price: 6398000, shape: "puffer", colors: [C.black, C.white, C.bone], activities: ["Casual"], isNew: true, days: 1, features: PUFFER_FEATURES, description: "A cropped, wave-quilted puffer that packs serious warmth without the bulk. Water-repellent fabric keeps light rain off while responsibly sourced down traps heat." }),
  product({ name: "Men's Featherweight Stand-Neck Quilted Puffer", brandId: "b_volae", categoryId: "c_m_coats", price: 6398000, shape: "puffer", colors: [C.black, C.navy, C.taupe], activities: ["Casual"], isNew: true, days: 1, features: PUFFER_FEATURES, description: "Wave-quilted down with a tall stand neck that blocks the wind. Light enough to wear every day, warm enough for real winter." }),
  product({ name: "Women's Wunder Puff Bomber Hoodie Jacket", brandId: "b_northline", categoryId: "c_w_coats", price: 5348000, shape: "puffer", colors: [C.black, C.espresso, C.taupe, C.white], activities: ["Casual"], badge: "Bestseller", days: 6, features: PUFFER_FEATURES, description: "A bomber-length puffer with an insulated hood and ribbed hem. Built for cold commutes and colder weekends." }),
  product({ name: "Stretch Glyde Waterproof Jacket", brandId: "b_northline", categoryId: "c_m_coats", price: 4248000, shape: "jacket", colors: [C.olive, C.blue, C.black, C.navy], activities: ["Running", "Casual"], badge: "Bestseller", days: 8, features: ["Waterproof, seam-sealed", "Stretch shell", "Adjustable hood", "Packable"], description: "A seam-sealed, stretchy shell that keeps rain out and moves with you. Packs into its own pocket." }),
  product({ name: "Women's Rain Runner Hooded Jacket", brandId: "b_kinetiq", categoryId: "c_w_coats", price: 3648000, shape: "jacket", colors: [C.blue, C.black, C.pink], activities: ["Running"], isNew: true, days: 3, features: RUN_FEATURES, description: "A featherlight running shell with a cinchable hood and reflective details for early-morning miles." }),
  product({ name: "Men's Pace Breaker Wind Jacket", brandId: "b_kinetiq", categoryId: "c_m_coats", price: 3248000, salePrice: 2148000, shape: "jacket", colors: [C.teal, C.graphite], activities: ["Running"], days: 20, features: RUN_FEATURES, description: "Wind-resistant and breathable, with a back vent that dumps heat when you pick up the pace." }),

  product({ name: "Metal Vent Tech Short-Sleeve Shirt", brandId: "b_volae", categoryId: "c_m_tees", price: 1049000, shape: "tee", colors: [C.black, C.red, C.navy, C.heather, C.teal, C.olive, C.bone], activities: ["Workout", "Running"], badge: "Bestseller", days: 10, features: ["Anti-stink treatment", "Seamless construction", "Breathable mesh zones"], description: "Our seamless training tee, knit with breathable mesh zones exactly where you heat up. Anti-stink treatment keeps it fresh." }),
  product({ name: "Metal Vent Tech Long-Sleeve Shirt", brandId: "b_volae", categoryId: "c_m_longsleeve", price: 1349000, shape: "longsleeve", colors: [C.teal, C.red, C.navy, C.blue, C.heather, C.black, C.white], activities: ["Workout", "Running"], badge: "Bestseller", days: 10, features: ["Anti-stink treatment", "Seamless construction", "Breathable mesh zones"], description: "The long-sleeve version of our bestselling seamless training shirt." }),
  product({ name: "Grand Standard Long-Sleeve Polo", brandId: "b_volae", categoryId: "c_m_polos", price: 1649000, shape: "polo", colors: [C.espresso, C.navy, C.black, C.bone, C.blue, C.taupe], activities: ["Casual", "Golf"], badge: "Online Exclusive", days: 4, features: ["Heavyweight cotton-blend", "Relaxed fit", "Three-button placket"], description: "A heavyweight long-sleeve polo with a relaxed fit that looks sharp from the office to the clubhouse." }),
  product({ name: "Fairway Performance Polo", brandId: "b_kinetiq", categoryId: "c_m_polos", price: 1249000, shape: "polo", colors: [C.white, C.navy, C.sage], activities: ["Golf", "Tennis & Padel"], isNew: true, days: 2, features: ["Sweat-wicking", "UV protection", "Four-way stretch"], description: "Cool, stretchy and sweat-wicking for the full 18 holes." }),
  product({ name: "Steady State Hoodie", brandId: "b_volae", categoryId: "c_m_hoodies", price: 1849000, shape: "hoodie", colors: [C.heather, C.black, C.navy, C.olive], activities: ["Lounge", "Casual"], days: 12, features: ["Brushed French terry", "Kangaroo pocket", "Classic fit"], description: "Brushed French terry that's soft on the inside and holds its shape on the outside." }),
  product({ name: "Men's Pace Breaker Lined Short 7\"", brandId: "b_kinetiq", categoryId: "c_m_shorts", price: 1149000, shape: "shorts", colors: [C.black, C.navy, C.graphite, C.teal], activities: ["Running", "Workout"], badge: "Bestseller", days: 15, features: RUN_FEATURES, description: "Lightweight, quick-drying running shorts with a built-in liner and a zippered back pocket." }),
  product({ name: "ABC Classic-Fit Trouser", brandId: "b_volae", categoryId: "c_m_trousers", price: 2049000, shape: "trousers", sizes: ["28", "30", "32", "34", "36", "38"], colors: [C.black, C.navy, C.taupe], activities: ["Casual"], days: 18, features: ["Anti-ball, crotch gusset", "Four-way stretch", "Hidden phone pocket"], description: "Our engineered trouser with a gusseted crotch and four-way stretch fabric. Looks tailored, feels like joggers." }),
  product({ name: "Surge Jogger", brandId: "b_kinetiq", categoryId: "c_m_joggers", price: 1749000, salePrice: 1149000, shape: "joggers", colors: [C.black, C.graphite], activities: ["Running", "Workout"], days: 25, features: RUN_FEATURES, description: "Tapered, lightweight joggers made for warm-ups, cool-downs and everything in between." }),

  product({ name: "Align High-Rise Pant 28\"", brandId: "b_sola", categoryId: "c_w_leggings", price: 1649000, shape: "leggings", sizes: WOMEN, colors: [C.black, C.espresso, C.sage, C.navy, C.pink], activities: ["Yoga", "Lounge"], badge: "Bestseller", days: 9, features: ["Buttery-soft, weightless feel", "Hidden waistband pocket", "High rise"], description: "A buttery-soft, weightless legging designed for yoga and anything that calls for total freedom of movement." }),
  product({ name: "Wunder Train High-Rise Tight 25\"", brandId: "b_volae", categoryId: "c_w_leggings", price: 1549000, shape: "leggings", sizes: WOMEN, colors: [C.black, C.navy, C.red], activities: ["Workout"], isNew: true, days: 3, features: ["Sweat-wicking", "Four-way stretch", "High rise"], description: "Supportive, sweat-wicking tights built for hard training sessions." }),
  product({ name: "Scuba Oversized Half-Zip Hoodie", brandId: "b_sola", categoryId: "c_w_hoodies", price: 1849000, shape: "hoodie", sizes: ["XS/S", "M/L", "XL/XXL"], colors: [C.heather, C.bone, C.pink, C.black], activities: ["Lounge", "Casual"], badge: "Bestseller", days: 7, features: ["Cotton-blend fleece", "Oversized fit", "Thumbholes"], description: "Our cosy cotton-blend fleece hoodie in an oversized fit, with a half-zip and kangaroo pocket." }),
  product({ name: "Softstreme High-Rise Jogger", brandId: "b_sola", categoryId: "c_w_joggers", price: 1749000, shape: "joggers", sizes: WOMEN, colors: [C.taupe, C.black, C.sage], activities: ["Lounge"], isNew: true, days: 2, features: ["Soft, drapey fabric", "Tapered leg", "Side pockets"], description: "Ultra-soft, drapey joggers that feel like your favourite pyjamas but look polished enough for brunch." }),
  product({ name: "Swiftly Tech Short-Sleeve Shirt", brandId: "b_kinetiq", categoryId: "c_w_tops", price: 949000, shape: "tee", sizes: WOMEN, colors: [C.white, C.black, C.blue, C.pink, C.sage], activities: ["Running", "Workout"], badge: "Bestseller", days: 11, features: ["Seamless construction", "Anti-stink", "Slim fit"], description: "A seamless running tee with breathable knit and a slim fit that stays put." }),
  product({ name: "Energy Longline Bra", brandId: "b_volae", categoryId: "c_w_bras", price: 899000, salePrice: 599000, shape: "bra", sizes: ["XS", "S", "M", "L", "XL"], colors: [C.black, C.red, C.sage], activities: ["Workout"], days: 30, features: ["Medium support", "Removable cups", "Longline fit"], description: "Medium-support bra with a longline band and strappy back for high-intensity training." }),
  product({ name: "Hotty Hot High-Rise Short 4\"", brandId: "b_kinetiq", categoryId: "c_w_shorts", price: 849000, shape: "shorts", sizes: WOMEN, colors: [C.black, C.blue, C.pink, C.white], activities: ["Running"], days: 14, features: ["Lightweight", "Built-in liner", "Zippered pocket"], description: "Lightweight running shorts with a high rise and built-in liner." }),
  product({ name: "Court Rival Tennis Dress", brandId: "b_volae", categoryId: "c_w_dresses", price: 1949000, shape: "dress", sizes: WOMEN, colors: [C.white, C.navy], activities: ["Tennis & Padel"], isNew: true, days: 2, features: ["Built-in shorts", "Ball pocket", "Sweat-wicking"], description: "A swingy tennis dress with built-in shorts and a pocket that holds a ball." }),

  product({ name: "Fast and Free Running Cap", brandId: "b_kinetiq", categoryId: "c_a_caps", price: 549000, shape: "cap", sizes: ONE, colors: [C.white, C.black, C.blue], activities: ["Running"], days: 5, features: ["Lightweight", "Sweat-wicking band"], description: "A featherweight cap with a sweat-wicking band and reflective details." }),
  product({ name: "Classic Knit Beanie", brandId: "b_northline", categoryId: "c_a_hats", price: 649000, shape: "beanie", sizes: ONE, colors: [C.bone, C.black, C.red, C.olive], activities: ["Casual"], isNew: true, days: 1, features: ["Wool-blend", "Fold-over cuff"], description: "A soft wool-blend beanie with a classic fold-over cuff." }),
  product({ name: "Daily Stride Crew Sock 3 Pack", brandId: "b_volae", categoryId: "c_a_socks", price: 449000, shape: "socks", sizes: ["S", "M", "L"], colors: [C.white, C.black, C.heather], activities: ["Running", "Workout"], days: 16, features: ["Arch support", "Cushioned sole"], description: "Cushioned crew socks with arch support, in a pack of three." }),
  product({ name: "Back to Life Sport Bottle 710ml", brandId: "b_harbor", categoryId: "c_a_bottles", price: 549000, shape: "bottle", sizes: ONE, colors: [C.sage, C.black, C.pink, C.blue], activities: ["Workout", "Yoga"], days: 13, features: ["Double-wall insulated", "Keeps cold 24 hours"], description: "Insulated stainless steel bottle that keeps drinks cold for 24 hours." }),
  product({ name: "The Mat 5mm", brandId: "b_sola", categoryId: "c_a_mats", price: 1449000, shape: "mat", sizes: ONE, colors: [C.black, C.sage, C.pink], activities: ["Yoga"], badge: "Bestseller", days: 22, features: ["Grippy top layer", "Natural rubber base", "Antimicrobial"], description: "A grippy, cushioned mat for every practice." }),

  product({ name: "City Adventurer Backpack 20L", brandId: "b_harbor", categoryId: "c_b_backpacks", price: 2149000, shape: "backpack", sizes: ONE, colors: [C.black, C.olive, C.navy], activities: ["Casual"], isNew: true, days: 4, features: ["Laptop sleeve", "Water-repellent", "Luggage pass-through"], description: "A sleek 20L backpack with a padded laptop sleeve and plenty of organisation." }),
  product({ name: "Everywhere Crossbody Bag 2L", brandId: "b_harbor", categoryId: "c_b_crossbody", price: 749000, shape: "crossbody", sizes: ONE, colors: [C.black, C.bone, C.pink, C.olive, C.blue], activities: ["Casual"], badge: "Bestseller", days: 6, features: ["Adjustable strap", "Water-repellent", "Interior pockets"], description: "The hands-free bag that goes everywhere: across the body, on the hip or over the shoulder." }),
  product({ name: "Daily Multi-Pocket Tote 20L", brandId: "b_harbor", categoryId: "c_b_totes", price: 1649000, salePrice: 1099000, shape: "tote", sizes: ONE, colors: [C.taupe, C.black], activities: ["Casual"], days: 28, features: ["Padded laptop sleeve", "Zip closure"], description: "A structured tote with a padded laptop sleeve and multiple pockets." }),
];

writeFileSync(path.join(seedDir, "brands.json"), JSON.stringify(brands, null, 2) + "\n");
writeFileSync(path.join(seedDir, "categories.json"), JSON.stringify(categories, null, 2) + "\n");
writeFileSync(path.join(seedDir, "products.json"), JSON.stringify(products, null, 2) + "\n");
writeFileSync(path.join(seedDir, "subscribers.json"), "[]\n");
writeFileSync(path.join(seedDir, "orders.json"), "[]\n");
const settings = {
  homeFeatured: {
    title: "Cold snaps, rainy days, windy runs. There’s outerwear for it all.",
    categoryIds: ["c_w_coats", "c_m_coats"],
  },
};
writeFileSync(path.join(seedDir, "settings.json"), JSON.stringify(settings, null, 2) + "\n");
console.log(`Seed written: ${brands.length} brands, ${categories.length} categories, ${products.length} products.`);
