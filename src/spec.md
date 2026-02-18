# Specification

## Summary
**Goal:** Allow approvers and public users to reliably preview, view, and download an attached PDF document from application status results.

**Planned changes:**
- Update the approval UI (Application Status Management) to show an “Attached Document” section when a non-empty PDF attachment exists, including an inline PDF preview (via Blob URL) and “View PDF” / “Download PDF” buttons.
- Add fallback handling on the approval UI: if inline preview/Blob URL creation fails, show a clear error message while keeping “View PDF” and “Download PDF” functional.
- Update the public status result screen (Australian Visa Status Check) to ensure the attachment section includes an inline preview (when possible) and always provides “View PDF” / “Download PDF” actions when attachment bytes are returned.
- Display a clear “No attached document available for this application.” message on both screens when there is no attachment or attachment bytes are empty.

**User-visible outcome:** On both the approval screen and the public status result screen, users can preview an attached PDF (when supported) and can always click “View PDF” to open it in a new tab or “Download PDF” to save it; if no PDF exists, they see a clear no-document message.
