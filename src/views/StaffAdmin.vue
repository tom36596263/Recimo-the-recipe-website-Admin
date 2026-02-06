<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit, Search } from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import StaffAdminModal from '@/components/modal/StaffAdminModal.vue';
import { useRoute } from 'vue-router';
//要引用json的檔案一定要import以下這行
import { phpApi } from '@/utils/publicApi.js';
import { ElMessage } from 'element-plus';

const route = useRoute();

const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const modalRef = ref(null)
const search = ref('')



//--------新增 編輯-------
const handleAdd = () => {
  modalRef.value.open('add')
}

//-------------彈窗功能-----------
const showDetail = (data) => {
  modalRef.value.open('edit', data)
}

// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }

  const searchLower = search.value.toLowerCase();
  return tableData.value.filter(item => {
    const name = item.admin_name ? item.admin_name.toLowerCase() : '';
    const account = item.admin_account ? item.admin_account.toLowerCase() : '';
    const id = item.admin_id ? String(item.admin_id) : '';

    return name.includes(searchLower) ||
      account.includes(searchLower) ||
      id.includes(searchLower);
  });
});

//--------取資料-------
const loadJsonData = async () => {
  try {
    const response = await phpApi.get('others/admin_get.php')
    // 確保 admin_level 為數字類型，避免字串導致 switch 異常
    tableData.value = response.data.map(item => ({
      ...item,
      admin_level: Number(item.admin_level)
    }))
  } catch (error) {
    console.error('抓取 JSON 失敗:', error.message)
  }
}

// --- 排序邏輯 -------------
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

// 顯示資料依然是計算出來的（會隨著 tableData 排序而變動）
const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

//-------掛載調用-------
onMounted(() => {
  loadJsonData()
})

//-------switch------
const handleStatusChange = async (row) => {
  // 主要管理員不可切換
  if (row.admin_level === 2) return;
  
  // 保存舊值，以便失敗時還原
  const oldLevel = row.admin_level === 1 ? 0 : 1;
  
  try {
    await phpApi.patch('others/admin_status.php', {
      admin_id: row.admin_id,
      admin_level: Number(row.admin_level), // 確保傳送數字類型
    });
    ElMessage.success('狀態已更新');
    // 成功後重新加載以確保數據同步
    await loadJsonData();
  } catch (e) {
    ElMessage.error('狀態更新失敗: ' + (e?.response?.data || e.message));
    // 若失敗，還原數值
    row.admin_level = oldLevel;
  }
};


</script>

<template>
  <div>
    <!-- 內容區頂部 -->
    <div class="content-header">
      <div class="content-title">
        <h2 class="zh-h2">{{ route.meta.title }}</h2>
      </div>


      <div class="content-header-function">
        <div style="width: 160px">
          <button class="btn h-40 btn-solid" @click="handleAdd">新增人員</button>
        </div>
        <SearchBar v-model="search" placeholder="搜尋..." width="300px" />
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="displayData" @sort-change="handleSortChange" style="width: 100%" stripe
      :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
      <el-table-column prop="admin_id" label="管理員編號" sortable="custom" align="center" width="180" />
      <el-table-column prop="admin_name" label="名稱" sortable="custom" align="center" />
      <el-table-column prop="admin_account" label="帳號" align="center" />

      <el-table-column label="人員狀態" align="center" width="120">
        <template #default="scope">
          <span v-if="scope.row.admin_level === 2">主要管理員</span>
          <el-switch
            v-else
            v-model="scope.row.admin_level"
            :active-value="1"
            :inactive-value="0"
            :disabled="scope.row.admin_level === 2"
            size="large"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB"
            active-text="啟用"
            inactive-text="停權"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="詳情" align="center" width="120">
        <template #default="scope">
          <el-button link @click="showDetail(scope.row)">
            <el-icon>
              <Edit />
            </el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>


    <!-- 頁籤 -->
    <MyPagination v-model:currentPage="currentPage" :pageSize="pageSize" :total="filteredData.length" />

    <StaffAdminModal ref="modalRef" @updated="loadJsonData" />
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




/* 容器寬度設定（參考圖片 307px） */
.custom-search-container {
  width: 307px;
}

:deep(.rounded-search .el-input__wrapper) {
  border-radius: 20px;
  /* 高度 40px 的一半，達成全圓角 */
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #3E8D60 inset;
  /* 預設邊框顏色 */
  padding: 0 15px;
  height: 40px;
  /* 參考圖片高度 */
}

/* 滑鼠移入或選取時的邊框顏色保持一致或稍微加深 */
// :deep(.rounded-search .el-input__wrapper:hover),
:deep(.rounded-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #2E6F4A inset !important;
}

/* 調整搜尋圖標顏色與位置 */
.search-icon {
  color: #555555;
  font-size: 18px;
  margin-right: 8px;
}

/* 調整 Placeholder 字體顏色 */
:deep(.rounded-search .el-input__inner::placeholder) {
  color: #4a8b6f;
  opacity: 0.8;
}
</style>