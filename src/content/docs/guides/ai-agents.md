---
title: AI Coding Assistants & Agent Auth
description: Using Authkestra with Claude Code, Cursor, and Windsurf via llms.txt and official skills, and securing AI agents & MCP servers in Rust.
---

Authkestra is designed for two sides of the AI era:
1. **Zero-Hallucination Code Generation ("Vibe-Coding" Guardrails)**: Because `Authkestra::builder()` uses a strict **Typestate Builder Pattern**, an AI coding assistant cannot accidentally wire a session route without a session store or a stateless JWT callback without a token manager -  invalid authentication flows fail at `cargo check` instead of shipping a runtime vulnerability.
2. **High-Assurance AI Agent & MCP Authorization**: Authkestra's embedded OIDC Provider (`authkestra-op`), Resource Server (`authkestra-resource`), Device-Bound Signatures (`authkestra-devsig`), WebAuthn Passkeys, and AWS Cedar Policy Engine (`authkestra-policy`) provide the exact cryptographic primitives needed to authenticate AI agents, broker scoped downstream tokens, and enforce human-in-the-loop (HITL) step-up approval.

---

## 1. `llms.txt` & Official Coding Agent Skills

### `llms.txt` and `llms-full.txt`

Every deploy of `docs.authkestra.com` generates machine-readable documentation indexes following the [llms.txt standard](https://llmstxt.org/):

- [**`/llms.txt`**](/llms.txt): Concise index of all Authkestra crates, feature flags, architectural rules, and documentation links.
- [**`/llms-full.txt`**](/llms-full.txt): Complete, single-file concatenation of the entire Authkestra documentation corpus for pasting into Claude, Cursor `@Docs`, Windsurf, or local RAG pipelines.

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

## 2. Securing AI Agents & MCP Servers with `authkestra-mcp`

Enable the `mcp` feature on the `authkestra` facade crate (or depend on `authkestra-mcp` directly) to embed a three-tier Policy Enforcement Point directly into your Rust Model Context Protocol (MCP) server:

```toml
[dependencies]
authkestra = { version = "0.13", features = ["axum", "mcp", "memory"] }
```

### Three Composable Security Tiers (`McpSecurityTier`)
Register tools on `McpRouter::builder()` with per-tool security policies:
- **`McpSecurityTier::Public`**: Callable without authentication (or with optional caller identity).
- **`McpSecurityTier::Scoped { required_scopes }`**: Validates Bearer or DPoP-bound tokens via `authkestra-resource`, returning RFC 9728 `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource"` on `401 Unauthorized` and `insufficient_scope` on `403 Forbidden`.
- **`McpSecurityTier::HumanApproved { required_scopes, reproof, approval_ttl_secs }`**: Requires both scope validation and a single-use cryptographic step-up human approval bound to the exact tool name and canonicalized arguments.

### RFC 8785 JCS Cryptographic Parameter Binding
When an agent invokes a `HumanApproved` tool without an execution proof, `authkestra-mcp` canonicalizes the JSON arguments per **RFC 8785 (JCS)** and computes a deterministic SHA-256 digest over `(session_id, tool_name, jcs_canonical_arguments, expires_at)`. It returns a `-32042` step-up elicitation challenge (`approval_id`, `challenge_digest`, `verification_url`). Once the human user approves the challenge with a fresh proof (`ReproofRequirement` + [Passkey](/providers/passkeys/), [TOTP](/providers/totp/), or [Device Signature](/providers/device-signatures/)), `authkestra-mcp` mints a single-use execution token consumed atomically via `AtomicConsume`. Mutating a single tool parameter (e.g., changing `amount: 50` to `amount: 5000`) deterministically invalidates the approval.

### Zero-Trust Downstream Token Vault (`EncryptedKvTokenVault`)
Never expose long-lived OAuth refresh tokens or third-party API keys inside an LLM's context window. `EncryptedKvTokenVault` encrypts downstream provider tokens at rest in your `KvStore` using **AES-256-GCM** with AAD subject/provider binding (`{subject_id}:{provider_id}`), and `ToolContext::downstream_token("github")` resolves scoped tokens on behalf of the authenticated `Identity` inside your tool handler.

### Guardrails & Instant Kill-Switch (`authkestra-policy` + `authkestra-ssf`)
Evaluate tool invocations against declarative [AWS Cedar policies](/advanced/policy-engine/) (`authkestra-policy`) and terminate compromised agent sessions in real time via [OpenID CAEP `SessionRevoked` events](/advanced/continuous-access-evaluation/) (`authkestra-ssf`).
