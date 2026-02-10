# BibLib - Unreleased

<!--

**Added** for new features.
**Changed** for changes in existing functionality.
**Deprecated** for soon-to-be removed features.
**Removed** for now removed features.
**Fixed** for any bug fixes.
**Security** in case of vulnerabilities.

Always acknowledge contributors and those who report issues.

Example:

```
## Fixed

- (#14) Fixed author-links property formatting in edit literature note command
  - The property was not being formatted correctly when multiple authors were present
  - Thanks to @username for reporting
```

-->

## Fixed

- (#25) Auto-fill section now displays correctly on Android mobile
  - Replaced native `<details>` element with custom collapsible for cross-platform compatibility
  - Android WebView was not rendering the native `<details>/<summary>` elements correctly
  - Thanks to @jmroberts439 for reporting

- (#29) BibTeX export now preserves citation keys from literature note frontmatter
  - Previously, citation-js would regenerate keys (e.g., "Smith2023Study" instead of "smith2023")
  - The `id` field is now copied to `citation-key` before export
  - Special characters in keys (hyphens, colons, etc.) are now preserved
  - Thanks to @mobius-eng for reporting

