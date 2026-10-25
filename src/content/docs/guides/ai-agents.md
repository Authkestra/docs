---
title: AI Coding Assistants & Agent Auth
description: Using Authkestra with Claude Code, Cursor, and Windsurf via llms.txt and official skills, and securing AI agents & MCP servers in Rust.
---

Authkestra is designed for two sides of the AI era:
1. **Zero-Hallucination Code Generation ("Vibe-Coding" Guardrails)**: Because `Authkestra::builder()` uses a strict **Typestate Builder Pattern**, an AI coding assistant cannot accidentally wire a session route without a session store or a stateless JWT callback without a token manager — invalid authentication flows fail at `cargo check` instead of shipping a runtime vulnerability.
2. **High-Assurance AI Agent & MCP Authorization**: Authkestra's embedded OIDC Provider (`authkestra-op`), Resource Server (`authkestra-resource`), Device-Bound Signatures (`authkestra-devsig`), WebAuthn Passkeys, and AWS Cedar Policy Engine (`authkestra-policy`) provide the exact cryptographic primitives needed to authenticate AI agents, broker scoped downstream tokens, and enforce human-in-the-loop (HITL) step-up approval.

---

## 1. `llms.txt` & Official Coding Agent Skills

### `llms.txt` and `llms-full.txt`

Every deploy of `docs.authkestra.com` generates machine-readable documentation indexes following the [llms.txt standard](https://llmstxt.org/):

- **[`https://docs.authkestra.com/llms.txt`](/llms.txt)**: Concise index of all Authkestra crates, feature flags, architectural rules, and documentation links.
- **[`https://docs.authkestra.com/llms-full.txt`](/llms-full.txt)**: Complete, single-file concatenation of the entire Authkestra documentation corpus for pasting into Claude, Cursor `@Docs`, Windsurf, or local RAG pipelines.

### Official Agent Skill Pack (`Authkestra/skills`)

Install the official [Authkestra skill pack](https://github.com/Authkestra/skills) into Claude Code, Cursor, or any SKILL.md-compatible coding agent:

```bash
/plugin marketplace add Authkestra/skills
/plugin install authkestra@authkestra
```

| Skill | What it teaches your coding agent |
| --- | --- |
| `authkestra-quickstart` | End-to-end Axum/Actix setup, TLS backend selection, typestate builder, and extractor wiring (`v0.13`). |
| `authkestra-features` | Diagnosing missing Cargo feature flags vs. unmet typestate prerequisites. |
| `authkestra-store` | Implementing `KvStore`, `AtomicConsume`, `AtomicDecrement`, `CredentialStore`, and `OpStore`, validated with `authkestra-store-testsuite`. |
| `authkestra-social-login` | GitHub/Google/Discord OAuth2, OIDC discovery caching, and stateless encrypted-cookie handshakes. |
| `authkestra-op` | Running an embedded OpenID Provider: PKCE, DPoP, `private_key_jwt`, Device Flow, and RFC 8693 Token Exchange. |
| `authkestra-resource-server` | Protecting APIs and MCP servers with `Guard`, multi-issuer JWKS, DPoP, and mTLS. |
| `authkestra-mfa` | Passkeys (WebAuthn), TOTP, Magic Links, OTP, Recovery Codes, `ReproofRequirement`, and `authkestra-devsig`. |
| `authkestra-upgrade` | Migrating from pre-RFC-001 crates (`authkestra-core`, `authkestra-flow`, `authkestra-session`, `authkestra-token`) and upgrading to `0.13` `ReproofRequirement` signatures. |
| `authkestra-troubleshoot` | Resolving `rustls` CryptoProvider panics, cross-site OAuth cookie drops, and clock skew. |

---

## 2. Securing AI Agents & MCP Servers with Authkestra

When building Model Context Protocol (MCP) servers or autonomous agent gateways in Rust, Authkestra gives you four composable primitives inside a single binary:

### Delegated Agent Tokens via RFC 8693 Token Exchange (`authkestra-op`)
Never place long-lived user refresh tokens or god-mode API keys inside an LLM's context window. Enable `token_exchange_enabled: true` on `OpConfig` to let your agent gateway trade a user's token for a short-lived, strictly audience-bound (`allowed_audiences`) and scope-narrowed downstream token via `urn:ietf:params:oauth:grant-type:token-exchange`.

### Out-of-Band Human Approval via Device Flow (`DeviceFlow` + `authkestra-op`)
When a headless CLI agent or background worker hits a restricted tool call, initiate an [RFC 8628 Device Authorization Grant](/providers/device-flow/) against your `authkestra-op` server. The human user opens the verification URI on their phone or laptop and authenticates with a phishing-resistant [Passkey](/providers/passkeys/) before the agent receives its execution token.

### Cryptographic Parameter Binding (`authkestra-devsig`)
Standard bearer tokens only prove *who* authorized the agent, not *which parameters* the agent is sending. With [`authkestra-devsig`](/providers/device-signatures/), every request carries an `X-Attestation` (minted by `authkestra-op`) and a single-use `X-Signature` JWS whose `bdh` claim is the SHA-256 digest of the exact HTTP request body (`mth`, `pth`, `qsh`, `bdh`, `aud`). Modifying a single tool argument invalidates the signature before your handler ever runs.

### Guardrails & Instant Kill-Switch (`authkestra-policy` + `authkestra-ssf`)
Evaluate every tool invocation against declarative [AWS Cedar policies](/advanced/policy-and-ssf/) (`authkestra-policy`) and terminate compromised agent sessions in real time via [OpenID CAEP `SessionRevoked` events](/advanced/policy-and-ssf/#2-shared-signals-framework--caep-authkestra-ssf) (`authkestra-ssf`).
