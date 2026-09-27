with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    '''  deduplicateProducts: function(productsList) {
    if (!Array.isArray(products)) return [];
    var saleable = getSaleableProducts(productsList);''',
    '''  deduplicateProducts: function(products) {
    if (!Array.isArray(products)) products = (this && this.products) ? this.products : (typeof PINBOARD_PRODUCTS !== 'undefined' ? PINBOARD_PRODUCTS : []);
    var saleable = getSaleableProducts(products);'''
)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed deduplicateProducts parameter handling in js/products-data.js")
