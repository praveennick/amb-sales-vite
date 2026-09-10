# Firebase admin setup

Complete these steps before deploying this frontend. No production Firebase changes are performed by the application migration.

1. In Firebase Authentication → Users, copy the UID of your existing administrator account.
2. In Firestore, create `admins/{that-exact-UID}` with `active` (boolean) = `true` and `email` (string) = that account’s email. This UID step is needed only once to bootstrap the first administrator.
3. Review `firestore.rules` against your currently deployed rules and any other applications using this database. This file covers the collections used by this app; it denies access elsewhere. Publish the reviewed rules in Firebase Console → Firestore → Rules. Remove overlapping broad allow rules, because they can bypass these restrictions.
4. Install and deploy the callable function: run `npm install` inside `functions`, then run `firebase deploy --only functions:admin-access,firestore:rules` from the repository root. Firebase may require the project to use the Blaze plan for Cloud Functions.
5. Deploy the frontend. Sign in as the initial admin and open **Admin access**. From then on, users only enter another existing account’s email address. The server finds its UID privately; UIDs are not displayed in the app.
6. Test with a staff account: sales entry should work, reports/admin management should not. Test deletion with a disposable record. The included browser tests mock Firebase; they do not validate deployed security rules or the deployed callable function.

Administrators can grant or remove other administrators, but cannot remove or modify their own role through the app or these rules. Role changes are observed live. Missing roles mean staff access; failed role reads block access until the session can be checked. Recover a lost admin account through the Firebase Console.

Sales-record deletion removes only `shops/{store}/{DD-MM-YYYY}/data`, after explicit confirmation. Failed deletes retain the visible record for retry. This does not delete a store, inventory, or expenses.

The supplied rules preserve authenticated staff submission/replacement of store sales. They do not introduce store-specific staff assignments or comprehensive sales-field validation. Review those policies separately if required.

See [Firebase role-based access documentation](https://firebase.google.com/docs/firestore/solutions/role-based-access) for the database-enforced role pattern.
