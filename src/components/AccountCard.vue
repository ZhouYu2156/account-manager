<template>
  <el-card class="account-card" shadow="hover">
    <div class="card-content">
      <div class="card-header">
        <div class="header-left">
          <el-avatar :size="28" :icon="Avatar" class="type-avatar" />
          <div class="header-info">
            <span class="type-name">{{ account.type }}</span>
            <!-- <span class="username-preview">{{ account.username }}</span> -->
          </div>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            text
            circle
            size="small"
            :icon="showPassword ? View : Hide"
            @click="togglePasswordVisibility"
            class="action-btn"
          />
          <el-button
            type="primary"
            text
            circle
            size="small"
            :icon="Edit"
            @click="handleEdit"
            class="action-btn"
          />
          <el-button
            type="danger"
            text
            circle
            size="small"
            :icon="Delete"
            @click="handleDelete"
            class="action-btn"
          />
        </div>
      </div>

      <div class="account-details">
        <div class="details-row">
          <div class="details-label">
            <el-icon><User /></el-icon>
          </div>
          <div class="details-value username">
            {{ account.username }}
            <el-button
              type="primary"
              text
              circle
              size="small"
              :icon="CopyDocument"
              @click="copyToClipboard(account.username)"
              class="copy-btn"
            />
          </div>
        </div>

        <div class="details-row">
          <div class="details-label">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="details-value password">
            <span v-if="showPassword" class="password-text">{{ decryptedPassword }}</span>
            <span v-else class="password-mask">••••••••</span>
            <el-button
              type="primary"
              text
              circle
              size="small"
              :icon="CopyDocument"
              @click="copyToClipboard(decryptedPassword)"
              class="copy-btn"
            />
          </div>
        </div>

        <div v-if="account.description" class="details-row description-row">
          <div class="details-label">
            <el-icon><InfoFilled /></el-icon>
          </div>
          <div class="details-value description">{{ account.description }}</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import {
  Avatar,
  CopyDocument,
  Delete,
  Edit,
  Hide,
  InfoFilled,
  Lock,
  RefreshRight,
  Timer,
  User,
  View,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import { useAccountStore } from '../stores/account'
import { useSettingsStore } from '../stores/settings'
import type { Account } from '../types/account'

const emit = defineEmits(['edit-account'])
const props = defineProps<{
  account: Account
}>()

const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const showPassword = ref(false)

const decryptedPassword = computed(() => {
  try {
    if (!props.account.password) {
      return '无密码'
    }

    if (!settingsStore.salt) {
      console.error('解密失败：盐值未设置')
      return '请先设置加密盐'
    }

    // 打印调试信息
    console.log('尝试解密账户密码:')
    console.log('- 账户类型:', props.account.type)
    console.log('- 账户用户名:', props.account.username)
    console.log('- 加密密码长度:', props.account.password.length)
    console.log('- 盐值长度:', settingsStore.salt.length)

    // 尝试解密
    const result = accountStore.decryptPassword(props.account.password)

    // 检查解密结果是否有效
    if (!result || result.trim() === '') {
      console.error('解密结果为空')
      return '解密失败'
    }

    console.log('- 解密成功，密码长度:', result.length)
    return result
  } catch (error) {
    console.error('密码解密失败:', error)

    // 判断是否使用统一密码
    if (accountStore.isUsingUnifiedPassword(props.account.id)) {
      console.warn('该账户使用统一密码，但解密失败')
      return '统一密码解密失败'
    }

    // 打印更多调试信息
    console.log('加密密码:', props.account.password)

    return '解密失败 (请检查盐值)'
  }
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage({
      message: '复制成功',
      type: 'success',
      duration: 1500,
    })
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleEdit = () => {
  emit('edit-account', props.account)
}

const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这个账户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      accountStore.deleteAccount(props.account.id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

const formatFullTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.account-card {
  border-radius: 10px;
  padding: 0;
  transition: all 0.25s ease;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  height: 100%;
  overflow: hidden;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.15);
}

.card-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.type-avatar {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(var(--el-color-primary-rgb), 0.25);
}

.header-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.type-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username-preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  gap: 2px;
}

.action-btn {
  padding: 4px;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.details-row {
  display: flex;
  gap: 10px;
}

.details-label {
  color: var(--el-color-primary);
  width: 24px;
  flex-shrink: 0;
  padding-top: 2px;
}

.details-value {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 13px;
  display: flex;
  align-items: center;
  position: relative;
  word-break: break-all;
}

.username,
.password {
  justify-content: space-between;
}

.copy-btn {
  font-size: 14px;
  padding: 4px;
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.password-text {
  font-family: monospace;
}

.password-mask {
  letter-spacing: 2px;
  font-weight: bold;
}

.description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.description-row {
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
