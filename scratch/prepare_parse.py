import re
import json
import os

with open('d:/PINBOARD-GIT/scripts/buildCatalogData.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract array content using regex or python eval after converting JS objects to python dicts
match = re.search(r'const posterCatalog = (\[[\s\S]*?\]);', text)
if match:
    raw_js = match.group(1)
    # Simple JS object to JSON conversion
    # Replace single quotes with double quotes where appropriate
    # Or write a small node script that exposes require
    pass

# Let's use node with proper require in scope
node_script = """
const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('d:/PINBOARD-GIT/scripts/buildCatalogData.js', 'utf8');
const fn = new Function('require', '__dirname', 'module', 'exports', content + '; return posterCatalog;');
const catalog = fn(require, 'd:/PINBOARD-GIT/scripts', { exports: {} }, {});
fs.writeFileSync('d:/PINBOARD-GIT/scratch/parsed_build_catalog.json', JSON.stringify(catalog, null, 2));
console.log(`Parsed ${catalog.length} curated poster entries from buildCatalogData.js`);
"""
with open('d:/PINBOARD-GIT/scratch/run_parse.js', 'w', encoding='utf-8') as f:
    f.write(node_script)
