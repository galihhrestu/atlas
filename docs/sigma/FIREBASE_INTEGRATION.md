# Firebase Integration Plan

## Current condition

The current review package uses localStorage. Firebase SDK initialization is available in:

```text
src/services/firebase.ts
```

## Recommended implementation order

1. Create Firebase project.
2. Enable Authentication.
3. Enable Cloud Firestore.
4. Enable Firebase Storage for evidence files.
5. Copy `.env.example` to `.env` and fill all Firebase values.
6. Create repository functions for patrols, assets, findings, areas, recommendations, users, and activities.
7. Replace localStorage operations in `AppDataContext.tsx` with Firestore subscriptions and mutations.
8. Add Firebase Authentication and custom claims or user profile role.
9. Apply `firestore.rules`.
10. Add audit log and report export record.

## Suggested storage structure

```text
evidence/
  patrols/{patrolId}/photos/{fileName}
  patrols/{patrolId}/tracking/{fileName}
  assets/{assetId}/{fileName}
  findings/{findingId}/{fileName}
```

## Role behavior

### Authorized User

- Read operational collections.
- Cannot create, update, or delete official operational records.
- Can create a report export request/history record if required.

### SSL Administrator

- Read operational collections.
- Create patrol, asset, finding, area, and recommendation data.
- Validate patrol reports.
- Manage authorized user records.

## Map integration

The map developer should consume verified or approved data only when presenting official routes, asset locations, hotspots, and operational boundaries.
