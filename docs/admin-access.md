# Firebase admin setup

Complete these steps before deploying this frontend. No production Firebase changes are performed by the application migration.

1. In Firebase Authentication → Users, copy the UID of your existing administrator account.
2. In Firestore, create `admins/{that-exact-UID}` with `active` (boolean) = `true` and `email` (string) = that account’s email. This UID step is needed only once to bootstrap the first administrator.
3. Review `firestore.rules` against your currently deployed rules and any other applications using this database. This file covers the collections used by this app; it denies access elsewhere. Publish the reviewed rules in Firebase Console → Firestore → Rules. Remove overlapping broad allow rules, because they can bypass these restrictions.
4. Publish the rules with `firebase deploy --only firestore:rules`, or paste `firestore.rules` into Firebase Console → Firestore → Rules and publish them. This approach works with the Spark plan and does not require Cloud Functions.
5. Deploy the frontend. Every user must sign in once so the app can create a pending `users/{uid}` directory entry. Sign in as the initial admin, open **Admin access**, and approve each account under **Team access**. Administrators can later revoke access from the same screen. Existing user records created before this change remain approved unless an administrator explicitly revokes them.
6. Test with a staff account: sales entry should work, reports/admin management should not. Test deletion with a disposable record. The included browser tests mock Firebase; they do not validate deployed security rules.

Administrators can approve or revoke team access and grant or remove other administrators, but cannot remove or modify their own access through the app. Access and role changes are observed live. New accounts default to `active: false`; failed access reads block the workspace until the session can be checked. Recover a lost admin account through the Firebase Console.

Sales-record deletion removes only `shops/{store}/{DD-MM-YYYY}/data`, after explicit confirmation. Failed deletes retain the visible record for retry. This does not delete a store, inventory, or expenses.

The supplied rules permit only approved staff to submit sales. They enforce the allowed fields, numeric types and ranges, calculated totals, store name, submitting email, and date-path shape. Replacements create an immutable history entry in the same atomic batch. Run `npm run test:rules` with Java 21 or newer before deploying rule changes.

See [Firebase role-based access documentation](https://firebase.google.com/docs/firestore/solutions/role-based-access) for the database-enforced role pattern.
