<script setup>
// ===== 導入 =====
import { ref, onMounted, computed } from 'vue';
import { Edit, Search, Delete } from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue'; // 搜尋欄組件
import DeleteButton from '@/components/DeleteButton.vue';
import { useRoute } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';
import { phpApi } from '@/utils/publicApi.js';
import { ElMessage } from 'element-plus';

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
    const title = item.faq_title ? item.faq_title.toLowerCase() : '';
    const type = item.faq_type ? item.faq_type.toLowerCase() : '';
    const id = item.faq_id ? String(item.faq_id) : '';
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

// ===== 數據加載（串接後端） =====
const loadFaqs = async () => {
  try {
    const response = await phpApi.get('/system/faqs.php');
    if (response.data && response.data.success) {
      tableData.value = response.data.faqs.sort((a, b) => a.faq_id - b.faq_id);
    } else {
      tableData.value = [];
      console.error('FAQ 載入失敗', response.data?.message);
    }
  } catch (error) {
    tableData.value = [];
    console.error('FAQ 載入失敗:', error.message);
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

// 刪除 FAQ
const handleDelete = async (row) => {
  try {
    const params = new URLSearchParams();
    params.append('faq_id', row.faq_id);
    const res = await phpApi.delete('/system/faqs.php', { data: params });
    if (res.data && res.data.success) {
      ElMessage.success('刪除成功');
      await loadFaqs();
    } else {
      ElMessage.error(res.data?.message || '刪除失敗');
    }
  } catch (e) {
    ElMessage.error('刪除失敗，請稍後再試');
  }
};

// ===== 生命週期 =====
onMounted(() => {
  loadFaqs()
})


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
        <SearchBar v-model="search" placeholder="搜尋..." width="300px" />
      </div>
    </div>

    <!-- ===== 表格 ===== -->

    <el-table :data="displayData" @sort-change="handleSortChange" style="width: 100%" stripe
      :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
      <el-table-column prop="faq_id" label="編號" sortable="custom" align="center" width="180" />
      <el-table-column prop="faq_type" label="問題分類" sortable="custom" align="center" />
      <el-table-column prop="faq_title" label="問題標題" align="center" />



      <el-table-column label="編輯" align="center" width="120">
        <template #default="scope">
          <router-link :to="`/admin/faqs/${scope.row.faq_id}`" style="color: #555;">
            <el-icon>
              <Edit />
            </el-icon>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="刪除" align="center" width="120">
        <template #default="scope">
          <DeleteButton :onDelete="() => handleDelete(scope.row)" />
        </template>
      </el-table-column>

    </el-table>


    <!-- ===== 分頁 ===== -->
    <MyPagination v-model:currentPage="currentPage" :pageSize="pageSize" :total="filteredData.length" />
  </div>
</template>

<style lang="scss" scoped>
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 20px;

  .content-title {
    display: flex;
    align-items: end;
    gap: 20px;
  }

  .content-header-function {
    display: flex;
    gap: 20px;
  }
}
</style>
<style lang="scss" scoped>
// 設定 el-table 每一列高度為 56px
::v-deep(.el-table__body .el-table__row) {
  min-height: 56px;
  height: 56px;
  line-height: 56px;
}
</style>
