# Specification

## Summary
**Goal:** Fix the Australian Visa Status Check so it never renders a blank outcome after submission, supports the unauthenticated demo lookup, and shows a minimal fallback message for unexpected runtime/render failures.

**Planned changes:**
- Update the Australian Visa Status Check results rendering/visibility logic so a submission always shows one of: “Application Found”, the existing “No status found…” message, or the existing error message (including when the backend returns null/None/[] or the request rejects).
- Ensure unauthenticated users can call the backend check operation without authorization traps and can retrieve only the built-in demo status for Application ID “4906670766” + email “jr321134@gmail.com”, with trimming and case-insensitive email normalization.
- Add a minimal error fallback for unexpected runtime/render failures on the Visa Status Check page (or its layout) that displays an English retry instruction and logs the underlying error to the browser console.

**User-visible outcome:** After submitting an Application ID and email, users always see a clear result/message (found, no match, or error) instead of a blank page; unauthenticated users can successfully see the demo “Rojee Sharma / Work visa approved” result for the provided demo credentials; unexpected render/runtime errors show a simple retry message rather than a blank screen.
