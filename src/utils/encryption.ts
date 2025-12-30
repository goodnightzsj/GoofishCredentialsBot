import crypto from 'crypto'
import { createLogger } from '../core/logger.js'
import { ENV } from '../core/constants.js'

const logger = createLogger('Utils:Crypto')

// 算法配置
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // AES block size
const SALT_LENGTH = 64
const TAG_LENGTH = 16

// 获取或生成密钥
let cachedKey: Buffer | null = null

function getKey(): Buffer {
    if (cachedKey) return cachedKey

    const secret = process.env.ENCRYPTION_KEY
    if (!secret) {
        if (!ENV.IS_DEV) {
            throw new Error('Missing required env: ENCRYPTION_KEY')
        }
        // 开发模式下使用固定密钥（警告：生产环境绝不能这样）
        logger.warn('ENCRYPTION_KEY 未配置，使用开发默认密钥（生产环境极不安全！）')
        cachedKey = crypto.scryptSync('dev-insecure-secret', 'salt', 32)
        return cachedKey
    }

    // 使用 scrypt 将字符串密钥派生为 32 字节密钥
    cachedKey = crypto.scryptSync(secret, 'goofish-bot-salt', 32)
    return cachedKey
}

/**
 * 加密字符串
 * 格式: iv:authTag:encryptedContent
 */
export function encrypt(text: string): string {
    if (!text) return text

    try {
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (e) {
        logger.error(`加密失败: ${e}`)
        throw e
    }
}

/**
 * 解密字符串
 */
export function decrypt(text: string): string {
    if (!text) return text

    // 如果不是加密格式（例如旧数据），直接返回原样或尝试兼容
    const parts = text.split(':')
    if (parts.length !== 3) {
        // 假设是旧的明文数据，直接返回
        return text
    }

    try {
        const [ivHex, authTagHex, encryptedHex] = parts
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)

        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (e) {
        logger.error(`解密失败 (可能是旧数据或密钥错误): ${e}`)
        // 解密失败时返回原文，防止因密钥变更导致数据完全不可读（视业务需求而定，也可以抛出异常）
        return text
    }
}
