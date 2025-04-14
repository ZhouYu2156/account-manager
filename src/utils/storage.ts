import type { Account, Settings } from '../types/account'

const ACCOUNTS_KEY = 'accounts'
const SETTINGS_KEY = 'settings'

export const getAccounts = (): Account[] => {
  const accounts = localStorage.getItem(ACCOUNTS_KEY)
  return accounts ? JSON.parse(accounts) : []
}

export const saveAccounts = (accounts: Account[]): void => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export const getSettings = (): Settings => {
  const settings = localStorage.getItem(SETTINGS_KEY)
  return settings
    ? JSON.parse(settings)
    : {
        salt: '',
        theme: 'light',
        useUnifiedPassword: false,
      }
}

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export const exportData = (): string => {
  const data = {
    accounts: getAccounts(),
    settings: getSettings(),
  }
  return JSON.stringify(data, null, 2)
}

export const importData = (jsonString: string): void => {
  try {
    const data = JSON.parse(jsonString)
    if (data.accounts && Array.isArray(data.accounts)) {
      saveAccounts(data.accounts)
    }
    if (data.settings && typeof data.settings === 'object') {
      saveSettings(data.settings)
    }
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}
