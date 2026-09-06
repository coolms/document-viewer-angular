import { Injectable } from '@angular/core';

/**
 * Cached promise wrapper around the dynamic `import()` of the docx
 * preview library. ESM module -> kept lazy so the initial admin bundle
 * stays unaffected for users who never open a DOCX viewer.
 *
 * F.7 retired the `loadPdfJs()` helper here -- the PDF viewer now
 * lives in `@coolms/pdf` and uses `ngx-extended-pdf-viewer`, which
 * registers its own worker and assets via the Angular `assets`
 * config rather than runtime `GlobalWorkerOptions` mutation.
 */
@Injectable({ providedIn: 'root' })
export class ViewerLoaderService {
    private docxPreviewPromise: Promise<typeof import('docx-preview')> | null = null;

    loadDocxPreview(): Promise<typeof import('docx-preview')> {
        this.docxPreviewPromise ??= import('docx-preview');
        return this.docxPreviewPromise;
    }
}
