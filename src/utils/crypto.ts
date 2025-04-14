import CryptoJS from 'crypto-js'

/**
 * 处理盐值以确保长度一致性
 * @param salt 原始盐值
 * @returns 处理后的盐值
 */
function normalizeSalt(salt: string): string {
  // 为确保密钥长度符合AES要求，我们使用SHA256哈希原始盐值
  return CryptoJS.SHA256(salt).toString().substring(0, 32)
}

/**
 * 使用盐值对字符串进行加密
 * @param str 要加密的字符串
 * @param salt 加密用的盐值
 * @returns 加密后的字符串
 */
export function encrypt(str: string, salt: string): string {
  if (!str || !salt) {
    throw new Error('加密失败：缺少待加密字符串或盐值')
  }

  try {
    // 标准化盐值，确保密钥长度合适
    const normalizedSalt = normalizeSalt(salt)

    // 使用标准化的盐值创建密钥
    const key = CryptoJS.enc.Utf8.parse(normalizedSalt)
    const iv = CryptoJS.lib.WordArray.random(16)

    // 加密
    const encrypted = CryptoJS.AES.encrypt(str, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    // 将IV附加到密文并返回Base64编码的结果
    // 格式：Base64(IV + Ciphertext)
    const ivAndCiphertext = iv.toString() + encrypted.toString()
    return ivAndCiphertext
  } catch (error) {
    console.error('加密过程出错:', error)
    throw new Error('加密失败')
  }
}

/**
 * 使用盐值对加密字符串进行解密
 * @param encrypted 加密后的字符串
 * @param salt 解密用的盐值
 * @returns 解密后的原始字符串
 */
export function decrypt(encrypted: string, salt: string): string {
  if (!encrypted || !salt) {
    throw new Error('解密失败：缺少加密字符串或盐值')
  }

  try {
    // 首先尝试使用新版加密方式解密
    try {
      // 提取IV（前32个字符）和密文
      const ivStr = encrypted.substring(0, 32)
      const ciphertextStr = encrypted.substring(32)

      // 标准化盐值
      const normalizedSalt = normalizeSalt(salt)

      // 解析IV和密钥
      const iv = CryptoJS.enc.Hex.parse(ivStr)
      const key = CryptoJS.enc.Utf8.parse(normalizedSalt)

      // 解密
      const decrypted = CryptoJS.AES.decrypt(ciphertextStr, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      })

      const result = decrypted.toString(CryptoJS.enc.Utf8)

      if (result) {
        return result
      }
    } catch (err) {
      console.info('新版解密方式失败，尝试旧版解密', err)
      // 如果新版解密失败，继续尝试旧版解密
    }

    // 旧版解密方法
    const key = CryptoJS.enc.Utf8.parse(salt)
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })

    const result = decrypted.toString(CryptoJS.enc.Utf8)

    if (!result) {
      throw new Error('解密结果为空')
    }

    return result
  } catch (error) {
    console.error('解密过程出错:', error)
    throw new Error('解密失败，可能是加密盐不正确')
  }
}

/**
 * 生成随机密码
 * @param length 密码长度，默认12位
 * @param useSpecial 是否使用特殊字符
 * @returns 生成的随机密码
 */
export function generateRandomPassword(length: number = 12, useSpecial: boolean = true): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?'

  let chars = uppercaseChars + lowercaseChars + numberChars
  if (useSpecial) {
    chars += specialChars
  }

  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    password += chars[randomIndex]
  }

  return password
}
