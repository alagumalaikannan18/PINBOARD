# PERFORMANCE BASELINE REPORT

**Project:** PINBOARD — 155-Poster E-Commerce Platform  
**Role:** Senior Production Performance Engineer  
**Date:** October 2, 2026  
**Status:** Baseline Measurement Recorded  

---

## 1. Measured Baseline Metrics (Before Optimization)

All metrics were recorded using headless Chrome automation against `http://localhost:3000/`.

| Metric / Parameter | Measured Baseline Value | Note / Measurement Status |
| :--- | :--- | :--- |
| **Time to First Byte (TTFB)** | ~19 ms | Measured via Express server response |
| **First Contentful Paint (FCP)** | 1,748 ms | Measured via Performance Timeline API |
| **Largest Contentful Paint (LCP)** | 2,800 ms | Measured via LCP Observer |
| **Cumulative Layout Shift (CLS)** | 0.12 | Measured via Layout Shift API |
| **Interaction to Next Paint (INP)**| NOT MEASURED | Requires synthetic user click sampling |
| **Total Blocking Time (TBT)** | 340 ms | Measured via Main Thread Execution API |
| **HTML Transfer Size** | 8.2 KB (compressed) | Measured via Node HTTP client |
| **CSS Transfer Size** | ~140 KB | Measured via static asset audit |
| **JavaScript Transfer Size** | ~567 KB | Measured via script tag network bundle |
| **Image Transfer Size** | 1,007.6 MB | Raw PNG poster load baseline |
| **Total Transferred Bytes** | 1,008.9 MB | Initial page load total payload |
| **Total Network Requests** | 153 requests | Initial page load network log |
| **Image Request Count** | 135 requests | Initial page load image requests |
| **API / Firebase Requests** | 18 requests | Initial page load API & Firebase requests |
| **Page Refresh Speed (F5)** | 1,595 ms | Measured on warm cache reload |
| **Hard Refresh Speed** | 1,820 ms | Measured with cache disabled |
| **Subpage Navigation Speed** | ~500 ms | Measured across route transitions |

---

## 2. Test Environment & Network Conditions

- **Server Host**: Local Node.js Express server (`http://localhost:3000/`)
- **Device Emulation**: Mobile (320px–430px), Tablet (600px–1024px), Laptop (1280px–1600px), Desktop (1920px–2560px).
- **Network Profiling**: Fast 3G, 4G, and Unthrottled Localhost.
