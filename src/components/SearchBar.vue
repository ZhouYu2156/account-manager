<template>
  <div class="search-bar">
    <div class="search-container">
      <div class="search-input-wrapper">
        <el-input
          v-model="filter.username"
          placeholder="搜索账户名称..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon class="input-prefix-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="search-type-wrapper">
        <el-select
          v-model="filter.type"
          placeholder="选择类型"
          clearable
          filterable
          class="type-select"
          popper-class="custom-select-dropdown"
        >
          <template #prefix>
            <el-icon class="select-prefix-icon"><FolderOpened /></el-icon>
          </template>
          <el-option v-for="type in accountTypes" :key="type" :label="type" :value="type" />
        </el-select>
      </div>
    </div>

    <div v-if="hasFilter" class="filter-tags">
      <div class="filter-info">
        <el-icon class="filter-icon"><Filter /></el-icon>
        <span>筛选条件</span>
      </div>

      <div class="tags-wrapper">
        <el-tag
          v-if="filter.type"
          closable
          @close="clearTypeFilter"
          type="primary"
          effect="plain"
          class="filter-tag"
        >
          <template #icon><FolderOpened /></template>
          {{ filter.type }}
        </el-tag>

        <el-tag
          v-if="filter.username"
          closable
          @close="clearUsernameFilter"
          type="success"
          effect="plain"
          class="filter-tag"
        >
          <template #icon><User /></template>
          {{ filter.username }}
        </el-tag>
      </div>

      <el-button
        v-if="hasFilter"
        type="danger"
        plain
        size="small"
        @click="clearAllFilters"
        class="clear-btn"
      >
        <el-icon><Delete /></el-icon>
        清除全部
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Filter, FolderOpened, Search, User } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'
import { useAccountStore } from '../stores/account'
import type { AccountFilter } from '../types/account'

const accountStore = useAccountStore()

const filter = reactive<AccountFilter>({
  type: '',
  username: '',
})

const hasFilter = computed(() => filter.type || filter.username)

// 获取所有账户类型（去重）
const accountTypes = computed(() => {
  const types = new Set<string>()
  accountStore.accounts.forEach((account) => {
    if (account.type) {
      types.add(account.type)
    }
  })
  return Array.from(types).sort()
})

// 监听筛选条件变化，自动应用筛选
watch(
  filter,
  () => {
    updateFilter()
  },
  { deep: true },
)

const updateFilter = () => {
  accountStore.setFilter(filter)
}

const clearTypeFilter = () => {
  filter.type = ''
}

const clearUsernameFilter = () => {
  filter.username = ''
}

const clearAllFilters = () => {
  filter.type = ''
  filter.username = ''
}
</script>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.search-input-wrapper {
  flex: 1;
}

.search-type-wrapper {
  width: 180px;
}

.search-input {
  width: 100%;
}

.type-select {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset !important;
  transition: all 0.3s ease;
}

:deep(.el-select .el-input__wrapper:hover),
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset !important;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

.select-prefix-icon,
.input-prefix-icon {
  color: var(--el-color-primary);
  font-size: 16px;
  margin-right: 6px;
}

.filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.filter-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.filter-icon {
  color: var(--el-color-primary);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 28px;
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-tag .el-tag__close) {
  margin-left: 6px;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  height: 28px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
    gap: 8px;
  }

  .search-type-wrapper {
    width: 100%;
  }

  .filter-tags {
    flex-direction: column;
    align-items: flex-start;
  }

  .tags-wrapper {
    width: 100%;
    margin: 4px 0;
  }

  .clear-btn {
    margin-top: 4px;
    width: 100%;
    justify-content: center;
  }
}
</style>
