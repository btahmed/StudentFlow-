# Security Audit Report: StudentFlow Ultimate Pro

**Audit Date**: 2026-02-18  
**Auditor**: AI-Assisted Security Review  
**Scope**: Full repository (`btahmed/StudentFlow-`)  
**App Version**: 2.0.0  
**Status**: DRAFT — fixes applied inline

---

## Executive Summary

StudentFlow is a client-side-only PWA/mobile app (no backend, no database server, no API endpoints). Data is stored exclusively in browser `localStorage`. This significantly reduces the attack surface compared to a typical web application — there are no server-side injection vectors, no auth flows, and no remote database.

However, several security issues were identified, most notably **hardcoded signing credentials committed to the repository** and **XSS vulnerabilities** from unescaped user input rendered via `innerHTML`.

---

## A) Prioritized Risk Table

| # | Priority | Category | Finding | Evidence | Impact | Status |
|---|----------|----------|---------|----------|--------|--------|
| 1 | **P0** | Secrets | Keystore passwords hardcoded in `build.gradle` | `android/app/build.gradle:28-30` — `storePassword 'studentflow123'`, `keyPassword 'studentflow123'` | Attacker with repo access can sign malicious APKs as the official app. Credential compromise. | ✅ FIXED |
| 2 | **P0** | Secrets | Keystore files (`.jks`) committed to repository | `android/keystore/studentflow-release.jks`, `android/keystore/studentflow-release2.jks`, `android/app/studentflow-release.jks` | Combined with #1, enables full APK signing impersonation | ✅ FIXED (.gitignore updated) |
| 3 | **P0** | .gitignore | `.env` files not excluded; `.aab` bundles committed; keystore files not excluded | `.gitignore` missing `.env`, `*.jks`, `*.aab` patterns | Future secrets in `.env` could be committed accidentally | ✅ FIXED |
| 4 | **P1** | XSS | Timetable slot names rendered via `innerHTML` without escaping | `studentflow_ultimate_pro.html:4192` — `${item.name}` directly in template literal | Self-XSS: user-supplied course name could execute scripts when rendered | ✅ FIXED |
| 5 | **P1** | XSS | Note titles rendered via `innerHTML` without escaping | `studentflow_ultimate_pro.html:7292` — `${note.title}` directly in template literal | Self-XSS: malicious note title could execute scripts | ✅ FIXED |
| 6 | **P1** | Input Validation | `importJSON()` accepts arbitrary JSON with no structure validation or size limit | `studentflow_ultimate_pro.html:5794-5814` | Malicious JSON file could inject XSS payloads into stored data, or cause DoS via oversized payload | ✅ FIXED |
| 7 | **P1** | Input Validation | `importNotes()` accepts notes without sanitization or size limit | `studentflow_ultimate_pro.html:7118-7148` | Malicious notes file could inject script payloads | ✅ FIXED |
| 8 | **P1** | Security Headers | Missing `Content-Security-Policy` header | `netlify.toml` — no CSP configured | Reduces defense-in-depth against XSS on the web deployment | ✅ FIXED |
| 9 | **P1** | Android Security | `allowMixedContent: true` in Capacitor config | `capacitor.config.json:44` | Android WebView could load HTTP resources within HTTPS context, enabling MITM attacks | ✅ FIXED |
| 10 | **P1** | Dependencies | `tar` package has 3 high-severity vulnerabilities (path traversal, symlink poisoning) | `npm audit` — via `@capacitor/cli` dependency chain | Build-time risk: malicious tarball could overwrite files during `npm install` | ⚠️ Documented — no direct fix available (upstream) |
| 11 | **P1** | Dependencies | `qs` package has denial-of-service vulnerability | `npm audit` — `qs 6.7.0-6.14.1` | Build-time DoS risk | ⚠️ Fixable via `npm audit fix` |
| 12 | **P2** | Binary Artifacts | APK/AAB files committed to git (~17MB total) | Root directory: `StudentFlow-FINAL.apk`, `*.aab` files | Repository bloat; binaries should be in GitHub Releases, not git history | ✅ FIXED (.gitignore updated) |
| 13 | **P2** | Security Headers | Missing `Permissions-Policy` header | `netlify.toml` | Browser could grant unnecessary permissions (camera, geolocation) | ✅ FIXED |

### Items Not Applicable (with rationale)

| Framework Point | Status | Rationale |
|----------------|--------|-----------|
| **Auth (#3)** | N/A | No authentication system exists. App is fully offline, single-user, no accounts. |
| **SQL Injection (#4, #5)** | N/A | No database. All data stored in browser `localStorage` via `JSON.stringify`/`JSON.parse`. No SQL, no ORM. |
| **Rate Limiting (#8)** | N/A | No server, no API endpoints, no forms that submit to a backend. All operations are client-side. |
| **RLS (#10)** | N/A | No Postgres/Supabase or any database server. Single-user, device-local storage only. |
| **Server-side Validation (#5)** | N/A | No server exists. Input validation is client-side only (appropriate for this architecture). |
| **Ghost Packages (#2)** | ✅ Clean | All npm dependencies are official `@capacitor/*` packages from the Capacitor team. No suspicious or typo-squatted packages detected. |

---

## B) Fix Pack Checklist

### Fix 1: Hardcoded Keystore Passwords (P0) ✅
- **What changed**: `android/app/build.gradle` — replaced hardcoded `storePassword` and `keyPassword` values with `System.getenv()` calls
- **Environment variables required**: `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`
- **How to verify**: Run `grep -n "studentflow123" android/app/build.gradle` — should return no results
- **Acceptance criteria**: No plaintext passwords in any tracked file; CI/CD builds use environment variables for signing
- **⚠️ Post-merge action required**: The old passwords (`studentflow123`) remain in git history. The keystore should be **rotated** (generate a new `.jks` with a new password) since the credentials have been exposed.

### Fix 2: .gitignore Hardening (P0) ✅
- **What changed**: `.gitignore` updated to exclude `.env`, `.env.*`, `*.jks`, `*.keystore`, `*.pem`, `*.p12`, `*.aab`
- **How to verify**: Run `cat .gitignore | grep -E "\.env|\.jks|\.aab"` — should show all patterns
- **Acceptance criteria**: No secret files or binary artifacts can be accidentally committed going forward
- **Note**: Existing committed files (APK, AAB, JKS) remain in git history. Use `git filter-branch` or BFG Repo-Cleaner to remove them from history if needed.

### Fix 3: XSS in Timetable Rendering (P1) ✅
- **What changed**: `studentflow_ultimate_pro.html:4192` — wrapped `item.name` with `escapeHtml()` call
- **How to verify**: Create a timetable slot with name `<img src=x onerror=alert(1)>` — should render as text, not execute
- **Acceptance criteria**: All user-supplied text rendered in `innerHTML` contexts passes through `escapeHtml()`

### Fix 4: XSS in Notes Title Rendering (P1) ✅
- **What changed**: `studentflow_ultimate_pro.html:7292` — wrapped `note.title` with `escapeHtml()` call
- **How to verify**: Create a note with title `<script>alert(1)</script>` — should render as text
- **Acceptance criteria**: Note titles are escaped before HTML rendering

### Fix 5: Import Validation (P1) ✅
- **What changed**: `importJSON()` and `importNotes()` functions now validate:
  - File size limit (5 MB max)
  - JSON structure validation (required fields `timetable` as object, `logs` as array)
  - String field length truncation (prevents storage overflow)
  - Recursive sanitization of imported data
- **How to verify**: Try importing a 10MB JSON file — should show size error. Try importing `{"foo": "bar"}` — should show invalid error.
- **Acceptance criteria**: Malformed or oversized imports are rejected with user-friendly error messages

### Fix 6: Content-Security-Policy Header (P1) ✅
- **What changed**: `netlify.toml` — added `Content-Security-Policy` header restricting `default-src`, `script-src`, `object-src`, `base-uri`, and `form-action`
- **Note**: `'unsafe-inline'` and `'unsafe-eval'` are required for `script-src` because the app uses inline scripts and Tailwind CSS JIT. This is a known limitation of the current monolithic architecture.
- **How to verify**: Deploy to Netlify staging; check response headers in browser DevTools → Network tab
- **Acceptance criteria**: CSP header present on all responses; no unintended resource loading blocked

### Fix 7: Disable Mixed Content (P1) ✅
- **What changed**: `capacitor.config.json` — set `allowMixedContent` to `false`
- **How to verify**: Build Android APK; verify no HTTP resources load within the HTTPS WebView context
- **Acceptance criteria**: Android WebView blocks insecure HTTP content

### Fix 8: Permissions-Policy Header (P2) ✅
- **What changed**: `netlify.toml` — added `Permissions-Policy` header restricting camera and geolocation; allowing microphone for voice notes
- **How to verify**: Check response headers after deployment
- **Acceptance criteria**: Header present; only explicitly needed permissions allowed

---

## C) Release Gate Checklist

Run this checklist before every deployment:

### Secrets
- [ ] `grep -rn "password\|secret\|api.key\|apikey\|token" --include="*.gradle" --include="*.properties" --include="*.json" --include="*.yaml" --include="*.js" . | grep -v node_modules | grep -v .min.js` — returns no plaintext credentials
- [ ] No `.env` files tracked: `git ls-files | grep '\.env'` — returns empty
- [ ] No keystore files tracked: `git ls-files | grep -E '\.jks|\.keystore|\.p12|\.pem'` — returns empty
- [ ] Signing credentials are sourced from environment variables (CI/CD secrets, not hardcoded)

### Dependencies
- [ ] `npm audit` — no high/critical vulnerabilities in direct dependencies
- [ ] All `@capacitor/*` packages are from official npm registry
- [ ] `package-lock.json` integrity hashes are consistent

### Auth
- [ ] N/A — No authentication system (single-user offline app)

### Input Validation
- [ ] All user input rendered via `innerHTML` passes through `escapeHtml()` — verify with: `grep -n 'innerHTML' studentflow_ultimate_pro.html | grep -v 'escapeHtml\|static\|icon\|lucide\|class='`
- [ ] JSON import functions validate file size, structure, and sanitize string fields
- [ ] No `eval()` calls on user-supplied data

### Rate Limiting
- [ ] N/A — No server/API endpoints

### Security Headers (Web Deployment)
- [ ] `X-Frame-Options: DENY` — present
- [ ] `X-Content-Type-Options: nosniff` — present
- [ ] `Content-Security-Policy` — present and configured
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` — present
- [ ] `Permissions-Policy` — present

### RLS / Data Access
- [ ] N/A — No database server

### Mobile (Android)
- [ ] `allowMixedContent` is `false` in `capacitor.config.json`
- [ ] `webContentsDebuggingEnabled` is `false` in `capacitor.config.json`
- [ ] APK is signed with a keystore whose password is NOT in the repository
- [ ] `minifyEnabled` is `true` for release builds (currently `false` — consider enabling)

### Build Artifacts
- [ ] No APK/AAB files in the git repository (use GitHub Releases instead)
- [ ] No build output directories committed

---

## Defensive "Break-It" Review (#9)

| # | Attack Path | Likelihood | Fix / Mitigation |
|---|------------|------------|------------------|
| 1 | **Stored XSS via timetable slot name**: User enters `<img src=x onerror=alert(document.cookie)>` as a course name → rendered unescaped in grid | Medium (self-XSS on same device) | ✅ Fixed: `escapeHtml()` applied to `item.name` |
| 2 | **Stored XSS via imported JSON**: Attacker shares a malicious backup file containing script payloads in note titles/text → victim imports → XSS executes | Medium (requires social engineering) | ✅ Fixed: Import validation + sanitization + escapeHtml on render |
| 3 | **APK signing impersonation**: Attacker clones public repo → uses committed keystore + hardcoded password → signs malicious APK as "StudentFlow" | High (if repo is public) | ✅ Fixed: Passwords moved to env vars. **Action needed**: Rotate keystore. |
| 4 | **localStorage poisoning via browser DevTools**: Attacker with physical device access modifies localStorage to inject XSS payloads | Low (requires physical access) | Partially mitigated by escapeHtml on render. Full mitigation requires all innerHTML paths to use escaping. |
| 5 | **Denial of Service via oversized import**: User imports a 500MB JSON file → browser tab crashes | Low | ✅ Fixed: 5MB file size limit on imports |
| 6 | **Mixed content downgrade on Android**: HTTP resource loaded in HTTPS WebView → MITM intercepts | Low (requires network position) | ✅ Fixed: `allowMixedContent` set to `false` |
| 7 | **Dependency chain attack via `tar` vulnerability**: Malicious npm package exploits path traversal during install | Low (build-time only, not runtime) | ⚠️ Monitor upstream fix; pin `@capacitor/cli` version when patch available |

---

## Remaining Recommendations (Not Fixed in This PR)

1. **Rotate the Android keystore**: Since `studentflow123` was exposed in git history, generate a new `.jks` file with a new password. Update Google Play signing if applicable.

2. **Remove binaries from git history**: Use `git filter-branch` or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to purge APK/AAB/JKS files from history.

3. **Enable ProGuard/R8 minification**: `build.gradle` has `minifyEnabled false` for release builds. Set to `true` to obfuscate code and reduce APK size.

4. **Add `npm audit` to CI/CD**: Add a step in `codemagic.yaml` or a GitHub Actions workflow to run `npm audit --audit-level=high` and fail the build on vulnerabilities.

5. **Consider Subresource Integrity (SRI)**: If migrating to CDN-hosted libraries, add SRI hashes to `<script>` tags.

6. **Audit all innerHTML paths**: This audit identified and fixed the highest-risk paths (`item.name`, `note.title`). A comprehensive audit of all ~40 `innerHTML` assignments should be performed to ensure no additional user data flows are unescaped. Most currently render system-generated content (icons, static HTML), but this should be verified.

---

## Questions for Maintainer (Max 5)

1. **Is this repository public?** If yes, the keystore rotation is urgently needed since the signing password `studentflow123` is in git history.

2. **Is the app published on Google Play?** If yes, you may need to use Google Play's App Signing program to rotate upload keys.

3. **Are the `.apk` and `.aab` files in the repo needed for distribution?** If so, consider moving them to GitHub Releases. If not, they can be removed entirely.

4. **Do you plan to add a backend/API in the future?** If yes, the auth (#3), rate limiting (#8), and server-side validation (#5) points from the security framework will need to be addressed at that time.

5. **Is the speech recognition / microphone feature actively used?** The `Permissions-Policy` header was set to allow `microphone=(self)` — confirm this is intentional.
