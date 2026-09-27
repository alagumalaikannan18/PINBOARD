import json
import re

new_products = [
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

# Normalize line endings for replacement
is_crlf = '\r\n' in content
clean_content = content.replace('\r\n', '\n')

pattern = r'(\s*\{\s*"id":\s*152[\s\S]*?\}\s*\n)(\];\s*\n\s*function getSaleableProducts)'

json_snippets = []
for p in new_products:
    json_str = json.dumps(p, indent=2)
    formatted = '  ' + json_str.replace('\n', '\n  ')
    json_snippets.append(formatted)

new_block = ',\n' + ',\n'.join(json_snippets) + '\n'

def repl(m):
    return m.group(1) + new_block + m.group(2)

updated_content, count = re.subn(pattern, repl, clean_content, count=1)

if count == 0:
    print("CRITICAL ERROR: Pattern match failed for ID 152 insertion point.")
    exit(1)

if is_crlf:
    updated_content = updated_content.replace('\n', '\r\n')

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("SUCCESSFULLY inserted new products 153 to 158 into js/products-data.js!")
