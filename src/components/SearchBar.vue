<script setup>
/**
 * SearchBar 搜尋欄組件
 * 功能說明：
 * 1. 統一的搜尋輸入框，支持多個列表頁面複用
 * 2. 支持搜尋快速清空功能
 * 3. 可自定義 placeholder 文字
 */

import { computed } from 'vue';
import { Search, Close } from '@element-plus/icons-vue';

// ===== Props =====
const props = defineProps({
  // 搜尋關鍵詞（v-model）
  modelValue: {
    type: String,
    default: ''
  },
  
  // 搜尋欄 placeholder 文字
  placeholder: {
    type: String,
    default: '搜尋...'
  },
  
  // 搜尋欄寬度
  width: {
    type: String,
    default: 'auto'
  }
});

// ===== Emits =====
const emit = defineEmits(['update:modelValue', 'search', 'clear']);

// ===== 計算屬性 =====
// 雙向綁定搜尋值
const searchValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// ===== 方法 =====
/**
 * 清空搜尋欄
 * 功能：清除搜尋關鍵詞並觸發 clear 事件
 */
const handleClear = () => {
  searchValue.value = '';
  emit('clear');
};

/**
 * 搜尋事件
 * 功能：監聽 Enter 鍵或手動觸發搜尋
 */
const handleSearch = () => {
  emit('search', searchValue.value);
};
</script>

<template>
  <!-- ===== 搜尋欄容器 ===== -->
  <div class="search-bar" :style="{ width }">
    <!-- 搜尋輸入框 -->
    <el-input
      v-model="searchValue"
      :placeholder="placeholder"
      class="search-input"
      clearable
      @keyup.enter="handleSearch"
      @clear="handleClear"
    >
      <!-- 搜尋圖標 -->
      <template #prefix>
        <el-icon class="search-icon">
          <Search />
        </el-icon>
      </template>
    </el-input>
  </div>
</template>

<style lang="scss" scoped>
// ===== 搜尋欄容器 =====
.search-bar {
  width: auto;
  border: 0;
  background-color: transparent;
}

// ===== 搜尋輸入框樣式 =====
.search-input {
  width: 100%;

  // 搜尋框圓角和邊框樣式
  :deep(.el-input__wrapper) {
    border: none !important;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 0 1px #3E8D60 inset;
    padding: 0 15px;
    height: 40px;

    // 焦點時的邊框顏色
    &.is-focus {
      box-shadow: 0 0 0 2px #2E6F4A inset !important;
    }

    // Hover 時的邊框顏色
    &:hover {
      box-shadow: 0 0 0 2px #438b69 inset !important;
    }
  }

  // 搜尋圖標樣式
  :deep(.el-input__inner) {
    font-size: 14px;
  }
}

// 搜尋圖標
.search-icon {
  color: #555555;
  font-size: 18px;
  margin-right: 8px;
}

// 響應式設計
@media (max-width: 768px) {
  .search-input {
    :deep(.el-input__wrapper) {
      height: 36px;
      padding: 0 12px;
    }
  }
}
</style>
