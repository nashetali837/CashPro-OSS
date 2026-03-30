# Security Policy

## Supported Versions

We currently provide security updates for the following versions of CashPro-OSS:

| Version | Supported          |
| ------- | ------------------ |
| 4.2.x   | :white_check_mark: |
| 4.1.x   | :x:                |
| < 4.1   | :x:                |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

If you discover a security vulnerability within CashPro-OSS, please follow our coordinated disclosure process to ensure the safety of our users' financial data.

### Disclosure Process

1.  **Report:** Send an encrypted email to [security@cashpro-oss.io](mailto:security@cashpro-oss.io) (PGP Key ID: `0xDEADBEEF`).
2.  **Acknowledgment:** Our security team will acknowledge receipt of your report within 24 hours.
3.  **Evaluation:** We will perform a technical evaluation and risk assessment.
4.  **Fix:** If verified, we will develop a patch.
5.  **Release:** We will release a security advisory and a patched version.
6.  **Credit:** With your permission, we will credit you in our security advisory.

### What to Include

*   A detailed description of the vulnerability.
*   Steps to reproduce (Proof of Concept).
*   Potential impact assessment.
*   Any suggested mitigations.

## Security Principles

CashPro-OSS is built with a "Security-First" architecture, focusing on:

*   **Zero Trust:** No implicit trust for internal or external requests.
*   **Defense in Depth:** Multiple layers of security controls.
*   **Least Privilege:** Users and services only have the permissions they need.
*   **Auditability:** Every transaction and system change is logged.

## Production Hardening

For production deployments, we recommend:

1.  **Enforce TLS 1.3:** Ensure all traffic is encrypted.
2.  **Implement OAuth2/OIDC:** Use a robust identity provider.
3.  **Enable Content Security Policy (CSP):** Mitigate XSS risks.
4.  **Database Encryption:** Use AES-256 at rest for all financial records.
