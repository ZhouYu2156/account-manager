<template>
  <div class="account-list">
    <template v-if="hasAccounts">
      <div class="list-header">
        <div class="list-title">
          <div class="title-with-count">
            <h3>账户列表</h3>
            <el-badge :value="totalAccounts" type="primary" />
          </div>
          <div class="list-actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="group">
                <el-icon><Collection /></el-icon>分组视图
              </el-radio-button>
              <el-radio-button label="list">
                <el-icon><Grid /></el-icon>列表视图
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- 分组视图 -->
      <template v-if="viewMode === 'group'">
        <el-collapse class="custom-collapse" v-model="activeGroups">
          <el-collapse-item v-for="group in groupedAccounts" :key="group.type" :name="group.type">
            <template #title>
              <div class="collapse-title">
                <div class="collapse-title-left">
                  <el-icon class="group-icon"><Folder /></el-icon>
                  <span>{{ group.type }}</span>
                  <el-tag size="small" type="info" effect="plain" class="count-tag">{{
                    group.accounts.length
                  }}</el-tag>
                </div>
              </div>
            </template>
            <div class="account-group">
              <AccountCard
                v-for="account in group.accounts"
                :key="account.id"
                :account="account"
                @edit-account="handleEditAccount"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
      </template>

      <!-- 列表视图 -->
      <template v-else>
        <div class="account-grid">
          <AccountCard
            v-for="account in flatAccounts"
            :key="account.id"
            :account="account"
            @edit-account="handleEditAccount"
          />
        </div>
      </template>
    </template>

    <div v-if="!hasAccounts" class="empty-state">
      <el-empty :image-size="180">
        <template #image>
          <div class="empty-icon-wrapper">
            <el-icon class="empty-icon"><Folder /></el-icon>
          </div>
        </template>
        <template #description>
          <div class="empty-text">
            <p class="empty-title">暂无账户信息</p>
            <p class="empty-tip">点击下方按钮添加您的第一个账户</p>
          </div>
        </template>
        <el-button type="primary" @click="handleAddAccount" class="add-first-account">
          <el-icon><Plus /></el-icon> 添加账户
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Collection, Folder, Grid, Plus } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useAccountStore } from '../stores/account'
import type { Account } from '../types/account'
import AccountCard from './AccountCard.vue'

const emit = defineEmits(['addAccount', 'editAccount'])
const accountStore = useAccountStore()
const viewMode = ref('group') // 'group' 或 'list'
const activeGroups = ref<string[]>([]) // 记录当前展开的分组

// 定义分组接口
interface AccountGroup {
  type: string
  accounts: Account[]
}

// 计算分组后的账户
const groupedAccounts = computed<AccountGroup[]>(() => {
  const filtered = accountStore.filteredAccounts
  const groupsMap = new Map<string, Account[]>()

  filtered.forEach((account) => {
    if (!groupsMap.has(account.type)) {
      groupsMap.set(account.type, [])
    }
    const typeAccounts = groupsMap.get(account.type)
    if (typeAccounts) {
      typeAccounts.push(account)
    }
  })

  // 转换为数组格式并排序
  const result: AccountGroup[] = []
  groupsMap.forEach((accounts, type) => {
    result.push({
      type,
      accounts: [...accounts].sort((a, b) => b.createTime - a.createTime),
    })
  })

  return result.sort((a, b) => a.type.localeCompare(b.type))
})

// 所有账户的平铺列表（用于列表视图）
const flatAccounts = computed(() => {
  return accountStore.filteredAccounts.sort((a, b) => {
    // 先按类型排序，再按创建时间排序
    const typeCompare = a.type.localeCompare(b.type)
    if (typeCompare !== 0) return typeCompare
    return b.createTime - a.createTime
  })
})

// 是否有账户
const hasAccounts = computed(() => accountStore.accounts.length > 0)

// 账户总数
const totalAccounts = computed(() => accountStore.accounts.length)

// 初始化时展开第一个分组
if (groupedAccounts.value.length > 0) {
  activeGroups.value = [groupedAccounts.value[0].type]
}

// 处理添加账户按钮点击
const handleAddAccount = () => {
  emit('addAccount')
}

// 处理编辑账户
const handleEditAccount = (account: Account) => {
  emit('editAccount', account)
}
</script>

<style scoped>
.account-list {
  margin-top: 0;
}

.list-header {
  margin-bottom: 1.5rem;
}

.list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title-with-count {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-with-count h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.list-actions :deep(.el-radio-group) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 2px;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
}

.list-actions :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  height: 32px;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.list-actions :deep(.el-radio-button__original) {
  opacity: 0;
}

.list-actions :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 4px 0 0 4px;
}

.list-actions :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 4px 4px 0;
}

.list-actions :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
  color: white;
  font-weight: 500;
}

.list-actions .el-icon {
  font-size: 16px;
}

.custom-collapse {
  --el-collapse-header-height: 50px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  background-color: var(--el-bg-color);
}

:deep(.el-collapse-item__header) {
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 500;
  transition: all 0.3s;
}

:deep(.el-collapse-item__header:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-collapse-item__content) {
  padding: 20px;
  background-color: var(--el-fill-color-blank);
}

.collapse-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.collapse-title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-tag {
  font-size: 12px;
  padding: 0 8px;
  height: 22px;
  line-height: 20px;
  border-radius: 11px;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info-dark-2);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-left: 8px;
}

.account-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.empty-state {
  margin-top: 80px;
  display: flex;
  justify-content: center;
}

.empty-icon-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background: linear-gradient(
    120deg,
    var(--el-color-primary-light-8),
    var(--el-color-primary-light-9)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 25px rgba(var(--el-color-primary-rgb), 0.15);
}

.empty-icon {
  font-size: 54px;
  color: var(--el-color-primary);
  opacity: 0.9;
}

.empty-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.empty-title {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.empty-tip {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.add-first-account {
  padding: 12px 28px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border: none;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s ease;
}

.add-first-account:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
}

@media (max-width: 1200px) {
  .account-group,
  .account-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .account-grid,
  .account-group {
    grid-template-columns: 1fr;
  }

  .list-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .list-actions {
    width: 100%;
  }

  .empty-state {
    margin-top: 40px;
  }
}
</style>
