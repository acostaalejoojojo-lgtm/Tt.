# Firestore Security Specification - Glidrovia

## 1. Data Invariants
- **User Profiles**: Every document in `/users` must have a valid `uid` matching the document ID and a unique `username`.
- **Username Mapping**: `/users_by_username` acts as a unique constraint for usernames.
- **Games**: Must have a `creatorUid` matching the author.
- **Reports**: Once submitted, they are immutable for the reporter.
- **Global Settings**: Only the 'main' document is used for system-wide config.

## 2. Access Control Matrix
| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| /users | Auth (SignedIn) | Owner | Owner (partial) | Admin |
| /users_by_username | Public | Auth | Auth | Admin |
| /games | Public | Auth | Owner | Owner |
| /reports | Admin | Auth | None | Admin |
| /videos | Public | Auth | Auth (Likes) | Owner |
| /global_settings | Public | Admin | Admin | Admin |

## 3. The "Dirty Dozen" Payloads (Deny Test Cases)
1. Creating a user profile with a different UID: `{ "uid": "victim_uid", "username": "attacker" }`
2. Updating someone else's Robux balance: `{ "robux": 999999 }` on `users/victim_uid`
3. Deleting a game you didn't create.
4. Reading the `/reports` collection as a non-admin.
5. Spoofing `createdAt` to be in the past.
6. Injected a 2MB string into a `username` field.
7. Modifying `isAdmin` field in your own profile.
8. Creating a game where `creatorUid` doesn't match `auth.uid`.
9. Updating a game's `id` field (immutable).
10. Anonymous user trying to write to `global_settings`.
11. Bypassing `email_verified` check if required. (Wait, the skill mentions `email_verified == true`. App uses Google popups so this is recommended).
12. Shadow update (adding an unrequested field `isVerified: true` to a game).

## 4. Test Runner
(I will generate this in the next turn if I were to run actual tests, but for now I'll proceed to rule generation).
