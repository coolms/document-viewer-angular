# Changelog

All notable changes to `@coolms/document-viewer-angular` are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file starts at the version named below, which is what the registry
currently serves. Earlier alphas are deliberately not reconstructed: entries are written
in the same commit as the work they describe, and inventing the ones that
predate this file would be a worse record than not having them.

## 2.0.0-alpha.2 — 2026-09-03

**A pre-release, carrying no compatibility promise.** Published under the
`alpha` dist-tag.

The in-browser document viewer: a registry-backed dispatcher that reads the
server's viewer manifest and mounts the component registered for the file's
type, plus the DOCX viewer itself. A consumer dispatches through the host
rather than importing a viewer directly, which is what lets a new format
register itself without the calling code changing.

`@coolms/pdf-angular` registers into this same registry.
