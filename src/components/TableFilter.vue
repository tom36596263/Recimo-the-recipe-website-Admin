<script setup>
/**
 * TableFilter 篩選組件
 * 功能說明：
 * 1. 統一的篩選下拉框，支持多個列表頁面複用
 * 2. 支持自定義選項和佔位符
 * 3. 支持 v-model 雙向綁定
 */

import { computed } from 'vue';

// ===== Props =====
const props = defineProps({
  // 篩選值（v-model）
  modelValue: {
    type: String,
    default: ''
  },
  
  // 篩選選項（標籤-值對應）
  options: {
    type: Array,
    required: true,
    // 例如：[
    //   { label: '全部', value: '' },
    //   { label: '蔬菜', value: 'vegetable' },
    //   { label: '肉類', value: 'meat' }
    // ]
    validator: (val) => {
      return val.every(item => 'label' in item && 'value' in item);
    }
  },
  
  // 下拉框佔位符
  placeholder: {
    type: String,
    default: '請選擇'
  },
  
  // 下拉框寬度
  width: {
    type: String,
    default: '150px'
  },
  
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  }
});

// ===== Emits =====
const emit = defineEmits(['update:modelValue', 'change']);

// ===== 計算屬性 =====
// 雙向綁定篩選值
const filterValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
    emit('change', val);
  }
});
</script>

<template>
  <!-- ===== 篩選下拉框 ===== -->
  <el-select
    v-model="filterValue"
    :placeholder="placeholder"
    :style="{ width }"
    :clearable="clearable"
    class="table-filter"
  >
    <!-- 篩選選項 -->
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>

<style lang="scss" scoped>
// ===== 篩選下拉框樣式 =====
.table-filter {
  // 下拉框寬度由 prop 控制

  // 下拉框輸入框樣式
  :deep(.el-input__wrapper) {
    border-radius: 4px;
    height: 40px;
  }

  // 選中狀態樣式
  :deep(.el-input.is-focus .el-input__wrapper) {
    box-shadow: 0 0 0 1px #438b69 inset;
  }

  // Hover 狀態樣式
  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #438b69 inset;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .table-filter {
    :deep(.el-input__wrapper) {
      height: 36px;
      font-size: 13px;
    }
  }
}
</style>
