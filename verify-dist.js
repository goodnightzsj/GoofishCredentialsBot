
import { encrypt, decrypt } from './dist/utils/encryption.js';
import { createLogger } from './dist/core/logger.js';

async function verify() {
    console.log('--- 验证加密工具 (Dist) ---');
    const original = 'test-cookie-value-dist';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    console.log(`Original: ${original}`);
    console.log(`Encrypted: ${encrypted}`);
    console.log(`Decrypted: ${decrypted}`);
    
    if (original !== decrypted) {
        throw new Error('Encryption/Decryption failed!');
    }
    console.log('加密验证通过 ✅');

    console.log('\n--- 验证日志屏蔽 (Dist) ---');
    const logger = createLogger('VerifyDist');
    logger.info('User login with token=abcdef123456'); 
    logger.info('Request header: Authorization: Bearer secret-token-value');
    logger.info('Set-Cookie: session_id=xyz789; Path=/;');

    console.log('请检查上方日志输出是否已包含 ******');
}

verify().catch(console.error);
