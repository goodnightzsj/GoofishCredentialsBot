import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { ICONS } from '../../shared/icons';
import { DialogService } from '../../shared/dialog';
import { ThemeService, SettingsService, AuthService, type ThemeMode, type AISettings } from '../../core/services';

@Component({
    selector: 'app-system-setting',
    imports: [LucideAngularModule, FormsModule],
    templateUrl: './system-setting.html',
    styleUrl: './system-setting.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
// Trigger build refresh
export class SystemSettingComponent implements OnInit {
    readonly themeService = inject(ThemeService);
    readonly settingsService = inject(SettingsService);
    readonly authService = inject(AuthService);
    readonly dialog = inject(DialogService);
    readonly icons = ICONS;

    adminToken = signal(this.authService.token());
    savingToken = signal(false);

    aiSettings = signal<AISettings>({
        baseUrl: '',
        apiKey: '',
        hasApiKey: false,
        model: 'gpt-3.5-turbo',
        systemPrompt: ''
    });
    savingAI = signal(false);
    testingAI = signal(false);

    ngOnInit() {
        this.loadAISettings();
    }

    updateAdminToken(value: string) {
        this.adminToken.set(value);
    }

    async saveAdminToken() {
        this.savingToken.set(true);
        try {
            this.authService.setToken(this.adminToken());
            await this.dialog.alert('保存成功', '管理员 Token 已保存到本地浏览器');
        } finally {
            this.savingToken.set(false);
        }
    }

    async clearAdminToken() {
        const confirmed = await this.dialog.confirm('清除 Token', '确定清除本地保存的管理员 Token？');
        if (!confirmed) return;
        this.authService.clearToken();
        this.adminToken.set('');
    }

    async loadAISettings() {
        try {
            const settings = await this.settingsService.getAISettings();
            this.aiSettings.set(settings);
        } catch (e) {
            console.error('加载 AI 设置失败', e);
        }
    }

    updateAIField(field: keyof AISettings, value: string) {
        this.aiSettings.update(s => ({ ...s, [field]: value }));
    }

    async saveAISettings() {
        this.savingAI.set(true);
        try {
            const settings = this.aiSettings();
            await this.settingsService.saveAISettings({
                baseUrl: settings.baseUrl,
                apiKey: settings.apiKey,
                model: settings.model,
                systemPrompt: settings.systemPrompt
            });
            await this.dialog.alert('保存成功', 'AI 设置已保存');
            await this.loadAISettings();
        } catch (e) {
            console.error('保存 AI 设置失败', e);
            await this.dialog.alert('保存失败', '保存 AI 设置失败，请稍后重试');
        } finally {
            this.savingAI.set(false);
        }
    }

    async testAIConnection() {
        this.testingAI.set(true);
        try {
            const result = await this.settingsService.testAIConnection();
            if (result.success) {
                await this.dialog.alert('连接成功', 'AI 服务连接正常');
            } else {
                await this.dialog.alert('连接失败', result.error || '无法连接到 AI 服务');
            }
        } catch (e) {
            console.error('测试 AI 连接失败', e);
            await this.dialog.alert('测试失败', '测试连接时发生错误');
        } finally {
            this.testingAI.set(false);
        }
    }

    async resetPrompt() {
        try {
            const defaultPrompt = await this.settingsService.getDefaultPrompt();
            this.updateAIField('systemPrompt', defaultPrompt);
        } catch (e) {
            console.error('获取默认提示词失败', e);
        }
    }
}
