import os
import re
import json

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

keywords = [
    # Movies / TV
    'spider', 'man', 'batman', 'dark knight', 'gotham', 'joker', 'superman', 'marvel', 'dc',
    'iron man', 'tony stark', 'doom', 'victor', 'parasite', 'bong joon', 'fight club',
    'tyler durden', 'john wick', 'baba yaga', 'interstellar', 'cooper', 'shining', 'jack torrance',
    'truman show', 'breaking bad', 'walter', 'jesse', 'saul', 'american psycho', 'pateman',
    'bateman', 'after hours', 'weeknd', 'lana del rey', 'ultraviolence', 'peaky blinders',
    'thomas shelby', 'stranger things', 'mind flayer', 'atonement', 'dunkirk', 'master',
    'leo', 'vikram', 'lcu', 'anbe sivam', 'kamal', 'dexter', 'salem', 'chandra', 'devadas',
    'logan', 'wolverine', 'sarpatta', 'kabilan', 'blade runner', 'matrix', 'pulp fiction',
    
    # Cars / Automotive
    'ferrari', 'porsche', 'lamborghini', 'bmw', 'mercedes', 'mustang', 'ford', 'gt-r', 'gtr',
    'skyline', 'nissan', 'toyota', 'supra', 'subaru', 'jdm', 'supercar', 'hypercar', 'm8',
    'automotive', '911', 'carrera', 'turbo', 'aventador', 'huracan', 'f40', 'laferrari',

    # Gaming
    'arthur morgan', 'red dead', 'rdr', 'rdr2', 'gta', 'grand theft auto', 'rockstar',
    'cyberpunk', 'witcher', 'geralt', 'god of war', 'kratos', 'halo', 'master chief',
    'elden ring', 'dark souls', 'call of duty', 'cod', 'assassin', 'creed', 'fortnite',
    'valorant', 'minecraft', 'playstation', 'xbox',

    # Sports
    'ronaldo', 'cristiano', 'cr7', 'messi', 'lionel', 'goat', 'argentina', 'portugal',
    'barcelona', 'blaugrana', 'real madrid', 'manchester', 'united', 'inter miami',
    'neymar', 'mbappe', 'haaland', 'lebron', 'jordan', 'nba', 'lakers', 'champions league',
    'world cup', 'f1', 'formula 1', 'verstappen', 'hamilton', 'senna', 'schumacher',
    'cricket', 'kohli', 'dhoni', 'rohit', 'tennis', 'federer', 'nadal', 'djokovic',

    # Motivation
    'discipline', 'consistency', 'ambition', 'strength', 'focus', 'wolf of wall street',
    'goggins', 'stay hard', 'rocky', 'spartan', 'sweater weather', 'golden hour',
    'deep ocean', 'mindset', 'summit', 'risk', 'regret'
]

results = []

for idx, fname in enumerate(files):
    fpath = os.path.join(poster_dir, fname)
    with open(fpath, 'rb') as f:
        # Read header and metadata chunks (first 5MB or entire file if smaller)
        data = f.read(5 * 1024 * 1024)
        
    found_matches = []
    data_str = data.decode('ascii', errors='ignore').lower()
    
    for kw in keywords:
        if kw in data_str:
            found_matches.append(kw)
            
    results.append({
        "index": idx + 1,
        "filename": fname,
        "matches": list(set(found_matches))
    })

output_path = r"d:\PINBOARD-GIT\scratch\extracted_keywords.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Extracted keywords written to {output_path}")
