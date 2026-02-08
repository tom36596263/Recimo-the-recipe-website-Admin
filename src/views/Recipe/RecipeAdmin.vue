<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';

import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import DeleteButton from '@/components/DeleteButton.vue';

const route = useRoute();
const router = useRouter();

const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const search = ref('')


const loadDataFromPhp = async () => {
  
  try {
    const response = await phpApi.get('recipes/all_recipe_get.php', {
      params: { mode: 'admin' } // 💡 告訴後端：我是管理員，我要看全部
    });
    console.log('後台載入成功', response.data);
    tableData.value = response.data.data;
  } catch (error) {
    console.error('後台載入失敗', error);
  }
}
// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }
  
  const searchLower = search.value.toLowerCase();
  return tableData.value.filter(item => {
    // const title = item.recipe_title ? item.recipe_title.toLowerCase() : '';
    // const id = item.recipe_id ? String(item.recipe_id) : '';
    // return title.includes(searchLower) || id.includes(searchLower);
    const title = item.recipe_title ? item.recipe_title.toLowerCase() : '';
    const adaptTitle = item.adaptation_title ? item.adaptation_title.toLowerCase() : '';
    const id = item.recipe_id ? String(item.recipe_id) : '';

    return title.includes(searchLower) || 
          adaptTitle.includes(searchLower) || // 增加這一行
          id.includes(searchLower);
  });
});

// --- 排序邏輯 ---
const handleSortChange = ({ prop, order }) => {
  if (!order) return; // 如果沒有排序順序（取消排序），不做動作

  // 直接對原始陣列 tableData 進行排序
  tableData.value.sort((a, b) => {
    // 這裡要根據 recipes.json 的欄位名稱做對應
    // 例如 prop 可能是 'recipe_id', 'recipe_title' 等
    let valA = a[prop];
    let valB = b[prop];
    // 🏆 增加這一段：如果排序的是食譜名稱，優先取改編標題
    if (prop === 'recipe_title') {
      valA = a.adaptation_title || a.recipe_title;
      valB = b.adaptation_title || b.recipe_title;
    }
    // 若是日期欄位
    if (prop === 'recipe_created_at' || prop === 'recipe_last_updated') {
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

onMounted(() => {
  loadDataFromPhp()
})

const handleStatusChange = async (row) => {
  try {
    // 💡 確保傳送的資料格式與 PHP 接收的一致
    const response = await phpApi.post('recipes/update_status.php', {
      recipe_id: row.recipe_id,
      status: row.status
    });

    if (response.data.status === 'success') {
      ElMessage({
        message: `食譜 ID: ${row.recipe_id} 狀態已更新為 ${row.status === 0 ? '公開' : '下架'}`,
        type: 'success',
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('更新失敗:', error);
    // 💡 發生錯誤時，將開關狀態彈回原本的樣子
    row.status = row.status === 0 ? 2 : 0; 
    
    ElMessage({
      message: '狀態更新失敗，請檢查網路連線或後端設定',
      type: 'error',
    });
  }
};

// 跳轉到食譜編輯頁面
const goToDetail = (recipeId) => {
  router.push({
    path: '/admin/recipes/increase',
    query: { editId: recipeId }
  });
};

</script>

<template>
  <div>
    <!-- 內容區頂部 -->
      <div class="content-header">
        <div class="content-title">
          <h2 class="zh-h2">{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <routerLink to="/admin/recipes/ingredient" style="width: 160px">
            <button class="btn h-40 btn-solid">新增食譜</button>
          </routerLink>
          <SearchBar
            v-model="search"
            placeholder="搜尋..."
            width="300px"
          />
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        :data="displayData" 
        @sort-change="handleSortChange"
        style="width: 100%" 
        stripe 
        :header-cell-style="{backgroundColor: '#F1F6EF' , color:'#000', fontWeight: 'normal'}"
      >

        <el-table-column prop="recipe_id" label="食譜編號" sortable="custom" align="center" width="180"/>
        <!-- <el-table-column prop="category" label="食譜分類" sortable="custom" align="center"/> -->
        <!-- <el-table-column prop="recipe_title" label="食譜名稱" align="center"/> -->
        <el-table-column label="食譜名稱" align="center">
          <template #default="scope">
            {{ scope.row.adaptation_title || scope.row.recipe_title }}
          </template>
        </el-table-column>

        <el-table-column label="公開狀態" align="center" width="120">
          <template #default="scope">
            <el-switch 
            v-model="scope.row.status" 
            :active-value="0" 
            :inactive-value="2"
            size="large" 
            class="ml-2" 
            inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" 
            active-text="公開" 
            inactive-text="不公開"
            @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>

        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <el-icon @click="goToDetail(scope.row.recipe_id)" style="cursor: pointer; color: #555;">
              <Edit />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="刪除" align="center" width="120">
          <template #default="scope">
            <DeleteButton 
            :recipe-id="scope.row.recipe_id" 
            @deleted="loadDataFromPhp"/>
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

  
  

  /* 容器寬度設定（參考圖片 307px） */
.custom-search-container {
  width: 307px;
}

:deep(.rounded-search .el-input__wrapper) {
  border-radius: 20px;          /* 高度 40px 的一半，達成全圓角 */
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #3E8D60 inset; /* 預設邊框顏色 */
  padding: 0 15px;
  height: 40px;                 /* 參考圖片高度 */
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