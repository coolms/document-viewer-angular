import { Injectable, Type } from '@angular/core';

/**
 * Maps the manifest's `component` selector (`app-pdf-viewer`,
 * `app-docx-viewer`, ...) to a concrete Angular component class. Each
 * module bootstraps itself by registering its component during
 * `provideAppInitializer`. `ViewerHostComponent` reads from this
 * registry to dispatch by MIME type.
 *
 * Singleton via `providedIn: 'root'` -- the same registry instance is
 * shared across the whole admin app.
 */
@Injectable({ providedIn: 'root' })
export class ViewerComponentRegistry {
    private readonly components = new Map<string, Type<unknown>>();

    register(selector: string, component: Type<unknown>): void {
        this.components.set(selector, component);
    }

    resolve(selector: string): Type<unknown> | undefined {
        return this.components.get(selector);
    }

    has(selector: string): boolean {
        return this.components.has(selector);
    }
}
