<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 8
  },
  total: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:currentPage', 'change']);

const handleCurrentChange = (val) => {
  emit('update:currentPage', val);
//   emit('change', val);
};
</script>

<template>
  <el-pagination 
    background
    :current-page="currentPage"
    :page-size="pageSize"
    layout="prev, pager, next, slot" 
    :total="total" 
    @current-change="handleCurrentChange"
    style="margin-top: 20px; justify-content: flex-end"
  >
    <span class="p-p1" style="margin-right: 10px;">共 {{ total }} 筆資料</span>
  </el-pagination>
</template>

<style lang="scss" scoped>
.el-pagination {
  --el-pagination-hover-color: #ff9900;
  --el-pagination-button-bg-color: #f4f4f4;
  --el-color-primary: #3E8D60;
  --el-pagination-button-color: #3E8D60;
  margin-bottom: 20px;
}
</style>