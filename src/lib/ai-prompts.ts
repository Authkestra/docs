/**
 * Authkestra Documentation AI Prompts Dictionary.
 *
 * Maps every documentation slug (across concepts/, guides/, providers/, advanced/, storage/, and root index)
 * to a tailored, context-specific prompt for AI coding assistants (Claude, Cursor, etc.).
 *
 * Target: authkestra = "0.13"
 * Reference: https://docs.authkestra.com/llms-full.txt
 */

export const AI_PROMPTS: Record<string, string> = {
  // Root index / Introduction
  index:
    'Implement an authentication stack using Authkestra v0.13 (authkestra = "0.13"). Configure the typestate builder Authkestra::builder() with Axum (features = ["axum", "memory", "github"]). Note that session and token state start as Missing at compile time and require a concrete store (e.g. MemoryStore or RedisStore) plus a cookie encryption key before calling .build(). Use AkWebAppEngine in your Axum router state and inject AuthSession into protected handlers. Refer to the complete documentation at https://docs.authkestra.com/llms-full.txt.',

  // Concepts
  'concepts/architecture':
    "Architect a modular identity service using Authkestra v0.13 (authkestra = \"0.13\"). Follow Authkestra's three-layer architecture: authkestra-engine (pure framework-agnostic core), extensions (authkestra-providers, authkestra-oidc, authkestra-policy, authkestra-ssf, authkestra-mcp), and adapters (authkestra-axum / authkestra-actix). Never create a UserStore trait — Authkestra has no user table; your application owns user records while Authkestra manages protocol state via KvStore, SessionStore, and OpStore. Refer to https://docs.authkestra.com/llms-full.txt.",

  'concepts/typestate-builder':
    'Construct an Authkestra v0.13 (authkestra = "0.13") engine enforcing compile-time safety with the typestate builder pattern. Call Authkestra::builder() which initializes Engine<Missing, Missing>. Supply a session store to transition to Engine<S, Missing> (AkWebAppEngine), a token manager for Engine<Missing, T> (AkApiEngine), or both for Engine<S, T> (AkEngine). Calling .build() while required type parameters remain Missing is rejected by the Rust compiler. Derive AxumState or ActixState on your application router state. Refer to https://docs.authkestra.com/llms-full.txt.',

  // Guides
  'guides/quickstart':
    'Implement an end-to-end GitHub OAuth2 login flow using Authkestra v0.13 (authkestra = "0.13", features = ["axum", "memory", "github"]). Initialize Authkestra::builder() with MemoryStore::new(), configure GitHubProvider with client credentials and scopes, set an encryption key with cookie_key(), and mount auth routes with .with_auth_routes(). Protect an Axum endpoint by extracting AuthSession<MyUser> and verify user authentication. Refer to https://docs.authkestra.com/llms-full.txt.',

  'guides/framework-integration':
    'Integrate Authkestra v0.13 (authkestra = "0.13", features = ["axum"] or ["actix"]) into a web application router. Wrap Arc<AkWebAppEngine> in your application state using #[derive(AxumState)] or #[derive(ActixState)]. Extract AuthSession for cookie/session-based web apps or AuthToken for bearer JWT API routes. Use AxumExt / ActixExt to wire automatic /auth/login/{provider}, /auth/callback/{provider}, and /auth/logout routes with encrypted cookie state. Refer to https://docs.authkestra.com/llms-full.txt.',

  'guides/wired-endpoints':
    'Configure and customize Authkestra v0.13 (authkestra = "0.13", features = ["axum", "memory"]) standard endpoints. Use AxumExt::with_auth_routes or manual route wiring for /auth/login/:provider, /auth/callback/:provider, and /auth/logout. Ensure CSRF protection via encrypted state cookies without database lookups. Use stateless_auth_routes() for stateless OAuth2 JWT flows. Refer to https://docs.authkestra.com/llms-full.txt.',

  'guides/ai-agents':
    'Secure AI agents and Model Context Protocol (MCP) servers using Authkestra v0.13 (authkestra = "0.13", features = ["mcp", "passkeys", "axum"]). Use McpRouter to define tool endpoints across three security tiers: McpSecurityTier::Public, McpSecurityTier::Scoped, and McpSecurityTier::HumanApproved. For sensitive tools, bind parameters cryptographically using RFC 8785 JSON Canonicalization Scheme (JCS) SHA-256 digests and require a human biometric passkey step-up pulse before dispensing downstream OAuth tokens from EncryptedKvTokenVault (AES-256-GCM). Refer to https://docs.authkestra.com/llms-full.txt.',

  'guides/device-attestation':
    'Implement cryptographic device attestation and key issuance using Authkestra v0.13 (authkestra = "0.13", features = ["op", "devsig", "axum"]). Configure DeviceIdentity with hardware-backed Ed25519 or ECDSA keys. Enforce per-request signatures (X-Signature and X-Attestation) with body digest hashing (bdh) against an Authkestra OpenID Provider verifying RFC 8693 token exchange. Refer to https://docs.authkestra.com/llms-full.txt.',

  // Authentication Flows / Providers
  'providers/oauth2':
    'Implement stateless OAuth2 authentication with Authkestra v0.13 (authkestra = "0.13", features = ["axum", "memory"]). Use AxumStatelessExt with encrypted cookie state and nonce validation to issue signed JWTs upon successful OAuth callback without writing session records to a database. Configure JwtStrategy for token verification. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/oidc':
    'Configure an OpenID Connect (OIDC) client in Authkestra v0.13 (authkestra = "0.13", features = ["oidc", "axum", "memory"]). Use OidcProvider::discover to asynchronously fetch and background-cache provider metadata from .well-known/openid-configuration. Validate ID tokens using the provider\'s JWKS key set, enforce nonce binding, and map claims to an authenticated AuthSession. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/client-credentials':
    'Implement the OAuth 2.0 Client Credentials grant for machine-to-machine (M2M) communication using Authkestra v0.13 (authkestra = "0.13", features = ["engine", "axum"]). Support both client_secret_post/basic and asymmetric private_key_jwt (RFC 7523) client assertion authentication. Validate scopes and issue scoped AuthToken access tokens without human session overhead. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/device-flow':
    'Implement the RFC 8628 OAuth 2.0 Device Authorization Grant for headless CLIs and input-constrained devices using Authkestra v0.13 (authkestra = "0.13", features = ["op", "axum", "memory"]). Issue user_code and device_code with verification_uri, handle client polling with slow_down / authorization_pending status codes, and issue tokens once approved in a browser session. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/passkeys':
    'Implement FIDO2 / WebAuthn passkey authentication using Authkestra v0.13 (authkestra = "0.13", features = ["webauthn", "axum", "memory"]). Use WebAuthnAuthMethod with CredentialStore. In v0.13, enforce re-proof gated enrolment: start_register requires (&Identity, &ReproofRequirement) to prevent confused-deputy attacks. Generate stable UUIDv5 user handles to prevent PII leakage to authenticators and validate origin and RP ID. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/totp':
    'Implement Time-based One-Time Password (TOTP, RFC 6238) MFA in Authkestra v0.13 (authkestra = "0.13", features = ["totp", "axum", "memory"]). In v0.13, register_totp requires (&Identity, &ReproofRequirement) to ensure the user re-authenticates before enrolling an authenticator app. Validate 6-digit codes with replay attack prevention and configurable drift windows. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/magic-link':
    'Implement passwordless email magic link authentication using Authkestra v0.13 (authkestra = "0.13", features = ["engine", "memory", "axum"]). Use MagicLinkAuthMethod backed by a store implementing AtomicConsume to ensure single-use consumption and eliminate TOCTOU race conditions when links are scanned by email security filters. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/otp':
    'Implement email or SMS one-time passcode (OTP) authentication in Authkestra v0.13 (authkestra = "0.13", features = ["engine", "memory", "axum"]). Use OtpAuthMethod backed by a KvStore implementing AtomicDecrement to enforce strict per-challenge attempt limits, fail closed on exhaustion, and enforce short expiration TTLs. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/recovery-codes':
    'Implement backup recovery code authentication in Authkestra v0.13 (authkestra = "0.13", features = ["engine", "memory", "axum"]). Use RecoveryCodeAuthMethod with Argon2id cryptographic hashing. In v0.13, generating recovery codes requires (&Identity, &ReproofRequirement). Consuming a recovery code requires AtomicConsume to guarantee single-use invalidation. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/bot-protection':
    'Integrate CAPTCHA and bot protection into authentication flows using Authkestra v0.13 (authkestra = "0.13", features = ["engine", "axum"]). Use TurnstileVerifier or HCaptchaVerifier to validate client challenge tokens fail-closed before processing credential submission or triggering expensive password hashing. Refer to https://docs.authkestra.com/llms-full.txt.',

  'providers/device-signatures':
    'Implement cryptographic request signing using Authkestra v0.13 (authkestra = "0.13", features = ["devsig", "axum"]). Enforce proof-of-possession on HTTP requests via X-Signature and X-Attestation headers. Use SignedRequest to verify Ed25519/ECDSA signatures over method, path, timestamp, and body digest hash (bdh) to protect APIs against MITM and replay attacks. Refer to https://docs.authkestra.com/llms-full.txt.',

  // Building Servers & Advanced
  'advanced/resource-server':
    'Build a secure OAuth 2.0 Resource Server using Authkestra v0.13 (authkestra = "0.13", features = ["resource", "axum"]). Use Guard with JwtStrategy to validate Bearer tokens across multiple issuer JWKS endpoints. Enforce sender-constrained tokens via DPoP (RFC 9449) and mTLS (RFC 8705). Integrate with CedarPolicyEngine for fine-grained attribute-based access control. Refer to https://docs.authkestra.com/llms-full.txt.',

  'advanced/op-server':
    "Deploy a full OpenID Connect Provider (OP) using Authkestra v0.13 (authkestra = \"0.13\", features = [\"op\", \"sql-postgres\", \"axum\"]). Configure OpConfig and SqlxOpStore to serve discovery metadata at .well-known/openid-configuration, authorization endpoint, token endpoint with RFC 8693 Token Exchange, and RFC 8628 Device Authorization Grant. Refer to https://docs.authkestra.com/llms-full.txt.",

  'advanced/policy-engine':
    'Implement declarative Attribute-Based Access Control (ABAC) using AWS Cedar with Authkestra v0.13 (authkestra = "0.13", features = ["policy", "axum"]). Use CedarPolicyEngine (authkestra_policy::PolicyEngine) with AuthorizationRequest and a custom ResourceLoader (e.g. MemoryResourceLoader or DB loader). Note that the engine performs no direct I/O and fails closed with PolicyError::UnreliableDecision if an erroring forbid policy is skipped. Wire into Axum/Actix guards and MCP tool execution. Refer to https://docs.authkestra.com/llms-full.txt.',

  'advanced/continuous-access-evaluation':
    'Implement OpenID Shared Signals Framework (SSF) and Continuous Access Evaluation Profile (CAEP) push event receiver in Authkestra v0.13 (authkestra = "0.13", features = ["ssf", "axum", "memory"]). Wire PushReceiver to handle POST /.well-known/ssf/events and POST /ssf/events. Configure SetVerifier with RFC 8417 Security Event Token validation and attach SessionRevocationHandler to automatically revoke matching sessions in SessionStore upon receiving SessionRevoked or CredentialChange events. Refer to https://docs.authkestra.com/llms-full.txt.',

  'advanced/instrumentation':
    'Configure production observability for Authkestra v0.13 (authkestra = "0.13", features = ["engine", "axum"]). Leverage built-in tracing spans and events emitted across authentication ceremonies, OAuth handshakes, and Cedar policy evaluation. Ensure span attributes never leak PII or plaintext credentials while logging decision reasons and policy IDs. Refer to https://docs.authkestra.com/llms-full.txt.',

  // Storage
  'storage/overview':
    'Design storage backends for Authkestra v0.13 (authkestra = "0.13", features = ["memory", "redis", "sql-postgres"]). Implement database-agnostic traits: SessionStore for user sessions, KvStore for short-lived protocol state (PKCE, magic links, OTP), CredentialStore for WebAuthn/TOTP secrets, and OpStore for OpenID Provider entities. Authkestra has no user table trait; your application schema owns user records outright. Refer to https://docs.authkestra.com/llms-full.txt.',

  'storage/kv-store':
    'Configure key-value storage in Authkestra v0.13 (authkestra = "0.13", features = ["memory"] or ["redis"]). Use MemoryStore for development and testing, or RedisStore for production distributed caching. Store ephemeral OAuth state, magic link tokens, and rate-limiting counters with strict TTL expiration and atomic operations. Refer to https://docs.authkestra.com/llms-full.txt.',

  'storage/sql-store':
    "Implement relational database storage for Authkestra v0.13's OpenID Provider (authkestra = \"0.13\", features = [\"op\", \"sql-postgres\"] or [\"sql-mysql\"] / [\"sql-sqlite\"]). Use SqlxOpStore to persist OAuth2 clients, authorization codes, refresh tokens, and consent grants with connection pooling and transactional integrity. Refer to https://docs.authkestra.com/llms-full.txt.",

  'storage/implementing-stores':
    'Implement custom storage traits for Authkestra v0.13 (authkestra = "0.13", features = ["engine"]). Implement KvStore, AtomicConsume (for single-use tokens like magic links and recovery codes), and AtomicDecrement (for OTP attempt throttling) without TOCTOU race conditions. Implement SessionStore for session persistence. Ensure all storage errors are cleanly mapped to StoreError. Refer to https://docs.authkestra.com/llms-full.txt.',
};

export const FALLBACK_AI_PROMPT =
  'Build a secure authentication and authorization solution using Authkestra v0.13 (authkestra = "0.13"). Configure the compile-time typestate builder Authkestra::builder() with Axum (features = ["axum", "memory"]) or Actix-web (features = ["actix", "memory"]). Inject session and protocol stores before invoking .build() and extract AuthSession or AuthToken in your route handlers. Refer to the complete documentation corpus at https://docs.authkestra.com/llms-full.txt.';

/**
 * Normalizes an arbitrary documentation slug or pathname into a canonical key.
 */
export function normalizeSlug(slug: string): string {
  let cleaned = (slug || '').trim().replace(/^\/+|\/+$/g, '');
  cleaned = cleaned.replace(/\.(md|mdx|html)$/, '');
  if (cleaned === '' || cleaned === 'index') {
    return 'index';
  }
  return cleaned;
}

/**
 * Returns a tailored AI prompt for the given documentation slug, or a comprehensive fallback prompt.
 */
export function getAiPrompt(slug: string): string {
  const key = normalizeSlug(slug);
  return AI_PROMPTS[key] ?? FALLBACK_AI_PROMPT;
}
