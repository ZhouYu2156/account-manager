// 账户相关类型定义

/**
 * 账户信息接口
 */
export interface Account {
  id: string // 唯一标识
  type: string // 账户类型
  username: string // 用户名
  password: string // 加密后的密码
  description?: string // 描述信息
  createTime: number // 创建时间
  updateTime: number // 更新时间
}

/**
 * 添加或更新账户时使用的接口
 */
export interface AccountInput {
  type: string
  username: string
  password?: string // 可选密码，用于支持统一密码
  description?: string
}

/**
 * 应用设置接口
 */
export interface Settings {
  salt: string // 加密盐值
  theme: 'light' | 'dark' // 主题设置
  useUnifiedPassword: boolean // 是否使用统一密码
  unifiedPassword?: string // 统一密码（加密后）
}

/**
 * 账户筛选条件接口
 */
export interface AccountFilter {
  type: string // 按类型筛选
  username: string // 按用户名筛选
}
