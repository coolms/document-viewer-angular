import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngxs/store';
import { AppConfigState } from '@coolms/core-angular';
import { ViewerHostComponent } from './viewer-host.component';

/**
 * Compatibility wrapper around `<cms-viewer-host>`. Existing consumers
 * pass `fileUrl` + `mimeType` + optional `filename`; this component
 * delegates to the host and falls back to a download link when no
 * provider in the viewer manifest claims the MIME type.
 *
 * New consumers should use `<cms-viewer-host>` directly -- the wrapper
 * is kept so call sites that pre-date F.7's federation work don't have
 * to migrate immediately.
 */
@Component({
    selector: 'cms-document-viewer',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ViewerHostComponent],
    template: `
        @if (hasViewer()) {
            <cms-viewer-host
                [mimeType]="mimeType()"
                [url]="fileUrl()"
                [profile]="profile()"
            />
        } @else {
            <div class="cms-document-viewer__fallback">
                <p>Preview is not available for this file type.</p>
                <a [href]="fileUrl()" download class="cms-btn cms-btn-primary">
                    Download {{ filename() ?? 'file' }}
                </a>
            </div>
        }
    `,
    styles: [`
        .cms-document-viewer__fallback {
            padding: var(--cms-content-padding);
            text-align: center;
            border: 1px dashed var(--cms-border);
            border-radius: var(--cms-radius);
            color: var(--cms-text-muted);
        }
    `],
})
export class DocumentViewerComponent {
    readonly fileUrl = input.required<string>();
    readonly mimeType = input.required<string>();
    readonly filename = input<string | null>(null);
    readonly profile = input<string>('default');

    private readonly store = inject(Store);

    protected readonly hasViewer = computed(() => {
        const manifest = this.store.selectSnapshot(AppConfigState.viewers);
        if (!manifest) {
            return false;
        }
        const mt = this.mimeType();
        return Object.values(manifest.viewers).some((v) => v.mimeTypes.includes(mt));
    });
}
