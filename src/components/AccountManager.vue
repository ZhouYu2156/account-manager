<script setup lang="ts">
import { Download, InfoFilled, Key, Lock, More, Plus, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useAccountStore } from '../stores/account'
import { useSettingsStore } from '../stores/settings'
import type { Account } from '../types/account'
import { decrypt, encrypt } from '../utils/crypto'
import { exportData, importData } from '../utils/storage'
import { validateSalt } from '../utils/validation'
import AccountForm from './AccountForm.vue'
import AccountList from './AccountList.vue'
import SearchBar from './SearchBar.vue'
import ThemeSwitch from './ThemeSwitch.vue'

const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

// 检查是否已设置加密盐
const hasSalt = computed(() => !!settingsStore.salt)

// 对话框显示状态
const showAddDialog = ref(false)
const showPasswordDialog = ref(false)
const showSaltDialog = ref(false)

// 表单引用
const passwordFormRef = ref<FormInstance>()
const saltFormRef = ref<FormInstance>()
const accountFormRef = ref<FormInstance>()

// 表单数据
const passwordForm = ref({
  password: '',
  showCurrentPassword: false,
})

const saltForm = ref({
  salt: '',
  showCurrentSalt: false,
})

// 添加对当前盐值和统一密码的计算属性
const currentSalt = computed(() => settingsStore.salt || '未设置')
const hasUnifiedPassword = computed(
  () => settingsStore.useUnifiedPassword && !!settingsStore.unifiedPassword,
)

// 表单验证规则
const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入统一密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
  ],
}

const saltRules: FormRules = {
  salt: [
    { required: true, message: '请输入加密盐', trigger: 'blur' },
    { min: 6, message: '加密盐长度不能小于6位', trigger: 'blur' },
  ],
}

const editingAccount = ref<Account | undefined>(undefined)

// 提交添加账户表单（转发给子组件的提交方法）
const submitAddForm = () => {
  // 直接查找隐藏的提交按钮并触发点击
  const submitButton = document.getElementById('form-submit-button')

  if (submitButton) {
    console.log('找到提交按钮，触发点击')
    submitButton.click()
  } else {
    console.error('未找到提交按钮')
    // 尝试通过父容器查找
    const accountForm = document.querySelector('.account-form')
    if (accountForm) {
      // 尝试触发表单的submit事件
      const formElement = accountForm.querySelector('form')
      if (formElement) {
        console.log('触发表单提交事件')
        const submitEvent = new Event('submit', { bubbles: true })
        formElement.dispatchEvent(submitEvent)
      } else {
        ElMessage.warning('无法提交表单，请稍后再试')
      }
    } else {
      ElMessage.warning('未找到表单组件')
    }
  }
}

// 处理添加账户提交
const handleAddSubmit = () => {
  showAddDialog.value = false
  editingAccount.value = undefined
}

// 处理编辑账户
const handleEditAccount = (account: Account) => {
  editingAccount.value = { ...account }
  showAddDialog.value = true
}

// 取消编辑
const cancelEdit = () => {
  showAddDialog.value = false
  editingAccount.value = undefined
}

// 处理统一密码设置
const handleUnifiedPassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 检查加密盐是否已设置
      if (!settingsStore.salt) {
        ElMessage.warning('请先设置加密盐')
        return
      }

      // 测试加密解密功能是否正常
      try {
        const testPassword = passwordForm.value.password
        const encryptedTest = encrypt(testPassword, settingsStore.salt)
        const decryptedTest = decrypt(encryptedTest, settingsStore.salt)

        if (decryptedTest !== testPassword) {
          console.error('加密解密测试失败:')
          console.error('- 原始密码:', testPassword)
          console.error('- 解密结果:', decryptedTest)
          ElMessage.error('密码加密测试失败，请重试或联系管理员')
          return
        }

        console.log('加密解密测试成功')
      } catch (error) {
        console.error('加密解密测试出错:', error)
        ElMessage.error('密码加密测试失败，请重试')
        return
      }

      ElMessageBox.confirm('确定要将所有账户密码统一修改吗？该操作不可撤销。', '操作确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          try {
            // 先设置统一密码(保存到设置中)
            settingsStore.setUnifiedPassword(passwordForm.value.password)

            // 然后明确更新所有账户密码为统一密码
            accountStore.updateAllPasswords(passwordForm.value.password)

            ElMessage.success('统一密码设置成功，所有账户密码已更新')
            showPasswordDialog.value = false
            passwordForm.value.password = ''
          } catch (error) {
            console.error('更新统一密码失败:', error)
            ElMessage.error('设置统一密码失败，请重试')
          }
        })
        .catch(() => {
          // 用户取消操作，不做处理
        })
    }
  })
}

// 处理加密盐设置
const handleSaltSubmit = async () => {
  if (!saltFormRef.value) return

  await saltFormRef.value.validate((valid) => {
    if (valid) {
      const errors = validateSalt(saltForm.value.salt)
      if (errors.length > 0) {
        ElMessage.error(errors.join('\n'))
        return
      }

      const confirmMessage = settingsStore.salt
        ? '修改加密盐会导致需要重新加密所有账户密码，确定要继续吗？'
        : '请务必记住您的加密盐，丢失后将无法恢复账户密码。确定设置吗？'

      ElMessageBox.confirm(confirmMessage, '重要提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          const oldSalt = settingsStore.salt
          const newSalt = saltForm.value.salt

          // 如果有旧盐值，且有账户数据，需要重新加密所有账户密码
          if (oldSalt && accountStore.accounts.length > 0) {
            try {
              // 遍历所有账户，使用新盐值重新加密密码
              const accounts = accountStore.accounts.map((account) => {
                // 解密原密码
                const decryptedPassword = accountStore.decryptPassword(account.password)
                // 使用新盐值加密
                const newEncryptedPassword = encrypt(decryptedPassword, newSalt)
                // 返回更新后的账户
                return {
                  ...account,
                  password: newEncryptedPassword,
                  updateTime: Date.now(),
                }
              })

              // 更新所有账户
              accountStore.replaceAllAccounts(accounts)

              // 如果使用统一密码，也需要重新加密统一密码
              if (settingsStore.useUnifiedPassword && settingsStore.unifiedPassword) {
                try {
                  // 解密统一密码
                  const decryptedUnifiedPassword = decrypt(settingsStore.unifiedPassword, oldSalt)
                  // 使用新盐值加密统一密码
                  const newEncryptedUnifiedPassword = encrypt(decryptedUnifiedPassword, newSalt)
                  // 更新统一密码
                  settingsStore.updateSettings({
                    salt: newSalt,
                    unifiedPassword: newEncryptedUnifiedPassword,
                  })
                } catch (error) {
                  // 统一密码重新加密失败，清除统一密码设置
                  settingsStore.updateSettings({
                    salt: newSalt,
                    useUnifiedPassword: false,
                    unifiedPassword: undefined,
                  })
                  ElMessage.warning('统一密码重新加密失败，已清除统一密码设置')
                }
              } else {
                // 无统一密码，直接更新盐值
                settingsStore.updateSettings({ salt: newSalt })
              }

              ElMessage.success('加密盐已更新，所有账户密码已重新加密')
            } catch (error) {
              ElMessage.error('密码重新加密失败，请检查原盐值是否正确')
              return
            }
          } else {
            // 无旧盐值或无账户数据，直接更新盐值
            settingsStore.updateSettings({ salt: newSalt })
            ElMessage.success('加密盐设置成功')
          }

          showSaltDialog.value = false
          saltForm.value.salt = ''
        })
        .catch(() => {
          // 用户取消操作，不做处理
        })
    }
  })
}

// 显示统一密码信息
const showUnifiedPasswordInfo = () => {
  if (!settingsStore.unifiedPassword || !settingsStore.salt) {
    ElMessage.warning('未设置统一密码或加密盐')
    return
  }

  try {
    console.log('尝试解密统一密码:')
    console.log('- 盐值长度:', settingsStore.salt.length)
    console.log('- 加密密码长度:', settingsStore.unifiedPassword.length)

    // 尝试解密统一密码
    const decryptedPassword = decrypt(settingsStore.unifiedPassword, settingsStore.salt)

    // 检查解密结果
    if (!decryptedPassword || decryptedPassword.trim() === '') {
      throw new Error('解密结果为空')
    }

    console.log('- 解密成功，密码长度:', decryptedPassword.length)

    // 显示密码对话框
    ElMessageBox.alert(
      `<div style="text-align: center; font-family: monospace; font-size: 18px; padding: 10px 0;">${decryptedPassword}</div>`,
      '当前统一密码',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        center: true,
      },
    )
  } catch (error) {
    console.error('统一密码解密失败:', error)

    // 显示更详细的错误信息
    ElMessage.error(`统一密码解密失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 处理更多操作
const handleCommand = async (command: string) => {
  switch (command) {
    case 'password':
      showPasswordDialog.value = true
      break
    case 'salt':
      showSaltDialog.value = true
      break
    case 'import':
      ElMessageBox.confirm('导入数据将覆盖当前所有账户信息，确定要继续吗？', '操作确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json'
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              try {
                const text = await file.text()
                importData(text)
                accountStore.initialize()
                settingsStore.initialize()
                ElMessage.success('数据导入成功')
              } catch (error) {
                ElMessage.error('数据导入失败')
              }
            }
          }
          input.click()
        })
        .catch(() => {
          // 用户取消操作，不做处理
        })
      break

    case 'export':
      const data = exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-manager-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('数据导出成功')
      break
  }
}

// 初始化
onMounted(() => {
  accountStore.initialize()
  settingsStore.initialize()
})

// 监听密码对话框的打开
watch(
  () => showPasswordDialog.value,
  (val) => {
    if (val) {
      // 重置表单，避免残留上次输入
      passwordForm.value.password = ''
      passwordForm.value.showCurrentPassword = false
    }
  },
)

// 监听盐值对话框的打开
watch(
  () => showSaltDialog.value,
  (val) => {
    if (val) {
      // 重置表单，避免残留上次输入
      saltForm.value.salt = ''
      saltForm.value.showCurrentSalt = false
    }
  },
)
</script>

<template>
  <div class="account-manager" :class="{ dark: settingsStore.theme === 'dark' }">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="app-logo">
        <el-icon class="logo-icon"><Lock /></el-icon>
        <h1>账户管理器</h1>
      </div>

      <div class="navbar-actions">
        <ThemeSwitch />
      </div>
    </div>

    <el-container class="main-layout">
      <!-- 侧边栏 -->
      <el-aside width="220px" class="sidebar">
        <div class="sidebar-content">
          <!-- 主要操作按钮 -->
          <el-button type="primary" @click="showAddDialog = true" class="action-btn add-btn">
            <el-icon><Plus /></el-icon>添加账户
          </el-button>

          <!-- 账户管理 -->
          <div class="action-group">
            <div class="action-title">账户管理</div>
            <el-menu class="action-menu" :default-active="'1'" :collapse="false">
              <el-menu-item index="1" @click="showPasswordDialog = true">
                <el-icon><Key /></el-icon>
                <template #title>统一密码</template>
              </el-menu-item>

              <el-menu-item index="2" @click="showSaltDialog = true">
                <el-icon><Lock /></el-icon>
                <template #title>设置加密盐</template>
              </el-menu-item>
            </el-menu>
          </div>

          <!-- 数据操作 -->
          <div class="action-group">
            <div class="action-title">数据操作</div>
            <el-menu class="action-menu" :default-active="'3'" :collapse="false">
              <el-menu-item index="3" @click="handleCommand('import')">
                <el-icon><Upload /></el-icon>
                <template #title>导入数据</template>
              </el-menu-item>

              <el-menu-item index="4" @click="handleCommand('export')">
                <el-icon><Download /></el-icon>
                <template #title>导出数据</template>
              </el-menu-item>
            </el-menu>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="app-info">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>数据本地存储，安全无忧</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="content-container">
        <!-- 盐值警告提示 -->
        <div v-if="!hasSalt" class="salt-warning">
          <el-alert
            title="安全警告：请先设置加密盐"
            type="warning"
            description="为确保账户信息安全，使用前请先设置加密盐值用于密码加密"
            show-icon
            :closable="false"
          >
            <template #default>
              <el-button type="primary" @click="showSaltDialog = true" class="mt-2">
                立即设置
              </el-button>
            </template>
          </el-alert>
        </div>

        <!-- 内容区头部 -->
        <div class="content-header">
          <div class="header-title">
            <h2>我的账户</h2>
          </div>

          <!-- 搜索区域 -->
          <div class="search-area">
            <SearchBar />
          </div>
        </div>

        <!-- 主内容区域 -->
        <el-main>
          <!-- 账户列表 -->
          <AccountList @edit-account="handleEditAccount" @add-account="showAddDialog = true" />
        </el-main>
      </el-container>
    </el-container>

    <!-- 添加账户对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingAccount ? '编辑账户' : '添加新账户'"
      width="500px"
      destroy-on-close
      :show-close="true"
      center
    >
      <AccountForm
        @submit="handleAddSubmit"
        :account="editingAccount"
        :edit-mode="!!editingAccount"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="submitAddForm">{{
            editingAccount ? '保存修改' : '确认添加'
          }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 统一密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="设置统一密码"
      width="450px"
      destroy-on-close
      center
    >
      <div class="dialog-description">
        <el-alert
          title="统一密码将应用于所有账户"
          type="info"
          description="此操作会将所有账户的密码统一修改为相同的密码，适用于批量管理账户"
          :closable="false"
          show-icon
        />
      </div>
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        class="custom-form"
      >
        <el-form-item label="统一密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            show-password
            placeholder="请输入统一密码"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div v-if="hasUnifiedPassword" class="current-setting-info">
          <el-checkbox v-model="passwordForm.showCurrentPassword">显示当前密码</el-checkbox>
          <div v-if="passwordForm.showCurrentPassword" class="current-value">
            <span>当前密码为: </span>
            <el-tag type="success">已设置</el-tag>
            <el-button type="primary" text size="small" @click="showUnifiedPasswordInfo">
              查看密码
            </el-button>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUnifiedPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设置加密盐对话框 -->
    <el-dialog v-model="showSaltDialog" title="设置加密盐" width="450px" destroy-on-close center>
      <div class="dialog-description">
        <el-alert
          title="加密盐是保障账户安全的关键"
          type="warning"
          description="加密盐用于密码加密，请设置一个足够复杂且容易记住的值，一旦设置不要轻易更改"
          :closable="false"
          show-icon
        />
      </div>
      <el-form
        ref="saltFormRef"
        :model="saltForm"
        :rules="saltRules"
        label-width="100px"
        class="custom-form"
      >
        <el-form-item label="加密盐" prop="salt">
          <el-input
            v-model="saltForm.salt"
            type="password"
            show-password
            placeholder="请输入加密盐（至少6位）"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div v-if="currentSalt !== '未设置'" class="current-setting-info">
          <el-checkbox v-model="saltForm.showCurrentSalt">显示当前盐值</el-checkbox>
          <div v-if="saltForm.showCurrentSalt" class="current-value">
            <span>当前盐值为: </span>
            <el-tag type="success">{{ currentSalt }}</el-tag>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSaltDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaltSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.account-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

/* 顶部导航栏 */
.navbar {
  background-color: var(--el-bg-color);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
}

.logo-icon {
  font-size: 24px;
  color: var(--el-color-primary);
  border-radius: 8px;
  padding: 8px;
  background-color: var(--el-color-primary-light-9);
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.app-logo h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 主布局 */
.main-layout {
  flex: 1;
  overflow: hidden;
}

/* 内容区头部 */
.content-header {
  padding: 20px 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.header-title h2 {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  position: relative;
  display: inline-block;
}

.header-title h2::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-5));
  border-radius: 3px;
}

.search-area {
  margin-top: 16px;
  width: 100%;
}

/* 主内容区域 */
.content-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.salt-warning {
  margin: 16px 24px 0;
}

.mt-2 {
  margin-top: 8px;
}

:deep(.el-main) {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* 侧边栏样式 */
.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: inset -5px 0 10px -5px rgba(0, 0, 0, 0.03);
  position: relative;
  transition: all 0.3s ease;
  z-index: 100;
}

.sidebar-content {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.add-btn {
  margin: 0 16px 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
  background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border: none;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.action-group {
  display: flex;
  flex-direction: column;
}

.action-title {
  padding: 0 20px 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.action-menu {
  border-right: none;
  background: transparent;
}

.action-menu :deep(.el-menu-item) {
  padding: 0 20px;
  height: 42px;
  line-height: 42px;
  border-radius: 0;
  margin: 2px 0;
  transition: all 0.3s ease;
}

.action-menu :deep(.el-menu-item:hover) {
  background-color: var(--el-fill-color-light);
}

.action-menu :deep(.el-menu-item i) {
  color: var(--el-text-color-regular);
  font-size: 16px;
}

.action-menu :deep(.el-menu-item.is-active) {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  color: var(--el-text-color-secondary);
  font-size: 0.75rem;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: auto;
  background-color: var(--el-bg-color);
}

.app-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.app-info .el-icon {
  font-size: 14px;
  color: var(--el-color-success);
}

/* 对话框样式 */
.dialog-description {
  margin-bottom: 20px;
}

.custom-form {
  margin-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.current-setting-info {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  background-color: var(--el-fill-color-light);
}

.current-value {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 10px;
}

:deep(.el-dialog__header) {
  text-align: center;
  font-weight: 600;
  margin-right: 0;
  padding-bottom: 0;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

/* 深色模式相关样式 */
.dark-mode {
  --el-text-color-primary: #e5eaf3;
  --el-text-color-regular: #cfd3dc;
  --el-text-color-secondary: #a3a6ad;
  --el-border-color-light: #414243;
  --el-border-color-lighter: #363738;
  --el-color-primary-light-9: #283142;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
  }

  .sidebar {
    width: 200px !important;
  }

  :deep(.el-main) {
    padding: 16px;
  }

  .content-header {
    padding: 16px;
  }
}
</style>
