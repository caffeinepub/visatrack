# Specification

## Summary
**Goal:** Add a mock “Australian Visa Check” flow where users can look up a stored, user-defined status by Application ID + Email, and authenticated users can manage those status entries.

**Planned changes:**
- Backend: add CRUD support for a custom status registry keyed by (Application ID, Email) for authenticated users to create, update, list, and delete entries.
- Backend: add a query to check status by exact-match Application ID + Email, returning the entry or null.
- Frontend: add an “Australian Visa Check” screen with inputs for Application ID + Email, calling the backend and showing the status or a “No status found” message.
- Frontend: add an authenticated management UI to create/edit/delete custom status entries and refresh the list after changes.
- Frontend: add navigation entry points to reach “Australian Visa Check” from both authenticated and unauthenticated experiences without modifying immutable frontend files.

**User-visible outcome:** Users can open an “Australian Visa Check” page, enter an Application ID and email, and see a stored custom status (or a clear “No status found” message). Signed-in users can create, edit, and delete these custom status entries.
