import type { APIRoute } from 'astro';

const LLMS_TXT = `# Authkestra (v0.13)

> Authkestra is a modular, framework-agnostic authentication and authorization orchestration engine for Rust. It combines an OAuth2/OIDC client, stateless/stateful session orchestrator, passwordless & MFA engine (Passkeys/WebAuthn, TOTP, Magic Links, Email/SMS OTP, Recovery Codes, Re-proof gating), Resource Server (JWT/JWKS/DPoP/mTLS), OpenID Connect Provider (OP with RFC 8693 Token Exchange & Device Flow), Device-Bound Signatures (\`authkestra-devsig\`), AWS Cedar Policy Engine (\`authkestra-policy\`), and OpenID Shared Signals / CAEP receiver (\`authkestra-ssf\`) behind a compile-time safe Typestate Builder (\`Authkestra::builder()\`).

## Critical Rules for AI Coding Assistants

- **Target Version**: \`authkestra = "0.13"\`.
- **RFC-001 Architecture Consolidation**: \`authkestra-core\`, \`authkestra-flow\`, \`authkestra-token\`, and \`authkestra-session\` no longer exist — they were merged into \`authkestra-engine\` (re-exported via \`authkestra::core\` and \`authkestra::store\`).
- **Removed Facade Features**: There is NO \`session\` or \`token\` feature on \`authkestra\` or \`authkestra-engine\` in \`0.13\`. Session and token machinery are always compiled into \`authkestra-engine\`. Pick a storage backend feature instead: \`memory\`, \`redis\`, \`sql-postgres\`, \`sql-mysql\`, or \`sql-sqlite\`.
- **TLS Backend**: \`rustls-aws-lc-rs\` is enabled by default. If using \`default-features = false\` with \`rustls-no-provider\`, you MUST install a \`rustls::crypto::CryptoProvider\` before constructing any Authkestra client or \`reqwest\` will panic at runtime.
- **Typestate Builder**: \`Authkestra::builder()\` returns \`Engine<S, T>\` where \`S\` (session store) and \`T\` (token manager) start as \`Missing\`. Use the aliases \`AkWebAppEngine\` (sessions), \`AkApiEngine\` (tokens), or \`AkEngine\` (both) in your router state (\`#[derive(AxumState)]\` / \`#[derive(ActixState)]\`).
- **Stateless OAuth**: OAuth \`state\` and \`nonce\` live in encrypted cookies, never in the database.
- **No User Table**: Authkestra deliberately has no \`UserStore\` trait. Your application owns user/account records; Authkestra provides traits for protocol state (\`KvStore\`, \`SessionStore\`, \`CredentialStore\`, \`OpStore\`).
- **Re-Proof Gated Enrolment (\`0.13+\`)**: \`TotpAuthMethod::register_totp\`, \`WebAuthnAuthMethod::start_register\`, and \`RecoveryCodeAuthMethod::generate\` require \`(&Identity, &ReproofRequirement, ...)\` rather than a bare \`user_id: &str\` to prevent confused-deputy and stale-session escalation attacks.

## Full Documentation Corpus

- [Complete Single-File Documentation (llms-full.txt)](https://docs.authkestra.com/llms-full.txt): Full Markdown documentation and code examples for all Authkestra crates and flows.
- [Official Agent Skills Pack](https://github.com/Authkestra/skills): Install via \`/plugin marketplace add Authkestra/skills\`.

## Getting Started & Core Concepts

- [Introduction](https://docs.authkestra.com/): Overview of the embedded Rust identity engine.
- [Architecture](https://docs.authkestra.com/concepts/architecture/): The three-layer design (Engine, Extensions, Adapters).
- [Typestate Builder Pattern](https://docs.authkestra.com/concepts/typestate-builder/): Compile-time guarantees with \`Engine<S, T>\`, \`AkWebAppEngine\`, \`AkApiEngine\`, and \`AkEngine\`.
- [Quickstart](https://docs.authkestra.com/guides/quickstart/): Working GitHub OAuth2 login in Axum and Actix-web.
- [Framework Integration](https://docs.authkestra.com/guides/framework-integration/): \`AuthSession\`, \`AuthToken\`, \`AxumExt\`, \`AxumStatelessExt\`, \`ActixExt\`, and \`ActixStatelessExt\`.
- [Wired Endpoints](https://docs.authkestra.com/guides/wired-endpoints/): Automatic vs. manual route wiring for \`/auth/login/{provider}\`, \`/auth/callback/{provider}\`, and \`/auth/logout\`.
- [AI Coding Assistants & Agent Auth](https://docs.authkestra.com/guides/ai-agents/): Using \`llms.txt\`, \`Authkestra/skills\`, and securing AI agents & MCP servers.

## Authentication Flows

- [Stateless OAuth2](https://docs.authkestra.com/providers/oauth2/): Encrypted-cookie OAuth2 with JWT issuance (\`AxumStatelessExt\`).
- [OIDC Client](https://docs.authkestra.com/providers/oidc/): Background-cached OIDC discovery (\`OidcProvider::discover\`).
- [Client Credentials](https://docs.authkestra.com/providers/client-credentials/): Machine-to-machine OAuth2 and \`private_key_jwt\` (RFC 7523).
- [Device Flow](https://docs.authkestra.com/providers/device-flow/): RFC 8628 Device Authorization Grant for CLIs and headless agents.
- [Passkeys (WebAuthn)](https://docs.authkestra.com/providers/passkeys/): \`WebAuthnAuthMethod\`, \`ReproofRequirement\`, \`PasskeyEnrolment\`, and stable UUIDv5 user handles.
- [TOTP (Authenticator Apps)](https://docs.authkestra.com/providers/totp/): RFC 6238 TOTP enrolment and step-up MFA challenges with replay tracking.
- [Magic Link](https://docs.authkestra.com/providers/magic-link/): Single-use email magic links (\`MagicLinkAuthMethod\`) with \`AtomicConsume\`.
- [Email/SMS One-Time Codes](https://docs.authkestra.com/providers/otp/): Short numeric one-time codes (\`OtpAuthMethod\`) with per-challenge attempt budgets (\`AtomicDecrement\`).
- [Recovery Codes](https://docs.authkestra.com/providers/recovery-codes/): Single-use backup authenticators (\`RecoveryCodeAuthMethod\`) with Argon2id hashing and \`ReproofRequirement\`.
- [Bot Protection (CAPTCHA)](https://docs.authkestra.com/providers/bot-protection/): Fail-closed Cloudflare Turnstile and hCaptcha verification.
- [Device Signatures](https://docs.authkestra.com/providers/device-signatures/): Per-request proof-of-possession (\`X-Signature\` + \`X-Attestation\`) with body digest hashing (\`bdh\`) via \`authkestra-devsig\`.

## Building Servers & Policy

- [Resource Server (API)](https://docs.authkestra.com/advanced/resource-server/): \`Guard\`, \`JwtStrategy\`, multi-issuer JWKS, DPoP (RFC 9449), and mTLS (RFC 8705).
- [OpenID Provider (OP)](https://docs.authkestra.com/advanced/op-server/): Full OIDC Provider (\`authkestra-op\`), \`OpStore\`, RFC 8693 Token Exchange, Device Code grant, and attestation issuance.
- [Device Attestation](https://docs.authkestra.com/guides/device-attestation/): Enrolling and re-issuing hardware/service keys against \`authkestra-op\`.
- [Policy Engine (Cedar)](https://docs.authkestra.com/advanced/policy-engine/): Declarative authorization with AWS Cedar (\`authkestra-policy\`).
- [Continuous Access Evaluation (SSF/CAEP)](https://docs.authkestra.com/advanced/continuous-access-evaluation/): OpenID CAEP / RFC 8417 Security Event Token ingestion (\`authkestra-ssf\`).
- [Instrumentation & Tracing](https://docs.authkestra.com/advanced/instrumentation/): Production observability with \`tracing\`.

## Data & Storage

- [Storage Overview](https://docs.authkestra.com/storage/overview/): Database-agnostic trait architecture.
- [KV Stores](https://docs.authkestra.com/storage/kv-store/): \`MemoryStore\` and \`RedisStore\`.
- [OP SQL Store](https://docs.authkestra.com/storage/sql-store/): Relational \`SqlxOpStore\` for PostgreSQL, MySQL, and SQLite.
- [Implementing Custom Stores](https://docs.authkestra.com/storage/implementing-stores/): Implementing \`KvStore\`, \`AtomicConsume\`, \`AtomicDecrement\`, and \`IndexedKvStore\` without TOCTOU races.
`;

export const GET: APIRoute = async () => {
	return new Response(LLMS_TXT, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
