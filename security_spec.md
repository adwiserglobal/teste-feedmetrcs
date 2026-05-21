# Security Spec - Market Data Studio

## Data Invariants
1. `insights_history`: Every document must have a `query`, `insights_data`, and `created_at`. Only the owner can read/write their own insights (simulated via `account_id` for now).
2. `ai_analysis_cache`: System-generated data. Publicly readable (or for all signed-in users), but only manageable by admins or system processes (server-side via Firebase Admin).

## The Dirty Dozen (Payload-First Audit)
1. Injecting 1MB string into `query` field. (Constraint: `.size() <= 500`)
2. Creating an insight with a future `created_at` timestamp. (Constraint: `request.time`)
3. Reading another user's insight by guessing the ID. (Constraint: `account_id` check)
4. Deleting global cache without admin privileges. (Constraint: No write access to cache for users)
5. Modifying a saved report after creation. (Constraint: reports are immutable except maybe metadata)
6. Creating a report without an `insights_data` object. (Constraint: schema validation)
7. Spoofing `account_id` during creation to "gift" a report to someone else. (Constraint: `account_id == request.auth.uid`)
8. Injecting script tags into the `query` field. (Constraint: `matches` or simple string check, size limit)
9. Creating a cache entry that expires in the past. (Constraint: server-side only anyway)
10. Listing all global insights of all users. (Constraint: `list` query must filter by `account_id`)
11. Bypassing `email_verified` check if mandated. (Constraint: `token.email_verified == true`)
12. Creating orphaned insights without a query. (Constraint: schema validation)

## Test Environment
I will implement rules that handle these cases.
