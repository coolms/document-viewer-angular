import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';

import { EscCoordinatorService } from '@coolms/ui-angular';
import { DocumentViewerComponent } from './document-viewer.component';

export interface ViewerModalData {
    readonly fileUrl: string;
    readonly mimeType: string;
    readonly filename?: string;
    readonly title?: string;
    /**
     * Optional second URL used by the Download link in the header.
     * F.7a's VFS endpoint serves the same file with a different
     * Content-Disposition based on `?disposition=`, so the inline
     * preview and the download button typically point at slightly
     * different URLs (one inline, one attachment).
     */
    readonly downloadUrl?: string;
}

/**
 * CDK Dialog wrapper around `<cms-document-viewer>`. Matches the
 * codebase's existing `cms-dialog` / `cms-dialog-header` / `cms-dialog-body`
 * structure (see UserEditDialogComponent) so the visual style is
 * consistent across admin modals.
 *
 * Viewer polish: header layout is `[filename][actions: Download Fullscreen Close]`
 * with actions pushed to the right via `margin-left: auto`. CSS-only
 * fullscreen mode follows the page-editor pattern (same approach used
 * by the Tiptap editor's fullscreen toggle). ESC behaviour: when
 * fullscreen, ESC exits fullscreen first via EscCoordinator's LIFO
 * stack; the CDK Dialog's own ESC handler then closes the modal.
 */
@Component({
    selector: 'cms-viewer-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DocumentViewerComponent],
    template: `
        <div class="cms-dialog cms-viewer-modal"
             [class.cms-viewer-modal--fullscreen]="isFullscreen()">
            <div class="cms-dialog-header">
                <span class="cms-viewer-modal__title">{{ data.title ?? data.filename ?? 'Document Preview' }}</span>
                <div class="cms-viewer-modal__actions">
                    <a
                        [href]="data.downloadUrl ?? data.fileUrl"
                        [attr.download]="data.filename ?? ''"
                        class="cms-btn cms-btn-ghost cms-btn-sm"
                    >
                        <i class="bi bi-download"></i> Download
                    </a>
                    <button
                        type="button"
                        class="cms-btn cms-btn-ghost cms-btn-sm cms-viewer-modal__fullscreen-btn"
                        (click)="toggleFullscreen()"
                        [attr.aria-pressed]="isFullscreen()"
                        [attr.title]="isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'"
                        [attr.aria-label]="isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'"
                    >
                        <i class="bi" [class.bi-fullscreen]="!isFullscreen()"
                           [class.bi-fullscreen-exit]="isFullscreen()"></i>
                    </button>
                    <button
                        type="button"
                        class="cms-dialog-close"
                        (click)="close()"
                        aria-label="Close preview"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            <div class="cms-dialog-body cms-viewer-modal__body"
                 (dblclick)="onBodyDblClick($event)">
                <cms-document-viewer
                    [fileUrl]="data.fileUrl"
                    [mimeType]="data.mimeType"
                    [filename]="data.filename ?? null"
                />
            </div>
        </div>
    `,
    styles: [`
        .cms-viewer-modal {
            display: flex;
            flex-direction: column;
            width: min(95vw, 1400px);
            height: min(92vh, 1000px);
            max-width: none;
            overflow: hidden;
        }
        .cms-viewer-modal--fullscreen {
            width: 100vw;
            height: 100vh;
            max-width: none;
            border-radius: 0;
        }
        .cms-viewer-modal__title {
            flex: 0 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .cms-viewer-modal__actions {
            display: flex;
            align-items: center;
            gap: var(--cms-panel-padding);
            margin-left: auto;
        }
        .cms-viewer-modal__fullscreen-btn {
            width: 32px;
            padding-inline: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .cms-viewer-modal__body {
            flex: 1;
            min-height: 0;
            padding: 0;
            display: flex;
            overflow: hidden;
        }
        .cms-viewer-modal__body > cms-document-viewer {
            flex: 1;
            min-height: 0;
            display: flex;
        }
        /*
         * The inner viewer (cms-docx-viewer / cms-pdf-viewer) already
         * caps its own height at 80vh and owns the scroll. The modal
         * body just hosts it — adding overflow:auto here stacks a
         * second scrollbar on top of the viewer's. The docx viewer's
         * own host-context rule lifts its 80vh cap when nested in
         * this modal (see docx-viewer.component.ts).
         */
    `],
})
export class ViewerModalComponent {
    protected readonly data = inject<ViewerModalData>(DIALOG_DATA);
    private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
    private readonly esc = inject(EscCoordinatorService);

    protected readonly isFullscreen = signal(false);

    constructor() {
        // ESC in fullscreen exits fullscreen first. CDK Dialog has its
        // own ESC-to-close handler wired through the overlay keyboard
        // dispatcher -- it fires alongside (not after) our coordinator,
        // so we toggle `disableClose` on the DialogRef while fullscreen
        // is on. The coordinator handler then exits fullscreen; the
        // effect cleanup restores disableClose so the next ESC closes
        // the dialog normally.
        effect((onCleanup) => {
            if (!this.isFullscreen()) return;
            const previousDisableClose = this.dialogRef.disableClose ?? false;
            this.dialogRef.disableClose = true;
            const unregister = this.esc.register(() => {
                this.isFullscreen.set(false);
                return true;
            });
            onCleanup(() => {
                this.dialogRef.disableClose = previousDisableClose;
                unregister();
            });
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    toggleFullscreen(): void {
        this.isFullscreen.update((v) => !v);
    }

    /**
     * Double-click on the content area toggles fullscreen. Clicks
     * landing on interactive elements (the docx Print button, PDF
     * toolbar controls, etc.) are excluded so dblclick-sensitive
     * controls keep working.
     */
    protected onBodyDblClick(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, a, input, select, textarea')) return;
        this.toggleFullscreen();
    }
}
