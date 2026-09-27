with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    '''function getSaleableProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.filter(function(product) {
    if (!product || typeof product.id === 'undefined') return false;
    if (product.type === 'collection-profile' || product.saleable === false || product.isCollection === true) return false;
    var img = (product.images && product.images[0]) ? String(product.images[0]) : '';
    if (img.indexOf('cat_') === 0 || (product.category && product.category.toLowerCase().indexOf('cat_') === 0)) return false;
    return true;
  });
}''',
    '''function getSaleableProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.filter(function(product) {
    if (!product || typeof product.id === 'undefined') return false;
    if (product.type === 'collection-profile' || product.saleable === false || product.isCollection === true) return false;
    var img = (product.images && product.images[0]) ? String(product.images[0]) : '';
    if (img.includes('cat_') || (product.category && product.category.toLowerCase().includes('cat_'))) return false;
    return true;
  });
}'''
)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated getSaleableProducts helper")
