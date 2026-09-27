import json
import re

all_158_products = [
  # Products 152 to 158:
  {
    "id": 152,
    "slug": "stay-hard-goggins",
    "title": "STAY HARD | David Goggins Motivation",
    "subtitle": "Relentless Mindset · Stoic Discipline",
    "category": "Motivation",
    "collection": "Mindset & Stoicism",
    "artist": "Studio PINBOARD",
    "subject": "Monochrome portrait of running athlete with bold Stay Hard typography",
    "tags": [
      "motivation",
      "stay hard",
      "david goggins",
      "discipline",
      "mindset",
      "gym & fitness",
      "running",
      "relentless",
      "fitness",
      "gym",
      "stoicism",
      "quote"
    ],
    "keywords": "stay hard david goggins motivation discipline gym fitness runner running quote mindset stoicism poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/stay-hard.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 5,
    "reviewCount": 128,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "STAY HARD — The ultimate tribute to unyielding discipline, relentless focus, and human potential inspired by David Goggins. Printed with high-contrast archival inks on premium 300 GSM museum-grade matte art paper.",
    "features": [
      "Bold monochrome Stay Hard typographic design",
      "Printed on 300 GSM premium matte art paper",
      "Anti-glare archival finish for crisp contrast",
      "Rolled & packed flat in a rigid protective tube",
      "Poster format depends on the selected size: A4 posters include a clean white border, split/combo posters are printed without a border, and A6 posters are printed without a border."
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Home gyms",
      "Workspaces",
      "Bedrooms",
      "Study spaces"
    ],
    "relatedIds": [
      1,
      2,
      15
    ]
  },
  {
    "id": 153,
    "slug": "speed-builds-legends-ajith-kumar",
    "title": "SPEED BUILDS LEGENDS | Ajith Kumar F1 Racing",
    "subtitle": "Motorsport Grit · Ajith Kumar Racing Tribute",
    "category": "Cars",
    "collection": "Supercars & Speed",
    "artist": "Studio PINBOARD",
    "subject": "Ajith Kumar in high-contrast red visor helmet with F1 racecar in rain",
    "tags": [
      "cars",
      "racing",
      "f1",
      "ajith kumar",
      "ak",
      "speed",
      "motorsport",
      "motivation",
      "legend",
      "formula 1"
    ],
    "keywords": "speed builds legends ajith kumar ak racing f1 formula 1 motorsport sports car helmet quote poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557587.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "SPEED BUILDS LEGENDS — A high-octane tribute to racing passion and relentless speed featuring Ajith Kumar in a crisp motorsport helmet with F1 track aesthetics. Printed on premium 300 GSM museum-grade matte art paper.",
    "features": [
      "High-contrast red visor racing typography",
      "Printed on 300 GSM premium matte art paper",
      "Anti-glare archival finish for maximum detail",
      "Rolled & packed flat in a rigid protective tube",
      "Ready to pin, tape, or frame"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Bedrooms",
      "Workspaces",
      "Studios",
      "Garage nooks"
    ],
    "relatedIds": [
      9,
      101,
      107
    ]
  },
  {
    "id": 154,
    "slug": "more-than-a-player-cr7",
    "title": "MORE THAN A PLAYER | Cristiano Ronaldo CR7",
    "subtitle": "Relentless Focus · Hard Work & Consistency",
    "category": "Sports",
    "collection": "Football Legends",
    "artist": "Studio PINBOARD",
    "subject": "Intense close-up portrait of Cristiano Ronaldo with CR7 typography and discipline quote",
    "tags": [
      "sports",
      "football",
      "cristiano ronaldo",
      "cr7",
      "discipline",
      "motivation",
      "hard work",
      "consistency",
      "goat",
      "portugal"
    ],
    "keywords": "more than a player cristiano ronaldo cr7 discipline builds freedom hard work focus consistency results football sports poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557713.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "MORE THAN A PLAYER — An iconic close-up portrait of Cristiano Ronaldo embodying unyielding focus, hard work, and footballing greatness. Printed on 300 GSM museum-grade matte art paper.",
    "features": [
      "Bold vertical CR7 typographic layout",
      "High-detail skin texture & dark vignette depth",
      "Printed on 300 GSM archival matte paper",
      "Rolled & packed flat in a rigid tube",
      "Ideal for sports fans and gym motivators"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Sports rooms",
      "Home gyms",
      "Bedrooms",
      "Workspaces"
    ],
    "relatedIds": [
      1,
      4,
      132
    ]
  },
  {
    "id": 155,
    "slug": "ambition-wolf-of-wall-street",
    "title": "AMBITION | The Wolf of Wall Street",
    "subtitle": "Bigger Than Yesterday · High Standards Mindset",
    "category": "Motivation",
    "collection": "Mindset & Stoicism",
    "artist": "Studio PINBOARD",
    "subject": "Jordan Belfort in sunglasses reflecting New York city skyline with bold AMBITION typography",
    "tags": [
      "motivation",
      "ambition",
      "wolf of wall street",
      "leonardo dicaprio",
      "mindset",
      "wealth",
      "business",
      "city skyline",
      "stoic"
    ],
    "keywords": "ambition bigger than yesterday same vision higher standards wolf of wall street jordan belfort leonardo dicaprio motivation movie poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557718.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "AMBITION — Inspired by The Wolf of Wall Street, capturing high vision, relentless ambition, and uncompromising standards. Printed on 300 GSM archival matte paper.",
    "features": [
      "Modern monochrome portrait with yellow city contrast",
      "Printed on 300 GSM museum-grade matte art paper",
      "Anti-glare finish for sharp text legibility",
      "Packed in a protective rigid tube",
      "Pairs seamlessly with motivation & mindset setups"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Offices",
      "Trading desks",
      "Study nooks",
      "Living rooms"
    ],
    "relatedIds": [
      112,
      113,
      152
    ]
  },
  {
    "id": 156,
    "slug": "some-legends-never-die-logan",
    "title": "SOME LEGENDS NEVER DIE | Logan Wolverine",
    "subtitle": "The End Is Just Another Beginning · Marvel Cinematic Tribute",
    "category": "Movies",
    "collection": "Marvel & Cinema",
    "artist": "Studio PINBOARD",
    "subject": "Wolverine on rocky peak with adamantium claws and yellow sun profile silhouette",
    "tags": [
      "movies",
      "logan",
      "wolverine",
      "marvel",
      "x-men",
      "hugh jackman",
      "cinema",
      "superhero",
      "legend"
    ],
    "keywords": "some legends never die logan wolverine marvel x-men hugh jackman cinema superhero comic movie poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557733.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "SOME LEGENDS NEVER DIE — A powerful tribute to Hugh Jackman's Logan, featuring adamantium claws on a golden sunlit peak. Printed on 300 GSM museum-grade matte art paper.",
    "features": [
      "Vibrant yellow tone with heavy black silhouette contrast",
      "Printed on 300 GSM premium matte art paper",
      "Archival anti-glare finish",
      "Rolled & packed flat in a rigid protective tube",
      "Must-have for Marvel & X-Men collectors"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Bedrooms",
      "Movie rooms",
      "Gaming stations",
      "Workspaces"
    ],
    "relatedIds": [
      6,
      12,
      65
    ]
  },
  {
    "id": 157,
    "slug": "strength-greek-sculpture",
    "title": "STRENGTH | Classical Greek Sculpture",
    "subtitle": "Not Just a Body, A Mindset · Built Through Hard Work",
    "category": "Motivation",
    "collection": "Mindset & Stoicism",
    "artist": "Studio PINBOARD",
    "subject": "Monochrome rear view of sculpted Greek statue with STRENGTH typography",
    "tags": [
      "motivation",
      "strength",
      "greek statue",
      "sculpture",
      "gym",
      "fitness",
      "stoic",
      "discipline",
      "mindset",
      "physique"
    ],
    "keywords": "strength not just a body a mindset built through hard work not luck greek sculpture statue gym fitness stoic motivation poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557749.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "STRENGTH — Classical Greek marble physique depicting stoic endurance, physical mastery, and relentless focus. Printed on 300 GSM museum-grade matte art paper.",
    "features": [
      "Chiaroscuro lighting with deep blacks and marble detail",
      "Printed on 300 GSM premium matte art paper",
      "Non-reflective archival surface",
      "Packed flat in a rigid protective tube",
      "Ideal for gym & stoic aesthetic spaces"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Home gyms",
      "Fitness studios",
      "Bedrooms",
      "Study spaces"
    ],
    "relatedIds": [
      119,
      122,
      152
    ]
  },
  {
    "id": 158,
    "slug": "focus-arnold-schwarzenegger",
    "title": "FOCUS | Arnold Schwarzenegger Bodybuilding",
    "subtitle": "Same Goal, Less Distractions · Focus Turns Effort Into Power",
    "category": "Motivation",
    "collection": "Mindset & Stoicism",
    "artist": "Studio PINBOARD",
    "subject": "Classic black & white side chest pose of Arnold Schwarzenegger with FOCUS typography",
    "tags": [
      "motivation",
      "focus",
      "arnold schwarzenegger",
      "bodybuilding",
      "gym",
      "fitness",
      "discipline",
      "power",
      "mr olympia"
    ],
    "keywords": "focus same goal less distractions greater results arnold schwarzenegger bodybuilding gym fitness mr olympia motivation poster",
    "Size": "A4 (210 × 297 mm)",
    "badge": "NEW",
    "images": [
      "poster/opt/1557750.webp"
    ],
    "regularPrice": 99,
    "salePrice": 60,
    "rating": 0,
    "reviewCount": 0,
    "pieces": 1,
    "material": "300 GSM Premium Matte Sheet",
    "finish": "Smooth Matte Finish",
    "frameIncluded": False,
    "description": "FOCUS — Featuring 7x Mr. Olympia Arnold Schwarzenegger in a golden-era side chest pose. A timeless reminder to eliminate distractions and pursue mastery. Printed on 300 GSM matte art paper.",
    "features": [
      "Golden era bodybuilding monochrome aesthetic",
      "Printed on 300 GSM museum-grade matte art paper",
      "Anti-glare archival print for deep contrast",
      "Packed flat in reinforced rigid packaging",
      "Essential wall art for bodybuilding fans"
    ],
    "specifications": {
      "Size": "A4 (210 × 297 mm)",
      "Material": "300 GSM Premium Matte Sheet",
      "Finish": "Smooth Matte Finish",
      "Pieces": "1",
      "Frame": "Not Included",
      "Packaging": "Rigid tube, flat-packed"
    },
    "perfectFor": [
      "Home gyms",
      "Workspaces",
      "Bedrooms",
      "Fitness rooms"
    ],
    "relatedIds": [
      114,
      122,
      152
    ]
  }
]

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the PINBOARD_PRODUCTS array declaration
start_marker = 'var PINBOARD_PRODUCTS = ['
end_marker = 'function getSaleableProducts'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Failed to find start/end markers:", start_idx, end_idx)
    exit(1)

raw_body = content[start_idx + len(start_marker):end_idx]

# Parse existing product objects using regex
matches = list(re.finditer(r'\{\s*"id":\s*(\d+)[\s\S]*?\n  \}', raw_body))

existing_map = {}
for m in matches:
    try:
        obj = json.loads(m.group(0))
        existing_map[obj['id']] = obj
    except Exception as e:
        pass

# Add new products 152 through 158
for p in all_158_products:
    existing_map[p['id']] = p

sorted_keys = sorted(existing_map.keys())
print(f"Total merged products count: {len(sorted_keys)} (IDs: {min(sorted_keys)} to {max(sorted_keys)})")

merged_products = [existing_map[k] for k in sorted_keys]

formatted_json = json.dumps(merged_products, indent=2)

profiles_block = """

// ---------- COLLECTION PROFILES (NON-SALEABLE SHOWCASE ASSETS) ----------
var PINBOARD_COLLECTION_PROFILES = [
  { id: 991, title: "Anime Collection", category: "Anime", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_anime.webp"] },
  { id: 992, title: "Cars Collection", category: "Cars", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_cars.webp"] },
  { id: 993, title: "Football Collection", category: "Sports", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_football.webp"] },
  { id: 994, title: "Gaming Collection", category: "Gaming", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_gaming.webp"] },
  { id: 995, title: "Motivation Collection", category: "Motivation", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_motivation.webp"] },
  { id: 996, title: "Movies Collection", category: "Movies", type: "collection-profile", saleable: false, isCollection: true, images: ["cat_movies.webp"] }
];

"""

new_content = content[:start_idx] + 'var PINBOARD_PRODUCTS = ' + formatted_json + ';' + profiles_block + content[end_idx:]

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESSFULLY rebuilt js/products-data.js with 158 clean products!")
