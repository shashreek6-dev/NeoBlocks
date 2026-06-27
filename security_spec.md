# Firebase Security Specification (TDD) — NeoBlocks User Profiles

This document specifies the Data Invariants, the "Dirty Dozen" malicious payload tests, and security boundaries designed for NeoBlocks Firestore database storage.

## 1. Data Invariants

- **Ownership Integrity**: A user's profile document can only be stored in `/users/{userId}` where `{userId}` is equal to the logged-in client's Firestore Auth UID.
- **Strict Authentication**: All read and write operations require a valid, signed-in user session.
- **Metadata Protection**: The field `account_created` must be a timestamp, set strictly at creation using the server timestamp (`request.time`), and must have historical immutability (cannot be altered during updates).
- **Immortal Email**: Registration emails are stored in the user document and are immutable after creation.
- **Field Limit Controls**: String fields like `username` must not exceed 64 characters to prevent DOS attacks or layout injection. Numbers (`global_highscore`, `total_matches_played`, `total_wins`) must be valid, non-negative integers.

## 2. The Dirty Dozen Payloads (Security Test Suite)

Here are twelve distinct payloads designed to attempt unauthorized reads, writes, privilege escalations, and schema poisonings, all of which must return `PERMISSION_DENIED`:

1. **Self-Created Custom UID (ID Spoofing)**: Trying to write to `/users/another_different_uid` when authenticated as `user_123`.
2. **Anonymous Read of Profiles**: Unauthenticated users attempting to query `/users/{userId}`.
3. **Ghost Fields Injection**: Trying to create a user profile with unexpected fields (e.g., `{ username: "NeoBoss", email: "neo@blocks.io", isAdmin: true }`).
4. **Altering Account Creation Timestamp (Time Corruption)**: Attempting to update `account_created` to a historical or future date instead of keeping it unchanged.
5. **Updating Registration Email**: Attempting to alter the immutable `email` address.
6. **Negative Value Poisoning**: Trying to set `global_highscore` to `-999`.
7. **String Payload Flooding (Denial of Wallet)**: Attempting to update `username` to a 5MB junk string.
8. **Invalid Highscore Type (Type Poisoning)**: Attempting to update `global_highscore` to a boolean value representation (`true`).
9. **Unauthenticated Profile Creation**: Creating a user profile document when `request.auth` is `null`.
10. **Hijacking Wins/Matches Count**: Attempting to decrement total matches played or falsify matches count without increment rules.
11. **Malicious Match State Write**: Authenticated `user_123` attempting to write or overwrite a system admins collection.
12. **Blanket List Scraping**: A user trying to scrape the entire users collection without constraints, where the rules require an authenticated session.

---

## 3. Firestore Rules Validation

The `firestore.rules` file handles this security modeling perfectly by enforcing the following global invariants.
