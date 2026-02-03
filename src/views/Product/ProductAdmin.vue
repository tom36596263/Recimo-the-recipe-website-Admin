<script setup>
import { ref, onMounted, computed } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute } from 'vue-router';
import { phpApi } from '@/utils/publicApi'; // 確保路徑正確
import { ElMessage } from 'element-plus';

const route = useRoute();

const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const search = ref('');

// --- 1. 搜尋邏輯 ---
const filteredData = computed(() => {
  if (!search.value) return tableData.value;
  const searchLower = search.value.toLowerCase();
  return tableData.value.filter((item) => {
    const name = item.product_name ? item.product_name.toLowerCase() : '';
    const cat = item.product_category
      ? item.product_category.toLowerCase()
      : '';
    const id = item.product_id ? String(item.product_id) : '';
    return (
      name.includes(searchLower) ||
      cat.includes(searchLower) ||
      id.includes(searchLower)
    );
  });
});

// --- 2. 分頁顯示邏輯 (修正缺失的 displayData) ---
const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// --- 3. 載入 PHP 資料 ---
const loadPhpData = async () => {
  try {
    // 【關鍵修正】請確認後端 action 參數，這裡補上 ?action=read
    const response = await phpApi.get(
      'mall/admin_products_api.php?action=read'
    );

    // 檢查回傳是否為陣列，若不是則嘗試取 response.data.data (視乎你 PHP 封裝習慣)
    const rawData = Array.isArray(response.data)
      ? response.data
      : response.data.data;

    if (!rawData) throw new Error('回傳格式非陣列');

    tableData.value = rawData.map((item) => ({
      ...item,
      // 根據你 PHP 結構：release 狀態在 tags 內
      STATUS: Number(item.tags?.product_release) === 1,
      IS_HOT: Number(item.tags?.product_is_hot) === 1
    }));

    console.log('資料載入成功:', tableData.value);
  } catch (error) {
    console.error('抓取 PHP 失敗:', error.message);
    ElMessage.error('資料載入失敗: ' + error.message);
  }
};

// --- 4. 排序邏輯 (修正缺失的 handleSortChange) ---
const handleSortChange = ({ prop, order }) => {
  if (!order) return;
  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    // 特殊處理：針對狀態排序
    if (prop === 'product_release') {
      valA = a.tags?.product_release || 0;
      valB = b.tags?.product_release || 0;
    }

    if (order === 'ascending') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });
  currentPage.value = 1;
};

// --- 5. 上下架切換 ---
const handleStatusChange = async (row) => {
  try {
    // 💡 改成直接傳物件，不要用 FormData
    const response = await phpApi.post(
      'mall/admin_products_api.php?action=update',
      {
        product_id: row.product_id,
        product_release: row.STATUS ? 1 : 0
      }
    );

    if (response.data.status === 'success') {
      ElMessage.success(`${row.product_name} 狀態更新成功`);
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    row.STATUS = !row.STATUS; // 失敗時回滾
    console.error('更新失敗:', error);
    ElMessage.error(
      '更新失敗: ' + (error.response?.data?.message || error.message)
    );
  }
};

// // --- 6. 熱銷商品切換 (新增) ---
const handleHotChange = async (row) => {
  try {
    await phpApi.post('mall/admin_products_api.php?action=update', {
      product_id: row.product_id,
      // 💡 這裡一定要叫 product_is_hot，因為你的 PHP 是寫 isset($data['product_is_hot'])
      product_is_hot: row.IS_HOT
    });
    ElMessage.success('更新成功');
  } catch (error) {
    row.IS_HOT = !row.IS_HOT; // 失敗才恢復原狀
  }
};
onMounted(() => {
  loadPhpData();
});
// const handleCurrentChange = (val) => {
//   console.log(val);

//   currentPage.value = val
// }
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
          <router-link to="/admin/products/add">
            <button class="btn h-40 btn-solid">新增商品</button>
          </router-link>
        </div>
        <SearchBar v-model="search" placeholder="搜尋..." width="300px" />
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      :data="displayData"
      @sort-change="handleSortChange"
      style="width: 100%"
      stripe
      :header-cell-style="{
        backgroundColor: '#F1F6EF',
        color: '#000',
        fontWeight: 'normal'
      }"
    >
      <el-table-column
        prop="product_id"
        label="商品編號"
        sortable="custom"
        align="center"
        width="180"
      />
      <el-table-column
        prop="product_category"
        label="商品類型"
        sortable="custom"
        align="center"
      />
      <el-table-column prop="product_name" label="商品名稱" align="center" />

      <el-table-column label="熱銷設定" align="center" width="120">
        <template #default="scope">
          <el-switch
            v-model="scope.row.IS_HOT"
            size="large"
            class="ml-2"
            inline-prompt
            style="
              --el-switch-on-color: #ff4949;
              --el-switch-off-color: #ababab;
            "
            active-text="熱銷"
            inactive-text="一般"
            @change="handleHotChange(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column
        prop="product_release"
        label="上/下架"
        align="center"
        width="120"
      >
        <template #default="scope">
          <el-switch
            v-model="scope.row.STATUS"
            size="large"
            class="ml-2"
            inline-prompt
            style="
              --el-switch-on-color: #3e8d60;
              --el-switch-off-color: #ababab;
            "
            active-text="上架"
            inactive-text="下架"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="詳情" align="center" width="120">
        <template #default="scope">
          <router-link
            :to="`/admin/products/${scope.row.product_id}`"
            style="color: #555"
          >
            <el-icon><Edit /></el-icon>
          </router-link>
        </template>
      </el-table-column>
    </el-table>

    <!-- 頁籤 -->
    <MyPagination
      v-model:currentPage="currentPage"
      :pageSize="pageSize"
      :total="filteredData.length"
    />
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
  border-radius: 20px; /* 高度 40px 的一半，達成全圓角 */
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #3e8d60 inset; /* 預設邊框顏色 */
  padding: 0 15px;
  height: 40px; /* 參考圖片高度 */
}

/* 滑鼠移入或選取時的邊框顏色保持一致或稍微加深 */
// :deep(.rounded-search .el-input__wrapper:hover),
:deep(.rounded-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #2e6f4a inset !important;
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
