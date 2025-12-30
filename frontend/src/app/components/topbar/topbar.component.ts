import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ICONS } from '../../shared/icons';
import { ThemeService, type ThemeMode } from '../../core/services';
import { inject } from '@angular/core';

@Component({
    selector: 'app-topbar',
    imports: [LucideAngularModule],
    templateUrl: './topbar.html',
    styleUrl: './topbar.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
    protected readonly icons = ICONS;
    readonly themeService = inject(ThemeService);

    title = input<string>('');
    sidebarCollapsed = input<boolean>(false);
    activeCount = input<number>(0);
    messageCount = input<number>(0);

    setTheme(mode: ThemeMode) {
        this.themeService.setTheme(mode);
    }
}
