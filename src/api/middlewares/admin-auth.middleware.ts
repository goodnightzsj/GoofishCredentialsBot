import type { Context, Next } from 'hono'

import { ENV } from '../../core/constants.js'
import { createLogger } from '../../core/logger.js'

const logger = createLogger('Api:Auth')

function getTokenFromAuthorizationHeader(c: Context): string | null {
    const header = c.req.header('authorization')
    if (!header) return null

    const match = header.match(/^Bearer\s+(.+)$/i)
    if (!match) return null
    return match[1]?.trim() || null
}

function getTokenFromQuery(c: Context): string | null {
    const token = c.req.query('token')
    return token ? token.trim() : null
}

function isAllowedAnonymousPath(path: string): boolean {
    return path === '/health' || path === '/status' || path === '/api/health' || path === '/api/status'
}

function getConfiguredAdminToken(): string | null {
    const token = process.env.ADMIN_TOKEN?.trim()
    return token ? token : null
}

export function requireAdminToken() {
    const token = getConfiguredAdminToken()
    if (token) return

    if (!ENV.IS_DEV) {
        throw new Error('Missing required env: ADMIN_TOKEN')
    }

    logger.warn('ADMIN_TOKEN 未配置：开发模式下已禁用鉴权（仅建议本地调试使用）')
}

export function createAdminAuthMiddleware() {
    return async (c: Context, next: Next) => {
        // Let CORS preflight through.
        if (c.req.method === 'OPTIONS') {
            return next()
        }

        // Allow health/status without auth for local monitoring.
        if (isAllowedAnonymousPath(c.req.path)) {
            return next()
        }

        const configuredToken = getConfiguredAdminToken()
        if (!configuredToken) {
            if (ENV.IS_DEV) {
                return next()
            }
            return c.json({ error: 'Server not configured' }, 503)
        }

        const token = getTokenFromAuthorizationHeader(c) ||
            (c.req.path.startsWith('/ws') ? getTokenFromQuery(c) : null)
        if (!token) {
            return c.json({ error: 'Unauthorized' }, 401)
        }
        if (token !== configuredToken) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        return next()
    }
}

export const adminAuthMiddleware = createAdminAuthMiddleware()

