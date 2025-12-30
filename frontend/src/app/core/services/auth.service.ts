import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'goofishcbot_admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly token = signal<string>(this.loadToken());

    private loadToken(): string {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch {
            return '';
        }
    }

    setToken(token: string) {
        const next = token.trim();
        this.token.set(next);
        try {
            if (next) {
                localStorage.setItem(STORAGE_KEY, next);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // ignore
        }
    }

    clearToken() {
        this.setToken('');
    }
}

