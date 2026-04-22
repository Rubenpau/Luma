# Firestore Security Spec - Lumina AI Image Studio

## Data Invariants
1. Users can only read and write their own profile document (`/users/{userId}`).
2. Users can only read and write their own edited images (`/images/{imageId}`).
3. Image documents must have valid references to the authenticated user.
4. Timestamps must be handled on the client via server-side verification helpers logic (though Firestore doesn't provide `request.time` exactly in the same way as `serverTimestamp`, we check consistency).

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Theft**: Attempt to update another user's profile.
2. **History Hijack**: Attempt to read another user's image history.
3. **Ghost Image**: Attempt to create an image record for a different `userId`.
4. **Shadow Update**: Attempt to add a hidden `isAdmin` field to a profile.
5. **ID Poisoning**: Use a 2KB string as a document ID.
6. **Time Warp**: Set a `createdAt` date in the future (greater than `request.time`).
7. **Role Escalation**: Attempt to change own role to "admin".
8. **Orphaned Record**: Create an image history without a valid `userId`.
9. **Blanket Read**: Attempt to list ALL users.
10. **Payload Bloat**: Send a 2MB metadata object in an image record.
11. **Type Spoof**: Set `filterType` to a number instead of a string.
12. **Status Bypass**: Attempt to modify the `originalImageUrl` of an existing record.

## Rules Draft
(Implemented below in firestore.rules)
