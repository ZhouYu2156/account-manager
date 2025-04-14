<template>
  <div class="account-form">
    <el-form
      :model="accountForm"
      :rules="rules"
      ref="formRef"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="类型" prop="type">
        <el-autocomplete
          v-model="accountForm.type"
          :fetch-suggestions="queryTypeSearch"
          clearable
          placeholder="请输入账户类型"
          class="form-input"
        >
          <template #prefix>
            <el-icon><Folder /></el-icon>
          </template>
        </el-autocomplete>
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="accountForm.username"
          placeholder="请输入用户名"
          clearable
          class="form-input"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <div class="password-input-container">
          <el-input
            v-model="accountForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
            clearable
            class="form-input"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
          <div class="password-actions">
            <el-tooltip content="随机生成密码" placement="top" :effect="theme">
              <el-button
                type="primary"
                circle
                size="small"
                :icon="Refresh"
                @click="generatePassword"
              />
            </el-tooltip>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="accountForm.description"
          type="textarea"
          placeholder="请输入账户描述信息（可选）"
          :rows="3"
          clearable
          resize="none"
          class="form-input"
        >
        </el-input>
      </el-form-item>

      <!-- 隐藏的提交按钮，用于外部触发 -->
      <button type="submit" style="display: none" id="form-submit-button"></button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { Folder, Lock, Refresh, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAccountStore } from '../stores/account'
import { useSettingsStore } from '../stores/settings'
import type { Account, AccountInput } from '../types/account'
import { generateRandomPassword } from '../utils/crypto'

const props = defineProps<{
  account?: Account
  editMode?: boolean
}>()

const emit = defineEmits(['submit'])
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const formRef = ref<FormInstance>()

const theme = ref(settingsStore.theme)

// 表单数据
const accountForm = reactive({
  type: '',
  username: '',
  password: '',
  description: '',
})

// 表单验证规则
const rules: FormRules = {
  type: [{ required: true, message: '请输入账户类型', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
  ],
}

// 随机生成密码
const generatePassword = () => {
  accountForm.password = generateRandomPassword(12, true)
}

// 用于类型输入框自动建议的查询方法
const queryTypeSearch = (queryString: string, callback: (results: any[]) => void) => {
  const allTypes = new Set<string>()
  accountStore.accounts.forEach((account) => {
    if (account.type) allTypes.add(account.type)
  })

  const types = Array.from(allTypes)
  const results = queryString
    ? types.filter((type) => type.toLowerCase().includes(queryString.toLowerCase()))
    : types

  // 返回结果格式
  callback(results.map((type) => ({ value: type })))
}

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      // 检查密码是否为空
      if (!accountForm.password) {
        ElMessage.error('密码不能为空')
        return
      }

      // 准备提交的数据
      const formData: AccountInput = {
        type: accountForm.type,
        username: accountForm.username,
        description: accountForm.description,
        password: accountForm.password,
      }

      // 编辑模式
      if (props.editMode && props.account) {
        accountStore.updateAccount(props.account.id, formData)
        ElMessage.success('账户更新成功')
      } else {
        // 添加模式
        try {
          accountStore.addAccount(formData)
          ElMessage.success('账户添加成功')
        } catch (error) {
          ElMessage.error(error instanceof Error ? error.message : '账户添加失败')
          return
        }
      }

      emit('submit')
    }
  })
}

// 初始化表单数据
onMounted(() => {
  if (props.account) {
    accountForm.type = props.account.type
    accountForm.username = props.account.username
    accountForm.description = props.account.description || ''

    // 解密密码
    try {
      accountForm.password = accountStore.decryptPassword(props.account.password)
    } catch (e) {
      accountForm.password = ''
      ElMessage.error('密码解密失败')
    }
  }
})

// 监听主题变化
watch(
  () => settingsStore.theme,
  (newTheme) => {
    theme.value = newTheme
  },
)
</script>

<style scoped>
.account-form {
  padding: 10px 20px;
}

.form-input {
  width: 100%;
}

.password-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-actions {
  display: flex;
  gap: 4px;
}
</style>
