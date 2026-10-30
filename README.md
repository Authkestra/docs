<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/mark-on-dark.svg">
  <img src=".github/assets/mark-on-light.svg" alt="Authkestra" width="56" height="56">
</picture>

# Authkestra Documentation Site (`docs.authkestra.com`)

[![Documentation](https://img.shields.io/website?url=https%3A%2F%2Fdocs.authkestra.com&label=docs.authkestra.com&logo=astro&color=e85d2f)](https://docs.authkestra.com)
[![Landing Page](https://img.shields.io/badge/landing-authkestra.com-f4845f)](https://authkestra.com)
[![crates.io](https://img.shields.io/crates/v/authkestra.svg?color=ce422b)](https://crates.io/crates/authkestra)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](https://github.com/Authkestra/authkestra)
[![Agent Skills](https://img.shields.io/badge/agent%20skills-Authkestra%2Fskills-informational)](https://github.com/Authkestra/skills)
[![Single-File Corpus](https://img.shields.io/badge/corpus-llms--full.txt-orange)](https://docs.authkestra.com/llms-full.txt)

The official documentation site for **[Authkestra](https://authkestra.com)** -  The Compile-Time Safe Identity & AI Agent Authorization Engine for Rust.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), deploying to **<https://docs.authkestra.com>**.

---

## 📖 What This Site Covers

Comprehensive guides, API specifications, and architectural documentation for:

1. **Getting Started**:
 - Quickstart guides for Axum (`authkestra-axum`) and Actix-web (`authkestra-actix`).
 - The Typestate Builder Pattern (`Engine<S, T>`, `AkWebAppEngine`, `AkApiEngine`, `AkEngine`).
 - Wired endpoints vs. manual extractor integration.
2. **Authentication Flows & Passwordless**:
 - FIDO2 Passkeys (`WebAuthnAuthMethod`) with mandatory Re-Proof Gating.
 - TOTP Authenticator Apps (RFC 6238), Magic Links, and Email/SMS OTP codes.
 - Stateless OAuth2 with AES-256-GCM encrypted cookies (`AxumStatelessExt`).
 - OIDC Client Discovery, Client Credentials, and RFC 8628 Device Flow.
 - Cloudflare Turnstile & hCaptcha bot protection.
 - Device Signatures & Proof-of-Possession (`authkestra-devsig`).
3. **AI Agent & MCP Tool Security (`authkestra-mcp`)**:
 - Three composable security tiers (`Public`, `Scoped`, `HumanApproved`).
 - RFC 8785 JSON Canonicalization Scheme (JCS) and deterministic SHA-256 challenge digests.
 - Human-in-the-Loop (HITL) Passkey step-up approvals and single-use `AtomicConsume`.
 - Zero-Trust Downstream Token Vault (`DownstreamTokenBroker`, `EncryptedKvTokenVault`).
4. **Enterprise Servers & Policy**:
 - Full OpenID Provider (`authkestra-op`), RFC 8693 Token Exchange, and key rotation.
 - Resource Server API guard with RFC 9449 DPoP and RFC 8705 mTLS token binding.
 - Declarative AWS Cedar policy evaluation (`authkestra-policy`).
 - Continuous Access Evaluation Protocol (CAEP / SSF RFC 8417) via `authkestra-ssf`.
5. **AI Discoverability & Single-File Documentation**:
 - Complete single-file documentation corpus at **[`https://docs.authkestra.com/llms-full.txt`](https://docs.authkestra.com/llms-full.txt)**.
 - Summary context for AI agents at **[`https://authkestra.com/llms.txt`](https://authkestra.com/llms.txt)**.

---

## 🚀 Project Structure

```
.
├── public/                     # Favicons and static assets
├── src/
│   ├── content/
│   │   └── docs/               # Markdown/MDX documentation pages
│   ├── styles/
│   │   ├── tokens.css          # Immutable copy of canonical design tokens
│   │   └── custom.css          # Maps tokens.css onto Starlight's --sl-* variables
│   └── content.config.ts
├── astro.config.mjs            # Starlight configuration and sidebar navigation
├── package.json
└── tsconfig.json
```

---

## 🎨 Design Tokens

`src/styles/tokens.css` is a **verbatim copy** of `authkestra/design/tokens.css` in the core repository. Do not edit it here. `src/styles/custom.css` imports `tokens.css` and maps variables to Starlight's `--sl-*` properties. Typography is bundled locally via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono` for zero third-party font requests.

---

## 🧞 Development Commands

```bash
# Install dependencies
pnpm install

# Start local dev server (http://localhost:4321)
pnpm dev

# Build production site to ./dist/
pnpm build

# Preview build locally
pnpm preview

# Run Astro CLI checks
pnpm astro check
```

---

## ✍️ Documentation Contributions

When documenting public API signatures, verify them against `authkestra/crates/` in the main repository. If a runnable example exists under `crates/authkestra/examples/`, reference it directly.

---

## 🌐 Ecosystem Links

- **Main Engine Repo**: [github.com/Authkestra/authkestra](https://github.com/Authkestra/authkestra)
- **Landing Page**: [authkestra.com](https://authkestra.com)
- **Interactive Playground**: [play.authkestra.com](https://play.authkestra.com)
- **Official Skills Pack**: [github.com/Authkestra/skills](https://github.com/Authkestra/skills)
- **crates.io**: [crates.io/crates/authkestra](https://crates.io/crates/authkestra)

---

## 📜 Licence

Dual-licensed under **MIT** or **Apache-2.0**, at your option. Matching Authkestra itself.
