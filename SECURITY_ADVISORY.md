# Production Security Advisory: CashPro-OSS (v4.2.0-STABLE)

**Date:** 2026-03-30
**Status:** PROTOTYPE / PRE-PRODUCTION
**Advisory ID:** CP-OSS-2026-001

## Executive Summary

CashPro-OSS is currently in a **prototype state**. While the user interface and core liquidity forecasting logic are functional, the current codebase lacks critical production-grade security controls. This advisory outlines the necessary hardening steps and identifies existing vulnerabilities that **must** be addressed before any production deployment or handling of real financial data.

---

## 1. Vulnerability Advisory (Current Codebase)

The following vulnerabilities have been identified in the current repository:

### [VULN-001] Lack of Authentication & Authorization (CRITICAL)
*   **Description:** All API endpoints (`/api/health`, `/api/system-status`, `/api/forecast`) are publicly accessible without any authentication or authorization headers.
*   **Impact:** Unauthorized actors can access sensitive system metrics, liquidity forecasts, and potentially manipulate financial data if write endpoints are added.
*   **Mitigation:** Implement a robust authentication layer (e.g., JWT, OAuth2, or Firebase Auth) and enforce role-based access control (RBAC).

### [VULN-002] Sensitive Data Exposure in Client-Side Mock (HIGH)
*   **Description:** `src/App.tsx` contains hardcoded mock account names and balances (`MAIN_OPERATING_USD`, etc.).
*   **Impact:** Even if the API is secured, sensitive data structure and example balances are leaked in the client-side bundle.
*   **Mitigation:** Remove all mock data from the frontend. Fetch all data from authenticated server-side endpoints.

### [VULN-003] Missing Input Validation on Query Parameters (MEDIUM)
*   **Description:** The `/api/forecast` endpoint parses the `days` query parameter but does not enforce a maximum limit.
*   **Impact:** An attacker could request an extremely large number of days, causing high CPU/memory usage on the server (Denial of Service).
*   **Mitigation:** Implement strict validation and range limits for all user-provided inputs using a library like `zod` or `joi`.

---

## 2. Production Hardening Guide

To move from prototype to production, the following security measures are **mandatory**:

### A. Infrastructure & Network Security
*   **HTTPS Only:** Enforce TLS 1.3 for all traffic. Use HSTS (HTTP Strict Transport Security).
*   **WAF (Web Application Firewall):** Deploy a WAF to mitigate common attacks like SQLi, XSS, and DDoS.
*   **VPC Isolation:** Run the application and database within a private VPC, exposing only the load balancer.

### B. Application Security
*   **Secure Headers:** Use `helmet` in Express to set secure HTTP headers (CSP, X-Frame-Options, etc.).
*   **Rate Limiting:** Implement rate limiting on all API endpoints to prevent brute-force and DoS attacks.
*   **CSRF Protection:** Use CSRF tokens for all state-changing operations.

### C. Data Security
*   **Encryption at Rest:** Ensure the database (e.g., Firestore, PostgreSQL) uses AES-256 encryption.
*   **Encryption in Transit:** Use mTLS (mutual TLS) for communication between internal services.
*   **Secrets Management:** Never store API keys or database credentials in `.env` files in production. Use a secret manager (e.g., Google Secret Manager, AWS Secrets Manager).

---

## 3. Compliance & Auditing
*   **Audit Logs:** Implement immutable logging for all administrative and financial actions.
*   **SOC2/ISO 27001:** Prepare for compliance audits by documenting all security controls and access logs.
*   **Penetration Testing:** Conduct a professional third-party penetration test before the first production release.

---

## 4. Disclaimer
This advisory is provided for educational and development purposes. The security of a financial platform depends on a holistic approach to security across the entire stack. **Do not use the current prototype code for real financial transactions.**
