import type { Account } from '../types/account'

export const validateAccount = (account: Partial<Account>): string[] => {
  const errors: string[] = []

  if (!account.type?.trim()) {
    errors.push('账户类型不能为空')
  }

  if (!account.username?.trim()) {
    errors.push('用户名不能为空')
  }

  if (!account.password?.trim()) {
    errors.push('密码不能为空')
  }

  return errors
}

export const validateSalt = (salt: string): string[] => {
  const errors: string[] = []

  if (!salt.trim()) {
    errors.push('加密盐值不能为空')
  }

  if (salt.length < 6) {
    errors.push('加密盐值长度不能小于6位')
  }

  return errors
}
