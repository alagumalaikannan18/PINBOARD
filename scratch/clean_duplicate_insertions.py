import json
import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Match the entire PINBOARD_PRODUCTS array assignment
pattern = r'(var PINBOARD_PRODUCTS\s*=\s*\[)([\s\S]*?)(\];\s*\n\s*function getSaleableProducts)'
m = re.search(pattern, code)

if not m:
    print("Pattern match failed")
    exit(1)

prefix = m.group(1)
body = m.group(2)
suffix = m.group(3)

# Parse body into json objects by finding items
# Let's clean out any duplicate IDs in the array body
# We can wrap body in '[' and ']' and parse as JSON
try:
    arr = json.loads('[' + body + ']')
    seen_ids = set()
    clean_arr = []
    for item in arr:
        if item['id'] not in seen_ids:
            seen_ids.add(item['id'])
            clean_arr.append(item)
    print(f"Cleaned dataset: {len(clean_arr)} unique product items (IDs: {min(seen_ids)} to {max(seen_ids)})")
    
    # Re-serialize clean_arr with nice formatting
    snippets = [json.dumps(item, indent=2) for item in clean_arr]
    new_body = '\n  ' + ',\n  '.join(snippets) + '\n'
    
    new_code = code[:m.start()] + prefix + new_body + suffix + code[m.end():]
    with open('js/products-data.js', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Successfully rewritten js/products-data.js with clean single dataset!")

except Exception as e:
    print("JSON parse error:", e)
