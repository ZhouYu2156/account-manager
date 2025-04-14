import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import type { Account, AccountFilter, AccountInput } from '../types/account'
import { decrypt, encrypt } from '../utils/crypto'
import { getAccounts, saveAccounts } from '../utils/storage'
import { useSettingsStore } from './settings'

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as Account[],
    filter: {} as AccountFilter,
  }),

  getters: {
    filteredAccounts: (state) => {
      return state.accounts.filter((account) => {
        if (
          state.filter.type &&
          !account.type.toLowerCase().includes(state.filter.type.toLowerCase())
        ) {
          return false
        }
        if (
          state.filter.username &&
          !account.username.toLowerCase().includes(state.filter.username.toLowerCase())
        ) {
          return false
        }
        return true
      })
    },

    groupedAccounts: (state) => {
      const groups = new Map<string, Account[]>()
      state.accounts.forEach((account) => {
        if (!groups.has(account.type)) {
          groups.set(account.type, [])
        }
        groups.get(account.type)?.push(account)
      })
      return groups
    },
  },

  actions: {
    initialize() {
      this.accounts = getAccounts()
    },

    setFilter(filter: AccountFilter) {
      this.filter = filter
    },

    addAccount(account: AccountInput): void {
      const settingsStore = useSettingsStore()
      const now = Date.now()

      // 只使用用户提供的密码，不自动使用统一密码
      if (!account.password) {
        throw new Error('密码不能为空，请输入密码')
      }

      // 加密用户提供的密码
      const password = encrypt(account.password, settingsStore.salt)

      const newAccount: Account = {
        ...account,
        id: uuidv4(),
        createTime: now,
        updateTime: now,
        password: password,
      }

      this.accounts.push(newAccount)
      saveAccounts(this.accounts)
    },

    updateAccount(id: string, updates: AccountInput): void {
      const settingsStore = useSettingsStore()
      const index = this.accounts.findIndex((a) => a.id === id)

      if (index !== -1) {
        const updatedFields: Partial<Account> = { ...updates }

        // 处理密码更新逻辑，不再使用统一密码，只处理用户输入的密码
        if (updates.password) {
          // 加密用户输入的密码
          updatedFields.password = encrypt(updates.password, settingsStore.salt)
        }
        // 如果没有提供密码，则保留原密码，不自动使用统一密码

        this.accounts[index] = {
          ...this.accounts[index],
          ...updatedFields,
          updateTime: Date.now(),
        }

        saveAccounts(this.accounts)
      }
    },

    deleteAccount(id: string) {
      const index = this.accounts.findIndex((a) => a.id === id)
      if (index !== -1) {
        this.accounts.splice(index, 1)
        saveAccounts(this.accounts)
      }
    },

    updateAllPasswords(newPassword: string) {
      const settingsStore = useSettingsStore()

      if (!settingsStore.salt) {
        console.error('未设置加密盐，无法更新密码')
        throw new Error('未设置加密盐')
      }

      try {
        // 加密新密码
        const encryptedPassword = encrypt(newPassword, settingsStore.salt)

        // 验证加密
        const decryptTest = decrypt(encryptedPassword, settingsStore.salt)
        if (decryptTest !== newPassword) {
          console.error('密码加密验证失败:')
          console.error('- 原始密码:', newPassword)
          console.error('- 解密结果:', decryptTest)
          throw new Error('密码加密验证失败')
        }

        // 更新所有账户的密码
        this.accounts = this.accounts.map((account) => ({
          ...account,
          password: encryptedPassword,
          updateTime: Date.now(),
        }))

        saveAccounts(this.accounts)
        console.log('所有账户密码已更新')
      } catch (error) {
        console.error('更新所有密码失败:', error)
        throw error
      }
    },

    decryptPassword(encryptedPassword: string): string {
      const settingsStore = useSettingsStore()

      if (!settingsStore.salt) {
        console.error('解密失败：未设置加密盐')
        throw new Error('未设置加密盐')
      }

      if (!encryptedPassword) {
        console.error('解密失败：密码为空')
        throw new Error('密码为空')
      }

      try {
        return decrypt(encryptedPassword, settingsStore.salt)
      } catch (error) {
        console.error('解密过程发生错误:', error)
        // 重新抛出错误，保留原始信息
        throw error
      }
    },

    /**
     * 检查账户是否使用统一密码
     * @param id 账户ID
     * @returns 是否使用统一密码
     */
    isUsingUnifiedPassword(id: string): boolean {
      const settingsStore = useSettingsStore()
      if (!settingsStore.useUnifiedPassword) return false

      const account = this.accounts.find((a) => a.id === id)
      if (!account) return false

      // 如果账户密码与统一密码相同，则认为使用统一密码
      return account.password === settingsStore.unifiedPassword
    },

    /**
     * 替换所有账户数据（用于批量更新场景）
     * @param accounts 新的账户数据数组
     */
    replaceAllAccounts(accounts: Account[]): void {
      this.accounts = accounts
      saveAccounts(this.accounts)
    },
  },
})
