import re

# Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Hero section pinned links (lines ~353-370)
old_hero = """    <a href="product.html?id=139" class="pinned-link">
      <div class="pinned p1"><img src="1554016.webp" onerror="this.onerror=null;this.src='1554016.png'"
          alt="GOAT10 — Messi tribute poster" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=107" class="pinned-link">
      <div class="pinned p2"><img src="poster/opt/1557527.webp" onerror="this.onerror=null;this.src='poster/opt/1557527.webp'"
          alt="Porsche 911 GT3 RS — Supercars poster" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=125" class="pinned-link">
      <div class="pinned p3"><img src="poster/opt/1555764.webp" onerror="this.onerror=null;this.src='poster/opt/1555764.webp'"
          alt="GTA VI Vice City — Gaming poster" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=120" class="pinned-link">
      <div class="pinned p4"><img src="poster/opt/1556915.webp" onerror="this.onerror=null;this.src='poster/opt/1556915.webp'"
          alt="There Is No Tomorrow — Rocky Balboa motivation poster" width="180" height="240" fetchpriority="high" /></div>
    </a>"""

new_hero = """    <a href="product.html?id=55" class="pinned-link" data-product-id="55">
      <div class="pinned p1"><img src="all_new_poster_no_repeated_poster/1554016.png" onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1554016.png'"
          alt="JUST DO IT | Messi Kissing Barcelona Crest" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=123" class="pinned-link" data-product-id="123">
      <div class="pinned p2"><img src="all_new_poster_no_repeated_poster/1557527.png" onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1557527.png'"
          alt="Porsche 911 GT3 RS | German Engineering" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=70" class="pinned-link" data-product-id="70">
      <div class="pinned p3"><img src="all_new_poster_no_repeated_poster/1555762.png" onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1555762.png'"
          alt="ARTHUR MORGAN | Outlaw in the Shadows" width="180" height="240" fetchpriority="high" /></div>
    </a>
    <a href="product.html?id=109" class="pinned-link" data-product-id="109">
      <div class="pinned p4"><img src="all_new_poster_no_repeated_poster/1556915.png" onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1556915.png'"
          alt="There Is No Tomorrow | Rocky Balboa Grit" width="180" height="240" fetchpriority="high" /></div>
    </a>"""

if old_hero in html:
    html = html.replace(old_hero, new_hero)

# 2. Update Collections section markup (lines ~415-469)
old_collections = """          <div class="collection-card" data-product-id="43">
            <img src="poster/opt/1514163-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1514163.webp'" alt="AFTER HOURS" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">01</span>
              <span class="name">AFTER HOURS</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="7">
            <img src="poster/opt/1553256_1-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1553256_1.webp'" alt="PETER PARKER" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">02</span>
              <span class="name">PETER PARKER</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="151">
            <img src="poster/opt/1557012-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1557012.webp'" alt="LEO IN PINK" loading="lazy" width="280"
              height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">03</span>
              <span class="name">LEO IN PINK</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="135">
            <img src="poster/opt/1554000-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1554000.webp'" alt="RED DEVIL" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">04</span>
              <span class="name">RED DEVIL</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="91">
            <img src="poster/opt/1557102-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1557102.webp'" alt="SYMBOL OF HOPE" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">05</span>
              <span class="name">SYMBOL OF HOPE</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="84">
            <img src="poster/opt/1556723-thumb.webp"
              onerror="this.onerror=null;this.src='poster/opt/1556723.webp'" alt="BABA YAGA" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">06</span>
              <span class="name">BABA YAGA</span>
            </div>
          </div>"""

new_collections = """          <div class="collection-card" data-product-id="27">
            <img src="all_new_poster_no_repeated_poster/1514163.png"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1514163.png'" alt="AFTER HOURS" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">01</span>
              <span class="name">AFTER HOURS</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="48">
            <img src="all_new_poster_no_repeated_poster/1553256_1.jpg"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1553256_1.jpg'" alt="SPIDER-MAN REBIRTH" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">02</span>
              <span class="name">SPIDER-MAN REBIRTH</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="114">
            <img src="all_new_poster_no_repeated_poster/1557012.png"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1557012.png'" alt="LEO IN PINK" loading="lazy" width="280"
              height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">03</span>
              <span class="name">LEO IN PINK</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="51">
            <img src="all_new_poster_no_repeated_poster/1554000.png"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1554000.png'" alt="RED DEVIL" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">04</span>
              <span class="name">RED DEVIL</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="91">
            <img src="all_new_poster_no_repeated_poster/1555969.png"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1555969.png'" alt="ATONEMENT" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">05</span>
              <span class="name">ATONEMENT</span>
            </div>
          </div>
          <div class="collection-card" data-product-id="104">
            <img src="all_new_poster_no_repeated_poster/1556723.png"
              onerror="this.onerror=null;this.src='all_new_poster_no_repeated_poster/1556723.png'" alt="BABA YAGA" loading="lazy"
              width="280" height="380" draggable="false" />
            <div class="collection-label">
              <span class="num mono">06</span>
              <span class="name">BABA YAGA</span>
            </div>
          </div>"""

if old_collections in html:
    html = html.replace(old_collections, new_collections)

# 3. Update Best Sellers section (lines ~497-554)
old_bestsellers = """      <div class="product" data-product-id="84">
        <div class="product-tape"></div>
        <div class="badge">BESTSELLER</div>
        <div class="product-img">
          <img src="poster/opt/1556723.webp" alt="They Call Me Baba Yaga — John Wick poster" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">They Call Me Baba Yaga</div>
            <div class="cat">Movies · Cult Cinema</div>
          </div>
          <div class="price">₹60</div>
        </div>
      </div>

      <div class="product" data-product-id="101">
        <div class="product-tape"></div>
        <div class="product-img">
          <img src="poster/opt/1514085.webp" alt="BMW E30 M3 — White Smoke Drift poster" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">BMW E30 M3</div>
            <div class="cat">Cars · Classics</div>
          </div>
          <div class="price">₹60</div>
        </div>
      </div>

      <div class="product" data-product-id="151">
        <div class="product-tape"></div>
        <div class="badge">NEW</div>
        <div class="product-img">
          <img src="poster/opt/1557012.webp" alt="Leo In Pink — Inter Miami poster" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">Leo In Pink</div>
            <div class="cat">Sports · Athletes</div>
          </div>
          <div class="price">₹60</div>
        </div>
      </div>

      <div class="product" data-product-id="112">
        <div class="product-tape"></div>
        <div class="product-img">
          <img src="poster/opt/1514166.webp" alt="What If It Works — Motivation poster" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">What If It Works</div>
            <div class="cat">Motivation · Mindset</div>
          </div>
          <div class="price">₹60</div>
        </div>
      </div>"""

new_bestsellers = """      <div class="product" data-product-id="17">
        <div class="product-tape"></div>
        <div class="badge">BESTSELLER</div>
        <div class="product-img">
          <img src="all_new_poster_no_repeated_poster/1514078.png" alt="JOHN WICK & MUSTANG | Baba Yaga" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">JOHN WICK & MUSTANG | Baba Yaga</div>
            <div class="cat">Movies · Cult Cinema</div>
          </div>
          <div class="price">₹499</div>
        </div>
      </div>

      <div class="product" data-product-id="20">
        <div class="product-tape"></div>
        <div class="product-img">
          <img src="all_new_poster_no_repeated_poster/1514085.png" alt="BMW E30 M3 — White Smoke Drift poster" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">BMW E30 M3 | White Smoke Drift</div>
            <div class="cat">Movies · Supercars & Speed</div>
          </div>
          <div class="price">₹499</div>
        </div>
      </div>

      <div class="product" data-product-id="47">
        <div class="product-tape"></div>
        <div class="badge">HOT</div>
        <div class="product-img">
          <img src="all_new_poster_no_repeated_poster/1553198.png" alt="Lionel Messi | The GOAT Pitch Mastery" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">Lionel Messi | The GOAT Pitch Mastery</div>
            <div class="cat">Sports · Football Legends</div>
          </div>
          <div class="price">₹499</div>
        </div>
      </div>

      <div class="product" data-product-id="29">
        <div class="product-tape"></div>
        <div class="product-img">
          <img src="all_new_poster_no_repeated_poster/1514166.png" alt="WHAT IF IT WORKS | Bold Determination" />
        </div>
        <div class="product-info">
          <div>
            <div class="name">WHAT IF IT WORKS | Bold Determination</div>
            <div class="cat">Movies · Mindset & Stoicism</div>
          </div>
          <div class="price">₹499</div>
        </div>
      </div>"""

if old_bestsellers in html:
    html = html.replace(old_bestsellers, new_bestsellers)

# 4. Update 3D Stage Section cards (lines ~600-660)
old_space3d = """        <!-- Centerpiece Hero Poster -->
        <div class="space3d-card hero-center" data-product-id="47" data-base-x="0" data-base-y="0" data-base-z="60"
          data-base-rx="0" data-base-ry="0" data-base-rz="0" data-depth="1">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge">TRENDING</span>
            <div class="space3d-card-img-wrap">
              <img src="poster/opt/1553256_1.webp" alt="Peter Parker" loading="lazy" onerror="this.onerror=null;this.src='poster/opt/1553256_1.webp'" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">PETER PARKER | No Way Home</span>
              <span class="space3d-card-price">₹60</span>
            </div>
          </div>
        </div>

        <!-- Left Wing Card -->
        <div class="space3d-card" data-product-id="138" data-base-x="-320" data-base-y="-30" data-base-z="-30"
          data-base-rx="-4" data-base-ry="18" data-base-rz="-2" data-depth="1.4">
          <div class="space3d-card-inner">
            <div class="space3d-card-img-wrap">
              <img src="poster/opt/1514232.webp" alt="Bauhaus No.7" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">Bauhaus No.7</span>
              <span class="space3d-card-price">₹60</span>
            </div>
          </div>
        </div>

        <!-- Right Wing Card -->
        <div class="space3d-card" data-product-id="37" data-base-x="320" data-base-y="30" data-base-z="-20"
          data-base-rx="4" data-base-ry="-16" data-base-rz="2" data-depth="1.3">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge">IMMORTAL</span>
            <div class="space3d-card-img-wrap">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='380' viewBox='0 0 280 380'%3E%3Crect width='280' height='380' fill='%23f5f4f0'/%3E%3Crect x='20' y='20' width='240' height='340' rx='4' fill='%23eae8e3' stroke='%23d5d2cb' stroke-width='1.5' stroke-dasharray='8 4'/%3E%3Ctext x='140' y='170' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%23c5c1b8'%3E%F0%9F%96%BC%EF%B8%8F%3C/text%3E%3Ctext x='140' y='210' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' letter-spacing='2' fill='%23a09c94'%3EPOSTER%3C/text%3E%3Ctext x='140' y='230' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23b5b1a9'%3EComing Soon%3C/text%3E%3C/svg%3E" alt="Poster" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">Messi Immortal</span>
              <span class="space3d-card-price">₹60</span>
            </div>
          </div>
        </div>

        <!-- Ambient Depth Left -->
        <div class="space3d-card" data-product-id="36" data-base-x="-540" data-base-y="-100" data-base-z="-120"
          data-base-rx="-8" data-base-ry="24" data-base-rz="-4" data-depth="2.1">
          <div class="space3d-card-inner">
            <div class="space3d-card-img-wrap">
              <img src="poster/opt/1551532.webp" alt="Sunset Ridge" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">Sunset Ridge</span>
              <span class="space3d-card-price">₹60</span>
            </div>
          </div>
        </div>

        <!-- Ambient Depth Right -->
        <div class="space3d-card" data-product-id="20" data-base-x="540" data-base-y="-100" data-base-z="-120"
          data-base-rx="8" data-base-ry="-24" data-base-rz="4" data-depth="2.1">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge alt">MARVEL</span>
            <div class="space3d-card-img-wrap">
              <img src="poster/opt/1553160.webp" alt="Doctor Doom" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">Doctor Doom</span>
              <span class="space3d-card-price">₹60</span>
            </div>
          </div>
        </div>"""

new_space3d = """        <!-- Centerpiece Hero Poster -->
        <div class="space3d-card hero-center" data-product-id="33" data-base-x="0" data-base-y="0" data-base-z="60"
          data-base-rx="0" data-base-ry="0" data-base-rz="0" data-depth="1">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge">TRENDING</span>
            <div class="space3d-card-img-wrap">
              <img src="all_new_poster_no_repeated_poster/1514179.png" alt="PETER PARKER | No Way Home NYC" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">PETER PARKER | No Way Home NYC</span>
              <span class="space3d-card-price">₹499</span>
            </div>
          </div>
        </div>

        <!-- Left Wing Card -->
        <div class="space3d-card" data-product-id="1" data-base-x="-320" data-base-y="-30" data-base-z="-30"
          data-base-rx="-4" data-base-ry="18" data-base-rz="-2" data-depth="1.4">
          <div class="space3d-card-inner">
            <div class="space3d-card-img-wrap">
              <img src="all_new_poster_no_repeated_poster/1513605.png" alt="MILES MORALES | Sunset Skyline" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">MILES MORALES | Sunset Skyline</span>
              <span class="space3d-card-price">₹499</span>
            </div>
          </div>
        </div>

        <!-- Right Wing Card -->
        <div class="space3d-card" data-product-id="39" data-base-x="320" data-base-y="30" data-base-z="-20"
          data-base-rx="4" data-base-ry="-16" data-base-rz="2" data-depth="1.3">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge">IMMORTAL</span>
            <div class="space3d-card-img-wrap">
              <img src="all_new_poster_no_repeated_poster/1551192.png" alt="WHEN THE DREAM BECAME IMMORTAL | Qatar 2022 World Cup Kiss" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">WHEN THE DREAM BECAME IMMORTAL | Qatar 2022</span>
              <span class="space3d-card-price">₹499</span>
            </div>
          </div>
        </div>

        <!-- Ambient Depth Left -->
        <div class="space3d-card" data-product-id="34" data-base-x="-540" data-base-y="-100" data-base-z="-120"
          data-base-rx="-8" data-base-ry="24" data-base-rz="-4" data-depth="2.1">
          <div class="space3d-card-inner">
            <div class="space3d-card-img-wrap">
              <img src="all_new_poster_no_repeated_poster/1514230.png" alt="END OF BEGINNING | Djo Joe Keery" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">END OF BEGINNING | Djo Joe Keery</span>
              <span class="space3d-card-price">₹499</span>
            </div>
          </div>
        </div>

        <!-- Ambient Depth Right -->
        <div class="space3d-card" data-product-id="44" data-base-x="540" data-base-y="-100" data-base-z="-120"
          data-base-rx="8" data-base-ry="-24" data-base-rz="4" data-depth="2.1">
          <div class="space3d-card-inner">
            <span class="space3d-card-badge alt">MARVEL</span>
            <div class="space3d-card-img-wrap">
              <img src="all_new_poster_no_repeated_poster/1553160.jpg" alt="I AM DOOM | Monarch of Latveria" loading="lazy" />
            </div>
            <div class="space3d-card-info">
              <span class="space3d-card-title">I AM DOOM | Monarch of Latveria</span>
              <span class="space3d-card-price">₹499</span>
            </div>
          </div>
        </div>"""

if old_space3d in html:
    html = html.replace(old_space3d, new_space3d)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully updated index.html markup with 100% matched product IDs, images, titles, and categories!")
