# security_spec.md

## 1. Data Invariants
- Users can only read and write their own profile information in `users/{userId}`.
- Reports are publicly readable, but can only be created by authenticated users with verified emails, and updated by:
  - Citizens: can only upvote or add verification comments (no status modification, except verification flow changes).
  - Officers/Admins: can modify status, assignedContractor, and slaDeadline.
- Audit logs are append-only. Only the system or authenticated users can create their own logs; reading logs is strictly limited to Admins.
- Carbon footprints can only be accessed/modified by their respective owners.
- Notifications can only be read/updated (marked as read) by the recipient user.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to bypass identity, integrity, or state checks and must be denied by our rules:

1. **Payload 1: Identity Spoofing (Users)**
   Attempt to write a user profile with `uid = "alice"` under path `users/bob`.
   ```json
   {
     "uid": "alice",
     "email": "alice@example.com",
     "role": "citizen"
   }
   ```
2. **Payload 2: Role Escalation (Users)**
   A standard citizen attempting to set their role to `admin` during profile update.
   ```json
   {
     "uid": "citizen_user",
     "email": "citizen@example.com",
     "role": "admin"
   }
   ```
3. **Payload 3: Anonymous Write (Reports)**
   Unauthenticated user trying to submit a civic report.
   ```json
   {
     "title": "Unauthenticated report",
     "category": "roads",
     "status": "open"
   }
   ```
4. **Payload 4: Unauthorized Status Update (Reports)**
   A citizen attempting to change a report status directly to `resolved`.
   ```json
   {
     "status": "resolved"
     // affectedKeys contains fields other than 'upvotes' or 'upvotedBy'
   }
   ```
5. **Payload 5: Overwriting Audit Logs (AuditLog)**
   A user trying to delete or update an existing audit log.
   ```json
   {
     "action": "fake_action",
     "severity": "info"
   }
   ```
6. **Payload 6: Read Someone Else's PII (Users)**
   Authenticated user `alice` trying to read `users/bob`'s PII.
7. **Payload 7: Unbounded Array Injection (Reports)**
   Attempt to inject a 10,000-element array into `upvotedBy` in reports.
8. **Payload 8: Value Poisoning (Reports)**
   Attempt to write a 1MB string into the `category` field.
9. **Payload 9: System Field Tampering (Reports)**
   Attempt to change `slaDeadline` or `assignedContractor` as a standard Citizen.
10. **Payload 10: Unauthorized Footprint Access (CarbonFootprint)**
    User `alice` attempting to write or read a carbon footprint document under `carbon_footprints/bob_footprint`.
11. **Payload 11: Notification Hijacking (Notification)**
    User `alice` trying to mark `bob`'s notification as read.
12. **Payload 12: Invalid Document ID Poisoning**
    Writing a report with a document ID containing special injection characters like `../../../etc/passwd`.

All of these will return `PERMISSION_DENIED`.
