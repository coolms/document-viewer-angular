import { HttpClient } from '@angular/common/http';
import { CmsLoaderComponent } from '@coolms/core-angular';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import { ViewerLoaderService } from './viewer-loader.service';

/**
 * In-browser DOCX preview. Fetches the file as a Blob via HttpClient
 * (so the auth interceptor attaches the Bearer token + handles
 * refresh-on-401), hands it to `docx-preview` for client-side
 * rendering inside a scrollable container.
 *
 * F.7 added the `profile` input for federation parity with the PDF
 * viewer. The docx-preview library has limited UI controls, so the
 * profile only drives the toolbar's visibility today; consumers can
 * pick `compact` / `preview` to hide the download / print row when
 * the surrounding surface owns those actions.
 */
export interface DocxProfileConfig {
    readonly toolbar?: {
        readonly show?: boolean;
        readonly buttons?: ReadonlyArray<string>;
    };
}

@Component({
    selector: 'cms-docx-viewer',
    standalone: true,
    imports: [CmsLoaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (showToolbar() && hasButton('print')) {
            <div class="cms-docx-viewer__toolbar">
                <button type="button" class="cms-btn cms-btn-sm" (click)="print()">
                    <i class="bi bi-printer"></i> Print
                </button>
            </div>
        }
        <div class="cms-docx-viewer" [class.cms-docx-viewer--loading]="loading()">
            @if (loading()) {
                <div class="cms-docx-viewer__loader">
                    <cms-loader [inline]="true" />
                    <span>Loading preview…</span>
                </div>
            }
            @if (error()) {
                <div class="cms-docx-viewer__error" role="alert">
                    <strong>Failed to load preview</strong>
                    <p>{{ error() }}</p>
                    <a [href]="url()" download class="cms-btn cms-btn-ghost">
                        Download instead
                    </a>
                </div>
            }
            <div #container class="cms-docx-viewer__container" [hidden]="loading() || !!error()"></div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 0;
        }
        .cms-docx-viewer__toolbar {
            display: flex;
            gap: 8px;
            padding: 6px var(--cms-content-padding);
            border-bottom: 1px solid var(--cms-border);
        }
        .cms-docx-viewer {
            width: 100%;
            max-height: var(--cms-viewer-max-height, 80vh);
            overflow: auto;
            background: var(--cms-surface);
            border: 1px solid var(--cms-border);
            border-radius: var(--cms-radius);
            flex: 1;
        }
        /*
         * When mounted inside the viewer modal, the parent flex chain
         * gives the host a definite height. The 80vh cap was what
         * created the empty band below the last page in fullscreen
         * (modal 100vh − viewer 80vh = 20vh of empty body). Lifting
         * the cap AND pinning the host's height to 100% so the inner
         * .cms-docx-viewer can fill it with overflow:auto handling
         * the scroll inside the unbounded flex area.
         */
        :host-context(.cms-viewer-modal) {
            height: 100%;
            min-height: 0;
        }
        :host-context(.cms-viewer-modal) .cms-docx-viewer {
            max-height: none;
            border: none;
            border-radius: 0;
        }
        .cms-docx-viewer__loader,
        .cms-docx-viewer__error {
            padding: var(--cms-content-padding);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: var(--cms-text-muted);
        }
        .cms-docx-viewer__error {
            color: var(--cms-danger);
        }
        .cms-docx-viewer__container {
            /*
             * Viewer polish: docx-preview renders its own page wrapper
             * with a built-in margin around the page card. The
             * container needs only a small breathing pad — using the
             * full --cms-content-padding compounded the package's
             * margin and pushed the page far below the toolbar.
             */
            padding: 8px var(--cms-content-padding);
            background: var(--cms-border-light, #f1f3f5);
        }
    `],
})
export class DocxViewerComponent {
    readonly url = input.required<string>();
    readonly profile = input<DocxProfileConfig>({});

    readonly loaded = output<void>();
    readonly errorEvent = output<Error>();

    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

    protected readonly showToolbar = computed<boolean>(() => this.profile().toolbar?.show ?? false);

    private readonly loader = inject(ViewerLoaderService);
    private readonly http = inject(HttpClient);
    private cancel$ = new Subject<void>();

    constructor() {
        effect((onCleanup) => {
            const url = this.url();
            const containerEl = this.container()?.nativeElement;
            if (!url || !containerEl) {
                return;
            }

            // Cancel any previous in-flight fetch; takeUntil(cancel$)
            // tears down the HttpClient subscription so the auth
            // interceptor + retry chain unwinds cleanly.
            this.cancel$.next();
            const localCancel$ = this.cancel$;
            onCleanup(() => localCancel$.next());

            this.render(url, containerEl);
        });
    }

    protected hasButton(key: string): boolean {
        return this.profile().toolbar?.buttons?.includes(key) ?? false;
    }

    protected print(): void {
        // docx-preview renders into the in-document container, so the
        // browser's native print dialog includes it (subject to
        // print-CSS surrounding it). A future enhancement could open
        // a print iframe with the rendered DOM in isolation.
        window.print();
    }

    private async render(url: string, container: HTMLDivElement): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        container.innerHTML = '';

        try {
            const docxPreview = await this.loader.loadDocxPreview();
            // Route through HttpClient so authInterceptor attaches the
            // Bearer token and handles 401 → refresh transparently.
            const blob = await firstValueFrom(
                this.http
                    .get(url, { responseType: 'blob' })
                    .pipe(takeUntil(this.cancel$)),
            );
            await docxPreview.renderAsync(blob, container, undefined, {
                className: 'cms-docx-content',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
            });
            this.loading.set(false);
            this.loaded.emit();
        } catch (err) {
            // takeUntil(cancel$) completes the Observable without a
            // value; firstValueFrom rejects with EmptyError. Treat that
            // as "superseded" rather than an error to display.
            if (err instanceof Error && err.name === 'EmptyError') {
                return;
            }
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.error.set(message);
            this.loading.set(false);
            this.errorEvent.emit(err instanceof Error ? err : new Error(message));
        }
    }
}
