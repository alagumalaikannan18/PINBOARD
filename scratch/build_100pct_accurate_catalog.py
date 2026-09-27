import json
import os

with open('d:/PINBOARD-GIT/scratch/ocr_results.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

# Map each poster to its true visual content
accurate_catalog = []

for idx, item in enumerate(ocr_data):
    fname = item['filename']
    ocr_text = item['ocrText'].upper()
    curated = item['curated']
    
    cat = "Movies"
    subcat = "Hollywood"
    title = f"Poster #{idx+1}"
    badge = None
    
    # 1. CARS
    if any(k in fname or k in ocr_text for k in ['1557527', '1557528', '1557529', '1555982', '1556440', '1562819', 'PORSCHE', 'FERRARI', 'MUSTANG', 'BMW', 'LAMBORGHINI', 'GTR', 'M8', '1562820']):
        cat = "Cars"
        if 'FERRARI' in ocr_text or '250 GTO' in ocr_text or '1557528' in fname:
            title = "Ferrari 250 GTO | Minimalist Rosso Corsa"
            subcat = "Ferrari"
            badge = "HOT"
        elif 'PORSCHE' in ocr_text or '911' in ocr_text or '1557527' in fname or '1557529' in fname or '1562819' in fname:
            title = "Porsche 911 GT3 RS | German Engineering"
            subcat = "Porsche"
            badge = "BESTSELLER"
        elif 'MUSTANG' in ocr_text or '1562820' in fname:
            title = "Ford Mustang | American Muscle Edition"
            subcat = "Mustang"
        elif 'BMW' in ocr_text or 'M8' in ocr_text or '1555982' in fname or '1556440' in fname:
            title = "BMW M8 Competition | Performance Edition"
            subcat = "BMW"
            badge = "TRENDING"
        else:
            title = "Supercar Performance | High-Gloss Matte"
            subcat = "Supercars"

    # 2. GAMING
    elif any(k in fname or k in ocr_text for k in ['1556993', '1556996', 'file_00000000d1a482118837991a9779439a', 'ARTHUR', 'RDR', 'GTA', 'RED DEAD', 'ROCKSTAR']):
        cat = "Gaming"
        if 'GTA' in ocr_text or '1556725' in fname:
            title = "Grand Theft Auto VI | Jason & Lucia Vice City"
            subcat = "GTA"
            badge = "BESTSELLER"
        else:
            title = "Arthur Morgan | Red Dead Redemption II"
            subcat = "Red Dead Redemption"
            badge = "STAFF PICK"

    # 3. SPORTS
    elif any(k in fname or k in ocr_text for k in ['1556707', '1556717', '1556721', '1556725', '1556894', '1557012', '1562663', 'RONALDO', 'CR7', 'MESSI', 'LEO IN PINK', 'NOTORIOUS', 'VODAFONE', 'MANCHESTER']):
        cat = "Sports"
        if 'NOTORIOUS' in ocr_text or '1562663' in fname:
            title = "Conor McGregor | The Notorious UFC Legend"
            subcat = "Combat Sports"
        elif 'MESSI' in ocr_text or 'LEO' in ocr_text or '1556894' in fname or '1557012' in fname:
            title = "Lionel Messi | The GOAT Pitch Mastery"
            subcat = "Lionel Messi"
            badge = "HOT"
        else:
            title = "Cristiano Ronaldo | CR7 Football Legend"
            subcat = "Cristiano Ronaldo"
            badge = "BESTSELLER"

    # 4. MOTIVATION
    elif any(k in fname or k in ocr_text for k in ['1555984', '1555986', '1556441', '1556915', '1556935', '1557749', '1557750', '1557751', '1562840', '1562841', 'STRENGTH', 'FOCUS', 'STAY HARD', 'DISCIPLINE', 'CONSISTENCY', 'SPARTAN', 'ROCKY', 'TIRED']):
        cat = "Motivation"
        if 'STRENGTH' in ocr_text or '1557749' in fname:
            title = "Strength | Classical Greek Sculpture"
            subcat = "Ambition"
        elif 'FOCUS' in ocr_text or '1557750' in fname:
            title = "Focus | Arnold Bodybuilding Mindset"
            subcat = "Fitness"
        elif 'STAY HARD' in ocr_text or '1557751' in fname:
            title = "Stay Hard | David Goggins Mentality"
            subcat = "Mindset"
            badge = "HOT"
        elif 'SPARTAN' in ocr_text or '1556441' in fname:
            title = "Spartan Discipline | Blood Moon Warrior"
            subcat = "Discipline"
        elif 'ROCKY' in ocr_text or '1556915' in fname:
            title = "There Is No Tomorrow | Rocky Balboa Grit"
            subcat = "Mindset"
        elif 'CONSISTENCY' in ocr_text or '1556935' in fname:
            title = "Consistency | Heavy Tire Flip Training"
            subcat = "Fitness"
        elif 'TIRED' in ocr_text or '1562841' in fname:
            title = "Don't Stop When You're Tired | Stop When You're Done"
            subcat = "Discipline"
            badge = "STAFF PICK"
        else:
            title = "Mindset & Discipline | Archival Quote Print"
            subcat = "Success"

    # 5. MOVIES (Default if character/movie visual)
    else:
        cat = "Movies"
        if curated and curated.get('title'):
            title = curated['title']
            subcat = curated.get('collection', 'Hollywood')
        elif 'SPIDER' in ocr_text or 'WITH GREAT POWER' in ocr_text or '4A137F5' in fname:
            title = "Spider-Man | With Great Power Comes Great Responsibility"
            subcat = "Marvel"
            badge = "POPULAR"
        elif 'LOGAN' in ocr_text or '1557733' in fname:
            title = "Logan | Some Legends Never Die"
            subcat = "Marvel"
        elif 'APOCALYPSE' in ocr_text or 'P1.PNG' in fname:
            title = "Apocalypse | Cigarettes After Sex Cinema"
            subcat = "Cult Cinema"
        else:
            title = f"Cinematic Print | Modern Film Classic #{idx+1}"
            subcat = "Hollywood"

    accurate_catalog.append({
        "id": f"poster-{idx+1:03d}",
        "productId": idx + 1,
        "title": title,
        "category": cat,
        "subcategory": subcat,
        "image": f"all_new_poster_no_repeated_poster/{fname}",
        "filename": fname,
        "price": 499,
        "originalPrice": 899,
        "rating": 4.9,
        "badge": badge,
        "description": f"Archival matte print of {title}. Museum-grade 300 GSM paper shipped in protective tube."
    })

# Count categories
dist = {}
for item in accurate_catalog:
    dist[item['category']] = dist.get(item['category'], 0) + 1

print("Accurate 156-Poster Category Distribution:")
print(json.dumps(dist, indent=2))

with open('d:/PINBOARD-GIT/scratch/reclassified_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(accurate_catalog, f, indent=2)
