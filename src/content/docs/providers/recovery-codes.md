---
title: Recovery Codes
description: Learn how to implement one-time-use recovery codes, a look-up secret authenticator, in Authkestra.
---

Recovery codes are a set of one-time-use codes an account can fall back on when its usual factor is unreachable — the phone with the authenticator app is in a river, the passkey's device is lost, the recovery mailbox is gone. Authkestra implements them as a **look-up secret authenticator** per [NIST SP 800-63B §5.1.2](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5), and that framing is deliberate: this is a fallback for *whatever* the account has registered — a passkey, TOTP, magic link, anything — not an appendix to one factor. An account whose only factor is a passkey can enrol recovery codes with no TOTP in sight. Never call these "TOTP backup codes"; they are their own `AuthMethod`, keyed by subject and independent of what else the account has enrolled.

## Enabling Recovery Codes

To use recovery codes, enable the `recovery-codes` feature in your `Cargo.toml`:

```toml
[dependencies]
authkestra-engine = { version = "0.13", features = ["recovery-codes"] }
```

## Configuration

Recovery codes are implemented via the `RecoveryCodeAuthMethod` struct. You initialize it by passing a `CredentialStore` where the code hashes will be saved — the store never sees a plaintext code.

```rust
use authkestra::Authkestra;
use authkestra_engine::auth::recovery::RecoveryCodeAuthMethod;

// `my_store` implements the `CredentialStore` trait (e.g. `SqlxCredentialStore`)
let engine = Authkestra::builder()
    .with_auth_method(RecoveryCodeAuthMethod::new(my_store.clone()))
    .build();
```

There is no `.with_recovery_codes()` convenience wrapper the way `.with_totp()` and `.with_webauthn()` exist for the two older methods — register it through `.with_auth_method(...)` as shown above.

## Generating a Set (Enrolment)

Recovery codes are the one method on this track that actually **enrols**, so generating a set is gated behind a `ReproofRequirement` — the same re-proof gate that guards enrolling any other sensitive credential. Keep a reference to your `RecoveryCodeAuthMethod` and call `generate`, passing the already-authenticated `Identity`, the gate, and how many codes to issue:

```rust
use authkestra_engine::auth::{AuthMethod, ReproofRequirement};
use authkestra_engine::auth::recovery::RecoveryCodeAuthMethod;

let recovery = RecoveryCodeAuthMethod::new(my_store);

// `identity` is the `Identity` from the user's current, freshly-proved session.
// Drive `require_step_up` from whether the account already has a working
// fallback: one that does is made to use it, one that does not (this is
// plausibly its very first enrolment) is gated on freshness alone.
let has_fallback = recovery.has_enrolled(&identity.external_id).await?;
let gate = ReproofRequirement::new(300).require_step_up(has_fallback);

let codes: Vec<String> = recovery.generate(&identity, &gate, 10).await?;
// e.g. ["4KDW-9JMQ-2XPT-R7HV", ...]
```

Calling `generate` again replaces the previous set entirely — there is no partial top-up.

:::caution
`codes` is the **only time** these values are ever readable. The store only ever holds a SHA-256 hash of each code, never the code itself, and there is no "show them to me again" endpoint. Render them to the user immediately (a printable page, a download) and discard them from memory afterward.

Note the argument order on `generate`: `identity`, then `gate`, then `count: u8`. The gate is checked, and nothing is written, before any code is generated — a rejected gate leaves the account's existing set (if any) untouched.
:::

## Checking How Many Remain

`remaining` reports how many unredeemed codes an account still has, so an application can prompt a user to regenerate before they run out:

```rust
let left: usize = recovery.remaining(&identity).await?;
```

:::note
`has_enrolled` (from the `AuthMethod` trait, hence the `AuthMethod` import above) means "has at least one **unredeemed** code", not "has ever generated a set". An account that has burned through every code reports `false` again — which is exactly what makes it safe to drive `require_step_up` from, as shown above: it can only report a usable fallback exists when one actually does.
:::

## Authenticating (Redeeming a Code)

A code is redeemed with `AuthInput::RecoveryCode`, naming the account and the code as typed:

```rust
use authkestra_engine::auth::{AuthInput, AuthResult};

let result = engine.authenticate(AuthInput::RecoveryCode {
    user_id: "user_123".to_string(),
    code: "4KDW-9JMQ-2XPT-R7HV".to_string(),
}).await?;

match result {
    AuthResult::Success(identity) => {
        println!("Successfully authenticated as: {}", identity.external_id);
    }
    AuthResult::MfaRequired { mfa_token, allowed_methods, .. } => {
        // A recovery code satisfies an MFA challenge as a step-up factor.
    }
}
```

Redemption is single-use and safe under concurrency: if two requests race to redeem the same code, exactly one succeeds and the other gets `AuthError::InvalidCredentials`, the same error returned for an unknown or already-used code — nothing about the failure distinguishes the two cases. Dashes and letter case are also normalized before comparison, so `4kdw9jmq2xptr7hv` and `4KDW-9JMQ-2XPT-R7HV` are the same code as far as redemption is concerned.
