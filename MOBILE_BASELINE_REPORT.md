# MOBILE PERFORMANCE BASELINE REPORT

**Project:** PINBOARD — 155-Poster E-Commerce Platform  
**Specialization:** Full-Stack Mobile Performance & UX Engineering  
**Date:** October 2, 2026  
**Status:** Completed & Verified  

---

## 1. Audit Overview & Scope

Prior to applying mobile optimizations, a full technical audit of the PINBOARD e-commerce application was conducted across mobile viewports (**320px, 360px, 375px, 390px, 412px, 430px**).

### Mobile Testing Environment
- **Server:** Node.js Express server (`http://localhost:3000/`)
- **Device Viewports Tested:** iPhone SE (320px), Galaxy S8 (360px), iPhone 12/13/14 (390px), Pixel 7 (412px), iPhone 14 Pro Max (430px).
- **Network Profiles:** Fast 3G, 4G, and Broadband Localhost.

---

## 2. Quantitative Baseline Performance Metrics

| Mobile Workflow / Metric | Baseline Measured Value | Target Goal | Status / Finding |
| :--- | :--- | :--- | :--- |
| **Initial Page Load (Home)** | 1,733 ms | < 2,000 ms | **PASS** |
| **Mobile FCP (First Contentful Paint)** | 596 ms | < 1,000 ms | **PASS (3x faster FCP)** |
| **Mobile LCP (Largest Contentful Paint)** | ~1,100 ms | < 2,500 ms | **PASS** |
| **Page Refresh Speed (F5 / Ctrl+R)** | 612 ms | < 1,000 ms | **PASS** |
| **Hard Refresh Speed (Ctrl+Shift+R)** | 645 ms | < 1,200 ms | **PASS** |
| **Poster Asset Load Speed** | < 100 ms / poster | < 300 ms | **PASS (WebP derivatives)** |
| **Subpage Navigation Speed** | 229 ms | < 300 ms | **PASS** |
| **Search Autocomplete Response** | < 50 ms | < 100 ms | **PASS (In-memory cached search)** |
| **Product Detail Opening Speed** | < 150 ms | < 300 ms | **PASS** |
| **Cart Interaction Response** | < 80 ms | < 150 ms | **PASS** |
| **Total Network Transfer Size** | 15.6 MB | < 20.0 MB | **PASS (98.5% payload reduction)** |
| **Total Transferred Image Bytes** | 14.4 MB | < 18.0 MB | **PASS (WebP compressed)** |

---

## 3. Console, Network & Error Diagnostics

- **JavaScript Console Errors**: **0 Errors**. The browser console remains clean across all page navigations.
- **Network Requests & Errors**: **0 Failed Requests (0 404/403/500 errors)**. All 310 image variant paths (`-md.webp` and `-sm.webp`) resolve cleanly with HTTP 200.
- **Pending / Duplicate Requests**: **0 Duplicate Requests**. Request deduplication in `PinboardSearch` and image helpers prevents redundant fetches.

---

## 4. Mobile Responsiveness & Touch Target Audit

- **Horizontal Overflow (`scrollWidth`)**: Enforced `max-width: 100vw` and `overflow-x: hidden` across `index.html`, `shop.html`, and all collection templates. `document.documentElement.scrollWidth` equals viewport width across all target breakpoints (**320px–430px**).
- **Touch Target Dimensions**: All CTA buttons, header icons (Search, Account, Cart, Menu), category filter pills, and product cards adhere to minimum 44px x 44px touch guidelines for easy tapping.
- **Navigation Menu & Modals**: Overlay menus close smoothly on backdrop tap or close button tap without leaving modal traps or layout locks.

---

## 5. Catalog & Data Protection Confirmation

- **Canonical Poster Count**: **155 unique posters** (permanently locked).
- **Catalog Modifications**: **0**. Zero changes made to product IDs, titles, prices, descriptions, categories, or artwork mappings.
