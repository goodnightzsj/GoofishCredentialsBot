import fs from 'fs'
import path from 'path'

const logsDir = path.join(process.cwd(), 'logs')

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

// 敏感信息屏蔽正则
const SENSITIVE_PATTERNS = [
    /(token=)([^&"'\s]+)/gi,
    /(authorization:\s*)(Bearer\s+)?([^\s]+)/gi,
    /(cookie:\s*)([^"'\n]+)/gi,
    /(set-cookie:\s*)([^"'\n]+)/gi,
    /("?token"?:?\s*"?)([^"'\s,}]+)("?)/gi,
    /("?cookies?"?:?\s*"?)([^"'\n,}]+)("?)/gi
]

function maskSensitiveData(msg: string): string {
    let masked = msg
    for (const pattern of SENSITIVE_PATTERNS) {
        masked = masked.replace(pattern, (match, prefix, val1, val2) => {
            // 处理不同的正则捕获组
            if (val2 && pattern.source.includes('Bearer')) { // Authorization case
                return `${prefix}${val1}******`
            }
            if (val2) { // Generic case for simple key-value pairs where value is captured
                return `${prefix}${val1}******${val2}`
            }
            // Simple key=value case
            return `${prefix}******`
        })
    }
    return masked
}

const levelPriority: Record<LogLevel, number> = {
    DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3
}

let currentLevel: LogLevel = 'INFO'
let currentLogFile: string = ''

export function setLogLevel(level: LogLevel) {
    currentLevel = level
}

function formatTime(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function getDateStr(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function getTimestampStr(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    return `${y}${m}${d}_${h}${min}${s}`
}

// 初始化日志文件（每次启动创建新文件）
function initLogFile(): string {
    const dateStr = getDateStr()
    const dayDir = path.join(logsDir, dateStr)

    // 确保日期目录存在
    if (!fs.existsSync(dayDir)) {
        fs.mkdirSync(dayDir, { recursive: true })
    }

    // 以启动时间戳命名日志文件
    const timestamp = getTimestampStr()
    return path.join(dayDir, `${timestamp}.log`)
}

// 日志队列，确保顺序
const logQueue: string[] = []
let isWriting = false

function flushLogs() {
    if (isWriting || logQueue.length === 0) return
    isWriting = true

    const content = logQueue.splice(0, logQueue.length).join('\n') + '\n'

    fs.appendFile(currentLogFile, content, 'utf-8', () => {
        isWriting = false
        if (logQueue.length > 0) flushLogs()
    })
}

export function log(level: LogLevel, module: string, message: string) {
    if (levelPriority[level] < levelPriority[currentLevel]) return

    const time = formatTime()
    const maskedMessage = maskSensitiveData(message)
    const logLine = `${time} | ${level.padEnd(5)} | ${module.padEnd(12)} | ${maskedMessage}`

    const colors: Record<LogLevel, string> = {
        DEBUG: '\x1b[90m', INFO: '\x1b[36m', WARN: '\x1b[33m', ERROR: '\x1b[31m'
    }
    process.stdout.write(`${colors[level]}${logLine}\x1b[0m\n`)

    logQueue.push(logLine)
    flushLogs()
}

export function cleanOldLogs(retentionDays = 7) {
    if (!fs.existsSync(logsDir)) return

    const now = Date.now()
    const maxAge = retentionDays * 24 * 60 * 60 * 1000

    // 遍历日期文件夹
    const entries = fs.readdirSync(logsDir, { withFileTypes: true })

    for (const entry of entries) {
        const entryPath = path.join(logsDir, entry.name)

        if (entry.isDirectory()) {
            // 检查文件夹日期
            const stat = fs.statSync(entryPath)
            if (now - stat.mtimeMs > maxAge) {
                fs.rmSync(entryPath, { recursive: true, force: true })
                log('INFO', 'Logger', `已删除过期日志目录: ${entry.name}`)
            }
        } else if (entry.name.endsWith('.log')) {
            // 兼容旧的日志文件（直接在logs目录下的）
            const stat = fs.statSync(entryPath)
            if (now - stat.mtimeMs > maxAge) {
                fs.unlinkSync(entryPath)
                log('INFO', 'Logger', `已删除过期日志: ${entry.name}`)
            }
        }
    }
}

export interface Logger {
    debug: (msg: string) => void
    info: (msg: string) => void
    warn: (msg: string) => void
    error: (msg: string) => void
}

export function createLogger(module: string): Logger {
    return {
        debug: (msg: string) => log('DEBUG', module, msg),
        info: (msg: string) => log('INFO', module, msg),
        warn: (msg: string) => log('WARN', module, msg),
        error: (msg: string) => log('ERROR', module, msg)
    }
}

// 初始化
currentLogFile = initLogFile()
