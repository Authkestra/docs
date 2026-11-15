---
title: Policy Engine (Cedar)
description: Declarative fine-grained authorization with AWS Cedar policies.
---

Authkestra's other crates answer *"who are you?"*. This one answers *"may you do this?"*, using
[AWS Cedar](https://www.cedarpolicy.com/) — so authorization rules live in a policy file you can
review, diff and reload, instead of in `if role == "admin"` branches scattered across handlers.

`authkestra-policy` is a production authorization engine wired across the Authkestra ecosystem:
- **Axum & Actix route guards:** Wire declarative policy evaluation into router pipelines with `PolicyGuard`.
- **Resource Server & API:** Restrict access to endpoints based on principal attributes, action names, and resource context.
- **Model Context Protocol (MCP) tool authorization:** Evaluate fine-grained Cedar policies before executing high-impact AI agent tool calls.
- **Structured observability:** Permit and deny decisions emit structured `tracing` spans with policy IDs and decision rationale.

## Enabling it

```toml
[dependencies]
authkestra = { version = "0.15", features = ["policy"] }
# Required when wiring PolicyGuard in Axum / Actix route handlers:
authkestra-resource = { version = "0.15", features = ["policy"] }
# or the policy crate on its own:
authkestra-policy = "0.15"
```

## The one rule: the engine never touches your database

Cedar decides using an *entity store* — the principal, the resource, their groups and
attributes. The engine holds no database handle and never fetches any of it. Everything arrives
through a `ResourceLoader` you implement:

```rust
use async_trait::async_trait;
use authkestra_policy::cedar_policy::Entities;
use authkestra_policy::{AuthorizationRequest, PolicyError, ResourceLoader};

struct PostgresLoader { /* your pool */ }

#[async_trait]
impl ResourceLoader for PostgresLoader {
    async fn load_entities(
        &self,
        request: &AuthorizationRequest,
    ) -> Result<Entities, PolicyError> {
        // Fetch just this request's principal, resource, and their group memberships.
        // Storage faults become PolicyError::loader(e) — never a silent deny.
        todo!()
    }
}
```

This is the same database-agnosticism rule as `UserStore` and `SessionStore`: Authkestra never
assumes your schema.

## Evaluating a request

```rust
use authkestra_policy::cedar_policy::RestrictedExpression;
use authkestra_policy::{
    AuthorizationRequest, EntityRecord, MemoryResourceLoader, PolicyEngine, parse_entity_uid,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let loader = MemoryResourceLoader::new();
    loader.extend([
        EntityRecord::new(parse_entity_uid(r#"User::"alice""#)?)
            .parent(parse_entity_uid(r#"Group::"eng""#)?),
        EntityRecord::new(parse_entity_uid(r#"Group::"eng""#)?),
        EntityRecord::new(parse_entity_uid(r#"Doc::"design""#)?).attribute(
            "owner",
            RestrictedExpression::new_entity_uid(parse_entity_uid(r#"Group::"eng""#)?),
        ),
    ]);

    let engine = PolicyEngine::builder()
        .policies(r#"
            @id("eng-reads-own-docs")
            permit(principal in Group::"eng", action == Action::"read", resource)
            when { resource.owner == Group::"eng" };
        "#)
        .loader(loader)
        .build()?;

    let request = AuthorizationRequest::builder()
        .principal_str(r#"User::"alice""#)
        .action_str(r#"Action::"read""#)
        .resource_str(r#"Doc::"design""#)
        .build()?;

    let decision = engine.is_authorized(&request).await?;
    assert!(decision.is_allowed());
    assert_eq!(decision.reasons(), ["eng-reads-own-docs"]);
    Ok(())
}
```

Cedar is **deny by default** and **forbid overrides permit**: a request is allowed only if some
`permit` matches and no `forbid` does.

## Reading a decision

- `decision.is_allowed()` — the answer.
- `decision.reasons()` — the ids of the policies that decided it. Empty on a deny means *no rule
  allowed it* (the default deny); non-empty means a `forbid` matched. Name your rules with
  `@id("...")` so these stay stable when you reorder a policy file. A policy without one keeps
  Cedar's positional id (`policy2` for the third policy in the file), and because those are handed
  out by position, `@id("policy0")` and anything else of the form `policy<digits>` is rejected at
  load time — it would name the wrong rule. `policy-admin-override` and the like are fine.
- `decision.errors()` — policies that failed to evaluate (a missing attribute, a type error).
  Cedar skips those and carries on, so a non-empty list means the decision was made on only part
  of your rule set. They are logged at `warn` with the policy id.

A `PolicyError` is never a deny. If your loader cannot reach its database you get `Err`, so
"the rules say no" is always distinguishable from "we could not find out".

## A skipped `forbid` is refused, not allowed

Because Cedar skips an erroring policy rather than failing the request, a broken `forbid` would
otherwise produce an `Allow` that only happened because the denying rule never ran — and
`is_allowed() == true` would give you no way to tell. Authkestra refuses to answer instead:

| decision | erroring policies | you get |
| --- | --- | --- |
| `Allow` | at least one `forbid` | `Err(PolicyError::UnreliableDecision { .. })` |
| `Allow` | `permit`s only | `Ok(allow)` — another permit matched; errors listed on the decision |
| `Deny` | any | `Ok(deny)` — nothing skipped could have turned a Deny into an Allow |

Treat `UnreliableDecision` as a 500, not a 403: the request was not denied, it was unanswerable,
and the fix is the broken policy or the missing entity attribute named in the error.

## Updating policies at runtime

```rust
// A bad update changes nothing: the previous policies keep serving traffic.
assert!(engine.reload("permit(principal").is_err());

// A good one takes effect for the next request. No restart.
engine.reload(new_policy_source)?;
```

The swap is atomic and needs only `&self`, so the engine can sit in an `Arc` shared by every
handler. Requests already in flight finish against the policies they started with.

## Optional: a schema

```rust
let engine = PolicyEngine::builder()
    .policies(policy_source)
    .schema(r#"
        entity User in [Group];
        entity Group;
        entity Doc { owner: Group };
        action read appliesTo { principal: [User], resource: [Doc] };
    "#)
    .loader(loader)
    .build()?;
```

With a schema, a policy referring to an action or attribute the schema does not declare is
rejected **when it is loaded** rather than silently never matching, and each request's context is
type-checked. Without one, nothing is validated — a typo becomes a rule that never fires.

## Performance

On a 24-core i7-13700KF, evaluating 10 policies against a 414-entity store takes p50 23 µs /
p99 40 µs end-to-end in a release build (about a third of which is entity hydration). Policy
evaluation is not the expensive part of your request — see RFC-008 §7 for the method and the
caveats.

## Framework & MCP Integration

### Axum & Actix Route Protection

When the `policy` feature is enabled on `authkestra-axum` or `authkestra-actix`, store `Arc<PolicyGuard>` in application state and pull it into handlers via `AuthPolicyGuard`. `PolicyGuard::new(engine)` uses `DefaultPrincipalMapper`, formatting principals as `User::"{provider}:{external_id}"` (percent-encoding `%` and `:` to prevent delimiter collisions):

```rust
use std::sync::Arc;
use authkestra::axum::{policy::AuthPolicyGuard, AuthSession, AxumState};
use authkestra::core::AkWebAppEngine;
use authkestra::policy::PolicyEngine;
use authkestra_resource::PolicyGuard;
use axum::{extract::Path, routing::get, Router};

#[derive(Clone, AxumState)]
struct AppState {
    #[authkestra(engine)]
    auth: AkWebAppEngine,
    #[authkestra(store)]
    policy_guard: Arc<PolicyGuard>,
}

let policy_engine = Arc::new(
    PolicyEngine::builder()
        .policies(policy_source)
        .loader(loader)
        .build()?,
);
let policy_guard = Arc::new(PolicyGuard::new(policy_engine));

async fn get_document(
    Path(id): Path<String>,
    AuthSession(session): AuthSession,
    AuthPolicyGuard(guard): AuthPolicyGuard,
) -> Result<&'static str, axum::http::StatusCode> {
    let decision = guard
        .authorize(&session.identity, "read", &format!(r#"Doc::"{id}""#), None)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    if decision.is_allowed() {
        Ok("ok")
    } else {
        Err(axum::http::StatusCode::FORBIDDEN)
    }
}

let app = Router::new()
    .route("/api/documents/:id", get(get_document))
    .with_state(AppState { auth, policy_guard });
```

### Resource Server & MCP Tool Enforcement

In `authkestra-resource`, `Guard` can validate incoming Bearer tokens and delegate fine-grained permission checks to `CedarPolicyEngine`.

In `authkestra-mcp`, tool invocations enforce Cedar policies before dispatch:
- **Principal:** The authenticated client or agent `Identity`.
- **Action:** `Action::"CallTool"` or custom tool action names.
- **Resource:** Target MCP tool name and canonicalized parameters.

Permit and deny decisions automatically emit structured `tracing` logs with `cedar.decision`, `cedar.reasons`, and policy IDs.

