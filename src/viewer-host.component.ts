import { NgComponentOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { AppConfigState, type ViewerDefinitionApiManifest } from '@coolms/core-angular';
import { ViewerComponentRegistry } from './viewer-component-registry';

/**
 * Federation-style viewer dispatcher. Caller declares "show this MIME
 * type with this profile" and the host:
 *   1. Looks up a `ViewerDefinitionApiManifest` whose `mimeTypes`
 *      contains the requested MIME.
 *   2. Resolves the definition's `component` selector via
 *      `ViewerComponentRegistry`.
 *   3. Mounts the resolved component via `NgComponentOutlet`, passing
 *      `url` + the matching profile's `config` blob through.
 *
 * Falls back to a small "unsupported" surface when no viewer matches --
 * either the format has no provider or the SPA package wasn't
 * registered at bootstrap.
 */
@Component({
    selector: 'cms-viewer-host',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgComponentOutlet],
    template: `
        @if (componentType(); as type) {
            <ng-container *ngComponentOutlet="type; inputs: componentInputs()" />
        } @else {
            <div class="cms-viewer-host__unsupported" role="status">
                <p>No viewer registered for <code>{{ mimeType() }}</code>.</p>
                <p class="cms-viewer-host__hint">
                    Format may need a module bootstrap call (e.g. <code>provideCoolmsPdf()</code>),
                    or the file's MIME type isn't supported yet.
                </p>
            </div>
        }
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }
        .cms-viewer-host__unsupported {
            padding: 24px;
            text-align: center;
            color: var(--cms-text-muted);
        }
        .cms-viewer-host__unsupported code {
            background: var(--cms-border-light);
            padding: 1px 6px;
            border-radius: var(--cms-radius-sm);
        }
        .cms-viewer-host__hint {
            font-size: 0.85rem;
            margin-top: 6px;
        }
    `],
})
export class ViewerHostComponent {
    readonly mimeType = input.required<string>();
    readonly url = input.required<string>();
    readonly profile = input<string>('default');

    private readonly store = inject(Store);
    private readonly registry = inject(ViewerComponentRegistry);

    protected readonly viewerDef = computed<ViewerDefinitionApiManifest | undefined>(() => {
        const manifest = this.store.selectSnapshot(AppConfigState.viewers);
        if (!manifest) {
            return undefined;
        }
        const mt = this.mimeType();
        return Object.values(manifest.viewers).find((v) => v.mimeTypes.includes(mt));
    });

    protected readonly componentType = computed(() => {
        const def = this.viewerDef();
        return def ? this.registry.resolve(def.component) : undefined;
    });

    protected readonly componentInputs = computed<Record<string, unknown>>(() => {
        const def = this.viewerDef();
        const profileKey = this.profile();
        const profile = def?.profiles[profileKey] ?? def?.profiles['default'];
        return {
            url: this.url(),
            profile: profile?.config ?? {},
        };
    });
}
