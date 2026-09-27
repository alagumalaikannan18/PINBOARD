with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure all PinboardSearch methods handle undefined products parameter safely
code = code.replace(
    'var saleable = getSaleableProducts(this.products);',
    'var saleable = getSaleableProducts(this.products || PINBOARD_PRODUCTS);'
)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated products references in PinboardSearch")
