<script setup lang="ts">
import AccountManager from './components/AccountManager.vue'
</script>

<template>
  <AccountManager />
</template>

<style>
:root {
  /* 主题色彩 */
  --el-color-primary: #409eff;
  --el-color-primary-light-3: #79bbff;
  --el-color-primary-light-5: #a0cfff;
  --el-color-primary-light-7: #c6e2ff;
  --el-color-primary-light-8: #d9ecff;
  --el-color-primary-light-9: #ecf5ff;
  --el-color-primary-dark-2: #337ecc;
  --el-color-primary-rgb: 64, 158, 255;

  /* 功能色彩 */
  --el-color-success: #67c23a;
  --el-color-success-light-3: #95d475;
  --el-color-success-light-5: #b3e19d;
  --el-color-success-light-7: #d1edc4;
  --el-color-success-light-8: #e1f3d8;
  --el-color-success-light-9: #f0f9eb;
  --el-color-success-dark-2: #529b2e;
  --el-color-success-rgb: 103, 194, 58;

  --el-color-warning: #e6a23c;
  --el-color-warning-light-3: #eebe77;
  --el-color-warning-light-5: #f3d19e;
  --el-color-warning-light-7: #f8e3c5;
  --el-color-warning-light-8: #faecd8;
  --el-color-warning-light-9: #fdf6ec;
  --el-color-warning-dark-2: #b88230;
  --el-color-warning-rgb: 230, 162, 60;

  --el-color-danger: #f56c6c;
  --el-color-danger-light-3: #f89898;
  --el-color-danger-light-5: #fab6b6;
  --el-color-danger-light-7: #fcd3d3;
  --el-color-danger-light-8: #fde2e2;
  --el-color-danger-light-9: #fef0f0;
  --el-color-danger-dark-2: #c45656;
  --el-color-danger-rgb: 245, 108, 108;

  --el-color-info: #909399;
  --el-color-info-light-3: #b1b3b8;
  --el-color-info-light-5: #c8c9cc;
  --el-color-info-light-7: #dedfe0;
  --el-color-info-light-8: #e9e9eb;
  --el-color-info-light-9: #f4f4f5;
  --el-color-info-dark-2: #73767a;
  --el-color-info-rgb: 144, 147, 153;

  /* 中性色彩 */
  --el-bg-color: #ffffff;
  --el-bg-color-page: #f2f3f5;
  --el-bg-color-overlay: #ffffff;
  --el-text-color-primary: #303133;
  --el-text-color-regular: #606266;
  --el-text-color-secondary: #909399;
  --el-text-color-placeholder: #a8abb2;
  --el-text-color-disabled: #c0c4cc;
  --el-border-color: #dcdfe6;
  --el-border-color-light: #e4e7ed;
  --el-border-color-lighter: #ebeef5;
  --el-border-color-extra-light: #f2f6fc;
  --el-border-color-dark: #d4d7de;
  --el-border-color-darker: #cdd0d6;
  --el-fill-color: #f0f2f5;
  --el-fill-color-light: #f5f7fa;
  --el-fill-color-lighter: #fafafa;
  --el-fill-color-blank: #ffffff;

  /* 边框圆角 */
  --el-border-radius-base: 4px;
  --el-border-radius-small: 2px;
  --el-border-radius-round: 20px;
  --el-border-radius-circle: 100%;

  /* 字体大小 */
  --el-font-size-extra-large: 20px;
  --el-font-size-large: 18px;
  --el-font-size-medium: 16px;
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  --el-font-size-extra-small: 12px;

  /* 字体粗细 */
  --el-font-weight-primary: 500;
  --el-font-weight-secondary: 400;
  --el-font-line-height-primary: 24px;

  /* 阴影 */
  --el-box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  --el-box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  --el-box-shadow-dark: 0 2px 16px 0 rgba(0, 0, 0, 0.12);
  --el-box-shadow-lighter: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  background-color: var(--el-bg-color-page);
  transition: all 0.3s ease;
}

/* 暗色模式 */
html.dark {
  --el-bg-color: #1f2228;
  --el-bg-color-page: #121212;
  --el-bg-color-overlay: #1d1e1f;
  --el-text-color-primary: #e5eaf3;
  --el-text-color-regular: #cfd3dc;
  --el-text-color-secondary: #a3a6ad;
  --el-text-color-placeholder: #8d9095;
  --el-text-color-disabled: #6c6e72;
  --el-border-color: #414243;
  --el-border-color-light: #363738;
  --el-border-color-lighter: #2e2e30;
  --el-border-color-extra-light: #2a2a2c;
  --el-border-color-dark: #4c4d4f;
  --el-border-color-darker: #5a5a5c;
  --el-fill-color: #1d1e20;
  --el-fill-color-light: #242529;
  --el-fill-color-lighter: #2c2d30;
  --el-fill-color-blank: #1f2228;
  --el-color-primary-light-9: #283142;
  --el-bg-color-overlay: #282e35;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-light);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-dark);
}

/* 元素统一样式 */
.el-button {
  border-radius: 6px;
  font-weight: var(--el-font-weight-primary);
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.el-input__wrapper {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.el-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  box-shadow: var(--el-box-shadow-light);
}

.el-card:hover {
  box-shadow: var(--el-box-shadow);
}

/* 响应式布局 */
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  :root {
    --el-font-size-base: 13px;
  }

  .el-dialog {
    width: 92% !important;
    max-width: 450px;
    margin: 10px auto;
  }

  .el-message {
    min-width: auto !important;
    width: 90% !important;
  }
}
</style>
