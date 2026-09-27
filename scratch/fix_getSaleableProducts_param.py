with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

new_code = code.replace(
    'function getSaleableProducts(productsList) {',
    'function getSaleableProducts(products) {'
).replace(
    'if (!Array.isArray(productsList)) return [];',
    'if (!Array.isArray(products)) return [];'
).replace(
    'return productsList.filter(function(product) {',
    'return products.filter(function(product) {'
)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Updated getSaleableProducts signature in js/products-data.js")
