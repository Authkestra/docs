---
title: Magic Link
description: Learn how to implement magic-link authentication in Authkestra, delivered however you choose.
---

A magic link authenticates someone by proving they control an inbox (or phone number): the application sends them a single-use URL, and following it produces an identity. Authkestra's part of that is deliberately small — it mints a single-use, TTL-bounded, subject-bound secret and consumes it exactly once. It does not own the address book, the mail transport, the template, or the question of whether an address corresponds to an account; delivering the link is always the application's job.

## Enabling Magic Link

To use magic links, enable the `magic-link` feature in your `Cargo.toml`:

```toml
[dependencies]
authkestra-engine = { version = "0.13", features = ["magic-link"] }
```

## Configuration

Magic link is implemented via the `MagicLinkAuthMethod` struct. You initialize it by passing a store that implements both `KvStore<MagicLinkRecord>` and `AtomicConsume<MagicLinkRecord>` (e.g. the built-in `RedisStore`, or `MemoryStore` for tests) — atomic fetch-and-remove is what makes a link single-use even against concurrent requests.

There is no `.with_magic_link()` convenience wrapper the way `.with_totp()` or `.with_webauthn()` exist; register it directly with `.with_auth_method()`:

```rust
use authkestra::Authkestra;
use authkestra_engine::auth::magic_link::MagicLinkAuthMethod;

// `my_store` implements `KvStore<MagicLinkRecord> + AtomicConsume<MagicLinkRecord>`
let engine = Authkestra::builder()
    .with_auth_method(MagicLinkAuthMethod::new(my_store))
    .build();
```

There is no enrolment step: `has_enrolled()` always returns `false` and `is_mfa_equivalent()` always returns `false`. Both are deliberate statements rather than inherited defaults — there is no enrolment ceremony (any subject the application can resolve can be sent a link), and proving you clicked a link is not phishing-resistant, so it earns no second-factor credit for an account whose recovery address is the same inbox.

## Minting a Link

Your application resolves whatever the user typed (an email address, say) into a `subject` string, then calls `mint` to get a secret to embed in a URL. Authkestra never sends anything — rendering and delivering the mail (or SMS) is entirely up to you.

```rust
use std::time::Duration;
use authkestra_engine::auth::magic_link::MagicLinkBinding;

let token = magic_link_method
    .mint("alice", Duration::from_secs(300), MagicLinkBinding::AnyContext)
    .await?;

// token.secret   -> embed in the link, e.g. https://example.com/login/confirm?token=...
// token.expires_at -> Unix seconds, useful for rendering in the email
```

`ttl` has no default — you must name it. `token.secret` is returned exactly once and is never recoverable afterward; if sending the mail fails, mint a new one rather than trying to retrieve the old secret.

:::caution
Minting twice for the same subject leaves **both** secrets live until they expire. That's intentional (the first mail may simply be slow) but means you cannot assume a fresh mint invalidates an earlier one still in someone's inbox.
:::

### Choosing a `MagicLinkBinding`

`MagicLinkBinding` has no default, and picking one is not optional — you must choose:

- **`MagicLinkBinding::AnyContext`** — the link works from anywhere. Cross-device flows work ("request on my laptop, open on my phone"), but a forwarded link, a shared inbox, or a screenshot in a support ticket authenticates whoever holds it.
- **`MagicLinkBinding::SameContext(nonce)`** — the link is only valid when redeemed alongside the same `nonce` it was minted with. Set an unguessable nonce as a cookie when the link is requested, and pass that same value back at redemption time. This defends against a forwarded link, at the cost of breaking cross-device use.

:::note
The nonce must be unguessable — a CSPRNG value, not a username or email address. Binding to something an attacker can predict reproduces `AnyContext` while looking like it doesn't.
:::

## Authenticating

Authentication is not tied to the `GET` that loads the landing page — it must happen on an explicit, application-driven call (typically the `POST` behind a "Sign in" button), because corporate mail scanners and link-preview generators routinely `GET` every URL in an email the moment it arrives. If following the link consumed the token, the real user would find it already burned on their first click.

Redeem the secret with `AuthInput::MagicLink`, passing the same binding value the caller presented (or `None` if the link was minted with `AnyContext`):

```rust
use authkestra_engine::auth::AuthInput;

let result = engine.authenticate(AuthInput::MagicLink {
    token: secret_from_the_url,
    binding: nonce_from_the_cookie, // Some(nonce) for SameContext, None for AnyContext
}).await?;
```

A link works exactly once: the store entry is atomically fetched and removed, so a second attempt with the same token — even the correct one — fails. Every rejection (unknown, expired, already used, or wrong binding) returns the same `AuthError::InvalidCredentials`, deliberately: distinguishing them in the response would hand an attacker an oracle. The distinction is still visible in `tracing` output for operators.

:::caution
A binding mismatch **consumes** the secret rather than leaving it available for a retry. A link presented from the wrong context is exactly the attack `SameContext` exists to catch, so it's burned on the spot — the correct binding cannot rescue it afterward.
:::
