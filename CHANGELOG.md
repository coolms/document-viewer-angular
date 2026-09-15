# Changelog

All notable changes to `@coolms/document-viewer-angular` are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file starts at the version named below, which is what the registry
currently serves. Earlier alphas are deliberately not reconstructed: entries are written
in the same commit as the work they describe, and inventing the ones that
predate this file would be a worse record than not having them.

## Unreleased

### Added

- Declares `bugs` so a page imported from this package, and the catalogue,
  know where a correction is filed. The registry filled the gap from GitHub when
  the manifest was silent; the declared field is the one that holds on any
  registry.

## 2.0.0-alpha.2 -- 2026-09-03

**A pre-release, carrying no compatibility promise.** Published under the
`alpha` dist-tag.

The in-browser document viewer: a registry-backed dispatcher that reads the
server's viewer manifest and mounts the component registered for the file's
type, plus the DOCX viewer itself. A consumer dispatches through the host
rather than importing a viewer directly, which is what lets a new format
register itself without the calling code changing.

`@coolms/pdf-angular` registers into this same registry.
