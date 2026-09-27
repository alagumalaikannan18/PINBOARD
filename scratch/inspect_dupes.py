import json

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('globalScope.PINBOARD_PRODUCTS = [')
if start == -1:
    start = content.find('PINBOARD_PRODUCTS = [')

sub = content[content.find('[', start):]
end = sub.rfind('];')
products = json.loads(sub[:end+1])

target_ids = [33, 80, 113, 116, 151, 152, 153, 155]
for p in products:
    if p['id'] in target_ids:
        print(f"\n================ ID {p['id']} ================")
        print(json.dumps(p, indent=2))
