/**
 * 安全拦截器
 * 为所有请求添加 X-Requested-With / Authorization 头
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const securityInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.token();

    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const secureReq = req.clone({
        setHeaders: headers
    });
    return next(secureReq);
};
