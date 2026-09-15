/**
 * Public surface for the in-browser document viewer infrastructure.
 *
 * Viewer federation turned this into the dispatcher home: `<cms-viewer-host>` reads
 * the backend viewer manifest, looks up the right Angular component
 * via `ViewerComponentRegistry`, and mounts it dynamically. Each
 * format module's frontend package (e.g. `@coolms/pdf`) registers
 * its component during `provideAppInitializer`.
 *
 * The DOCX viewer stays here for now -- the Word module's frontend
 * extraction is deferred. The PDF viewer moved to `@coolms/pdf`.
 */
export { ViewerComponentRegistry } from './viewer-component-registry';
export { ViewerHostComponent } from './viewer-host.component';
export { DocxViewerComponent } from './docx-viewer.component';
export { DocumentViewerComponent } from './document-viewer.component';
export { ViewerModalComponent } from './viewer-modal.component';
export type { ViewerModalData } from './viewer-modal.component';
export { ViewerLoaderService } from './viewer-loader.service';
