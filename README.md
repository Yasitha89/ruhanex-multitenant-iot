# Ruhanex User Administration Integration

This package adds company-level user management to the multi-tenant platform.

## Features

- Company administrators can add user accounts.
- Supported roles:
  - `company_admin`
  - `engineer`
  - `supervisor`
  - `viewer`
- Users can be assigned to specific sites.
- Administrators can edit user roles and status.
- Administrators can reset user passwords.
- Viewers and other restricted users only see devices belonging to their assigned sites.
- Direct dashboard access is also checked by the backend.

## Files included

Copy the supplied files into the same paths in your existing project.

Some files are complete replacements:

- `server/src/controllers/deviceController.js`
- `server/src/controllers/dashboardController.js`
- `client/src/layouts/buildSidebarItems.jsx`
- `client/src/App.jsx`

Review differences first if you have added custom code to those files.

## Backend route registration

Add this import to `server/src/app.js`:

```js
import userRoutes from "./routes/userRoutes.js";
```

Add this before the not-found and error middleware:

```js
app.use("/api/users", userRoutes);
```

## Frontend result

The company administrator sidebar will contain:

```text
Administration
├── Sites
├── Devices
└── Users
```

A viewer will not see Administration.

## Site access rule

This implementation uses:

```text
Empty allowedSiteIds = access to all company sites
One or more allowedSiteIds = access only to those sites
```

## Example viewer login

Create a user with:

```text
Name: Dashboard Viewer
Email: viewer@ruhanex.com
Role: Viewer
Password: ViewerSecure123!
```

The viewer logs in using the same company code as the administrator.
