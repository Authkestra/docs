---
title: Email/SMS One-Time Codes
description: Learn how to send and verify email or SMS one-time passcodes (OTP) in Authkestra.
---

Email/SMS one-time codes let a user sign in with a short numeric code your application delivers however it likes — over email, over SMS, read aloud on a support call. The engine never sends anything and never sees an address: you resolve the subject, ask it to mint a code, deliver the digits yourself, and hand back whatever the user typed. Because a six-digit code is too short to double as a lookup key the way a magic-link secret can, the challenge is stored under the *subject* instead of the code, with a server-enforced attempt budget doing the work a longer secret would otherwise do.

## Enabling One-Time Codes

To use OTP, enable the `otp` feature in your `Cargo.toml`. The example below also needs the `memory` feature, for the in-memory store used to hold live challenges:

```toml
[dependencies]
authkestra-engine = { version = "0.13", features = ["otp", "memory"] }
```

## Registering the Method

OTP has no enrolment ceremony — there is nothing to register in advance. Any subject you've already resolved (an email address, a phone number, whatever your application uses) can be minted a code. There is also no dedicated `.with_otp()` convenience wrapper the way `.with_totp()` / `.with_webauthn()` exist for the older methods, so `OtpAuthMethod` is registered like any other `AuthMethod`, through `.with_auth_method(...)`.

```rust
use authkestra::Authkestra;
use authkestra_engine::auth::otp::OtpAuthMethod;
use authkestra_engine::store::memory::MemoryStore;

let otp_store = MemoryStore::new();

// Keep a handle you can call `.mint()` on directly — minting isn't
// authentication, so it isn't reached through `Engine::authenticate`.
// `MemoryStore` (and `RedisStore`) are cheap to clone: both wrap their
// backing state behind an `Arc`, so this clone shares the same live
// challenges as the copy registered with the engine below.
let otp_method = OtpAuthMethod::new(otp_store.clone());

// `MemoryStore` works for a single process. Swap in `RedisStore` (feature
// `redis`) for anything that needs a live challenge to survive a restart or
// be shared across more than one instance.
let engine = Authkestra::builder()
    .with_auth_method(OtpAuthMethod::new(otp_store))
    .build();
```

:::note
There is no `.with_otp(store)` shorthand on `EngineBuilder`. Build the `OtpAuthMethod` yourself and pass it to `.with_auth_method(...)`, as shown above.
:::

You can optionally chain `.with_resend_cooldown(...)` onto the instance you call `.mint()` through, to refuse a repeat mint for the same subject within an interval. The engine's copy only ever calls `.authenticate()`, never `.mint()`, so it doesn't need the cooldown configured on it too:

```rust
use std::time::Duration;

let otp_method = OtpAuthMethod::new(otp_store.clone())
    // Opt-in, and off by default: refuses a second mint for the same
    // subject within 60 seconds.
    .with_resend_cooldown(Duration::from_secs(60));
```

:::caution
The resend cooldown is per subject, not a replacement for rate limiting at your HTTP edge. It stops one subject's mailbox or phone from being flooded by repeated resends; an attacker rotating IP addresses still needs edge-level limits to be stopped.
:::

## Minting a Code

Once you've resolved who is signing in, call `OtpAuthMethod::mint`:

```rust
use authkestra_engine::auth::otp::OtpChannel;
use std::time::Duration;

let minted = otp_method
    .mint(
        "alice@example.com", // subject: whatever you resolved this login attempt to
        Duration::from_secs(300), // ttl
        OtpChannel::Email,   // channel
        3,                   // max_attempts
    )
    .await?;

// Deliver `minted.code` over your own transport. Authkestra has no mailer
// and no SMS gateway — it only hands you the digits and their expiry.
send_email("alice@example.com", &minted.code);
```

- **`subject`** is the identifier you already resolved outside the engine — the same string you'll pass back in on redemption. The challenge is keyed by it.
- **`ttl`** bounds how long the code stays valid; `minted.expires_at` is the resulting Unix timestamp.
- **`channel`** is `OtpChannel::Email` or `OtpChannel::Sms`. It changes nothing about verification — it's recorded purely so the delivery method can be reported later (for `amr`/audit purposes), and this module never inspects it otherwise.
- **`max_attempts`** is the lockout threshold: the number of wrong guesses this one challenge tolerates before it is discarded outright, even if the right code is typed afterwards. It's a required `u32` — `mint` refuses `0` with `AuthError::InvalidInput` rather than silently minting a code nobody could ever redeem.

:::note
Minting again for the same subject replaces any still-live challenge. A "resend" simply invalidates the old code and restores a fresh attempt budget — it does not stack a second, independent challenge alongside the first.
:::

## Authenticating

Redeem the code the user typed with `AuthInput::Otp`:

```rust
use authkestra_engine::auth::{AuthInput, AuthResult};

let result = engine.authenticate(AuthInput::Otp {
    subject: "alice@example.com".to_string(),
    code: "482913".to_string(),
}).await?;

match result {
    AuthResult::Success(identity) => {
        println!("Signed in as: {}", identity.external_id);
    }
    AuthResult::MfaRequired { mfa_token, allowed_methods, .. } => {
        // Handle step-up authentication if this subject also has a
        // second factor enrolled.
    }
}
```

A code is single-use: redemption wins the challenge atomically from the store, so a correct code submitted concurrently from two requests still only ever produces one successful `Identity`. Every wrong guess spends one attempt from the budget you passed to `mint`, tracked server-side alongside the challenge; once the budget reaches zero the challenge is discarded even for the correct code.

:::caution
An unknown subject, a wrong code, an expired code, and an exhausted attempt budget are all indistinguishable to the caller — every one of them returns `AuthError::InvalidCredentials`. Don't try to branch on *why* an attempt failed from that return value; if you need to know, look at your `tracing` output instead.
:::
