with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_func = '''  isDuplicatePoster: function(poster, list) {
    if (!poster || !Array.isArray(list)) return false;
    var targetKey = getCanonicalArtworkKey(poster);
    var targetTitle = (poster.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;

      if (item.id === poster.id) return true;

      var itemKey = getCanonicalArtworkKey(item);
      if (targetKey && itemKey && targetKey === itemKey) return true;

      var itemTitle = (item.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (targetTitle && itemTitle && targetTitle === itemTitle) return true;
    }

    return false;
  },'''

new_func = '''  isDuplicatePoster: function(poster, list) {
    if (!poster || !Array.isArray(list)) return false;
    
    var targetImg = (poster.images && poster.images[0]) ? String(poster.images[0]).split('?')[0].split('#')[0].replace(/^.*[\\\\/]/, '').replace(/\\.(png|jpe?g|webp|avif)$/i, '').replace(/\\.jpg\\.jpeg$/i, '').toLowerCase() : '';
    var targetTitle = (poster.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    var targetKey = getCanonicalArtworkKey(poster);

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;

      if (item.id === poster.id) return true;

      var itemImg = (item.images && item.images[0]) ? String(item.images[0]).split('?')[0].split('#')[0].replace(/^.*[\\\\/]/, '').replace(/\\.(png|jpe?g|webp|avif)$/i, '').replace(/\\.jpg\\.jpeg$/i, '').toLowerCase() : '';
      if (targetImg && itemImg && targetImg === itemImg) return true;

      var itemKey = getCanonicalArtworkKey(item);
      if (targetKey && itemKey && targetKey === itemKey) return true;

      var itemTitle = (item.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (targetTitle && itemTitle && targetTitle === itemTitle) return true;
    }

    return false;
  },'''

code = code.replace(old_func, new_func)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated isDuplicatePoster in js/products-data.js")
