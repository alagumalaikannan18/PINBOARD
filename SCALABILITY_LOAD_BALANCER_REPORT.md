# SCALABILITY & LOAD BALANCER REPORT

**Project:** PINBOARD — 155-Poster E-Commerce Platform  
**Role:** Senior Systems & Infrastructure Performance Engineer  
**Date:** October 2, 2026  
**Status:** Architecture Evaluated & Hardened  

---

## 1. Deployment Architecture & Infrastructure Assessment

PINBOARD operates as a Node.js Express web application deployed on scalable cloud infrastructure (e.g., Render, Vercel, or AWS Elastic Beanstalk / ECS).

### Key Architecture Attributes
1. **Stateless Server Nodes**:
   - `server.js` maintains no local in-memory session persistence or single-node state.
   - User authentication state resides in Firebase Auth tokens (client-side JWT) and Firebase Firestore / Realtime DB.
   - Shopping cart state is stored in client-side `localStorage` / session state and synced to Firebase for authenticated users.

2. **Load Balancer Integration**:
   - `app.set('trust proxy', true)` enabled in `server.js` to extract true client IP addresses (`X-Forwarded-For`) through cloud load balancers and reverse proxies (NGINX, Cloudflare, AWS ALB).

3. **Rate Limiting Engine**:
   - Centralized memory-safe sliding window rate limiter (`apiRateLimiter`) protecting API endpoints against abuse while allowing unrestricted access to `/api/health` probes.

4. **Health Check Probes**:
   - `/api/health`: Comprehensive system status probe checking liveness, readiness, and database connectivity.
   - `/api/health/liveness`: Kubernetes / Docker liveness probe.
   - `/api/health/readiness`: Load balancer readiness probe returning HTTP 200 when instance is prepared to accept web traffic.

---

## 2. Horizontal Scaling Readiness

- **Stateless Request Processing**: Any web request can be routed to any instance node without sticky sessions or state conflicts.
- **Static Asset Caching**: WebP poster derivatives and static bundles served with immutable HTTP cache headers, enabling edge CDNs (Cloudflare / Fastly) to offload 95%+ of traffic from origin servers.
