# @coolms/document-viewer-angular

The CoolMS in-browser document viewer: a registry-backed dispatcher that reads
the server's viewer manifest, resolves the component registered for a MIME
type, and mounts it. The DOCX viewer ships here; PDF lives in `@coolms/pdf-angular`.

## Install

```bash
npm install @coolms/document-viewer-angular @coolms/core-angular @coolms/ui-angular
```

## Use

Consumers dispatch through the host rather than naming a viewer component:

```html
<cms-viewer-host [mimeType]="mime" [url]="url" />
```

A format package registers itself during `provideAppInitializer`, so adding a
viewer needs no edit to the surfaces that show documents -- which is the point
of the registry.

```ts
import { ViewerComponentRegistry, ViewerHostComponent } from '@coolms/document-viewer-angular';
```

## Building it

Peers are consumed as BUILT output, never as sources: compiling a peer's
sources in would place them outside this package's `rootDir` (TS6059) and ship
a second copy of that peer to anyone installing both. Build in dependency
order:

    document-engine -> core-angular -> editor-angular -> ui-angular
                    -> document-angular, document-viewer-angular,
       image-editor-angular -> pdf-angular

## Status

Not published, and no repository yet. `tools/publish-guard.sh` reports "no
tracked files" for it -- the guard refusing to certify what it cannot read,
which is not the same as a clean result.

## Licence

MIT.
