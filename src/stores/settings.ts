import { defineStore } from 'pinia'
import type { Settings } from '../types/account'
import { decrypt, encrypt } from '../utils/crypto'
import { getSettings, saveSettings } from '../utils/storage'

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    salt: '',
    theme: 'light',
    useUnifiedPassword: false,
    unifiedPassword: undefined,
  }),

  actions: {
    initialize() {
      const settings = getSettings()
      this.$patch(settings)

      // 应用主题
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    updateSettings(settings: Partial<Settings>) {
      // 如果设置了统一密码，先加密
      if (settings.unifiedPassword && this.salt) {
        try {
          // 加密密码
          const encryptedPassword = encrypt(settings.unifiedPassword, this.salt)

          // 验证加密
          const decryptTest = decrypt(encryptedPassword, this.salt)
          if (decryptTest !== settings.unifiedPassword) {
            console.error('加密验证失败, 无法设置统一密码')
            throw new Error('密码加密验证失败')
          }

          settings.unifiedPassword = encryptedPassword
          settings.useUnifiedPassword = true

          console.log('加密成功，统一密码已设置')
        } catch (error) {
          console.error('加密统一密码失败:', error)
          // 如果加密失败，不设置统一密码
          delete settings.unifiedPassword
          settings.useUnifiedPassword = false
        }
      }

      this.$patch(settings)
      saveSettings(this.$state)
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'

      // 同步DOM的主题类
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      saveSettings(this.$state)
    },

    setUnifiedPassword(password: string) {
      if (!this.salt) {
        console.error('未设置加密盐，无法设置统一密码')
        return
      }

      try {
        // 加密密码
        const encryptedPassword = encrypt(password, this.salt)

        // 进行加密测试
        const decryptTest = decrypt(encryptedPassword, this.salt)

        if (decryptTest !== password) {
          console.error('统一密码加密测试失败:')
          console.error('- 原始密码:', password)
          console.error('- 解密结果:', decryptTest)
          throw new Error('密码加密验证失败')
        }

        this.unifiedPassword = encryptedPassword
        this.useUnifiedPassword = true
        saveSettings(this.$state)

        console.log('统一密码设置成功')
      } catch (error) {
        console.error('设置统一密码失败:', error)
        throw error
      }
    },

    clearUnifiedPassword() {
      this.unifiedPassword = undefined
      this.useUnifiedPassword = false
      saveSettings(this.$state)
    },
  },
})
