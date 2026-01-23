<script setup>
// ===== 導入 =====
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit, Search, Delete } from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue'; // 搜尋欄組件

import DeleteButton from '@/components/DeleteButton.vue';
import { useRoute } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';

const route = useRoute();

// ===== 狀態管理 =====
const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const search = ref('')

// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }
  
  const searchLower = search.value.toLowerCase();
  return tableData.value.filter(item => {
    const title = item.FAQ_TITLE ? item.FAQ_TITLE.toLowerCase() : '';
    const type = item.FAQ_TYPE ? item.FAQ_TYPE.toLowerCase() : '';
    const id = item.FAQ_ID ? String(item.FAQ_ID) : '';
    
    return title.includes(searchLower) || 
           type.includes(searchLower) || 
           id.includes(searchLower);
  });
});

// 顯示資料依然是計算出來的（會隨著 tableData 排序而變動）
const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// ===== 數據加載 =====
const loadJsonData = async () => {
  try {
    const response = await publicApi.get('data/others/faqs.json')
    tableData.value = response.data
  } catch (error) {
    console.error('抓取 JSON 失敗:', error.message)
  }
}

// ===== 排序邏輯 =====
/**
 * 表格排序處理
 * 功能說明：
 * 1. 監聽表格排序變化
 * 2. 對原始數據進行排序
 * 3. 排序後重置到第一頁
 */
const handleSortChange = ({ prop, order }) => {
  if (!order) return; // 如果沒有排序順序（取消排序），不做動作

  // 直接對原始陣列 tableData 進行排序
  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    // 如果是日期格式，需要轉成 Date 物件才能正確比較
    if (prop === 'USER_STARTDATE') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (order === 'ascending') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  // 排序完建議回到第一頁
  currentPage.value = 1;
};

// ===== 生命週期 =====
onMounted(() => {
  loadJsonData()
})

const handleStatusChange = (row) => {
  //暫無改動資料狀態功能
  console.log('當前這筆資料的 ID:', row.FAQ_ID);
};
</script>

<template>
  <div>
    <!-- ===== 內容區頂部 ===== -->
    <div class="content-header">
      <!-- 左側：標題 -->
      <div class="content-title">
        <h2 class="zh-h2">{{ route.meta.title }}</h2>
      </div>

      <!-- 右側：新增按鈕和搜尋組件 -->
      <div class="content-header-function">
        <router-link to="/admin/faqs/add" style="width: 160px">
          <button class="btn h-40 btn-solid">新增問題</button>
        </router-link>
        <!-- 使用 SearchBar 組件替代原來的 el-input -->
        <SearchBar
          v-model="search"
          placeholder="搜尋..."
          width="300px"
        />
      </div>
    </div>

    <!-- ===== 表格 ===== -->
    <el-table 
      :data="displayData" 
      @sort-change="handleSortChange"
      style="width: 100%" 
      stripe 
      :header-cell-style="{backgroundColor: '#F1F6EF' , color:'#000', fontWeight: 'normal'}"
    >
      <el-table-column prop="FAQ_ID" label="編號" sortable="custom" align="center" width="180"/>
      <el-table-column prop="FAQ_TYPE" label="問題分類" sortable="custom" align="center"/>
      <el-table-column prop="FAQ_TITLE" label="問題標題" align="center"/>

      <el-table-column label="上/下架" align="center" width="120">
        <template #default="scope">
          <el-switch 
          v-model="scope.row.FAQ_STATUS" 
          size="large" 
          class="ml-2" 
          inline-prompt
          style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" 
          active-text="上架" 
          inactive-text="下架"
          @change="handleStatusChange(scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="編輯" align="center" width="120">
        <template #default="scope">
          <router-link :to="`/admin/faqs/${scope.row.FAQ_ID}`" style="color: #555;">
              <el-icon><Edit /></el-icon>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="刪除" align="center" width="120">
        <template #default>
          <DeleteButton/>
        </template>
      </el-table-column>
    </el-table>


    <!-- ===== 分頁 ===== -->
    <MyPagination 
      v-model:currentPage="currentPage" 
      :pageSize="pageSize" 
      :total="filteredData.length"
    />
  </div>
</template>

<style lang="scss" scoped>
  .content-header{
    display: flex;
    justify-content: space-between;
    align-items: end;
    margin-bottom: 20px;
    .content-title{
      display: flex;
      align-items: end;
      gap: 20px;
    }
    .content-header-function{
      display: flex;
      gap: 20px;
    }
  }
</style>
