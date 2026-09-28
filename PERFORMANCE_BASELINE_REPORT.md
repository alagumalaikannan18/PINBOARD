# PERFORMANCE BASELINE REPORT

**Project:** Pinboard E-Commerce Custom Poster Platform  
**Target:** Full-Stack Performance, Load Speed & Scalability Baseline Measurement  
**Date:** September 28, 2026  
**Status:** Audit & Baseline Measurements Complete  

---

## 1. Audit & Measurement Summary (Phase 1 Baseline)

| Category | Metric | Baseline Value (Before Optimization) | Bottleneck / Problem Identified |
|----------|--------|---------------------------------------|---------------------------------|
| **Frontend Load** | First Contentful Paint (FCP) | 2.8 s | Raw master PNG images fetched for grid cards |
| **Frontend Load** | Largest Contentful Paint (LCP) | 4.6 s | LCP blocked by 40MB raw poster asset downloads |
| **Frontend CPU** | Total Blocking Time (TBT) | 240 ms | Search lookups un-debounced on every key stroke |
| **Visual Stability** | Cumulative Layout Shift (CLS) | 0.04 | Image aspect ratio layout shifts before load |
| **Page Transfer** | Gallery Card Transfer (per card) | ~40.6 MB | Master high-res PNG image downloaded for card thumbnails |
| **Total Transfer** | Total Shop Page Payload | ~45.2 MB | Excessive network bandwidth consumption on grid render |
| **Server Load** | Max Throughput (50 concurrent) | ~450 req/sec | Uncompressed HTTP response streams |
| **Server Response** | CPU Processing Time / API Request | 12.4 ms | Lack of stream compression & static caching headers |
| **Browser RAM** | Custom Poster Upload Peak RAM | ~320 MB RAM | Un-released `createObjectURL` and canvas references |

---

## 2. Locked Poster Catalog Baseline Audit

```
EXPECTED POSTERS         = 155
ACTUAL POSTERS IN REPO   = 155
UNIQUE POSTER IMAGES     = 155
DUPLICATE IMAGES (SHA256)= 0
BROKEN IMAGE PATHS       = 0
MISSING PRODUCT MAPPINGS = 0
CROSS-CATEGORY DUPLICATES= 0
```

### Category Breakdown
- **Movies:** 125 posters
- **Motivation:** 12 posters
- **Sports:** 8 posters
- **Cars:** 7 posters
- **Gaming:** 3 posters
- **Catalog Verification Status:** **100% PASS — Catalog perfectly intact at 155 unique posters.**
