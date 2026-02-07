<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue';
import axios from 'axios';
import { Edit, Search } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import DeleteButton from '@/components/DeleteButton.vue';
import IngredientModal from '@/components/modal/IngredientModal.vue';
import { useRoute } from 'vue-router';
import { publicApi, phpApi } from '@/utils/publicApi.js';
import { parsePublicFile } from '@/utils/parseFile';

// 取得 $parseFile 全域方法
const route = useRoute();

const tableData = ref([]); // 原始總資料
const currentPage = ref(1);
const pageSize = ref(8);
const search = ref('');
const modalRef = ref(null);

// 主分類中文對照
const categoryMap = {
  'fresh-produce': '新鮮食材',
  fruits: '水果',
  'meat-poultry': '肉類/家禽',
  seafood: '海鮮',
  'dairy-eggs-soy': '乳製品/蛋/豆製品',
  'grains-pasta-bakery': '穀類/麵食/烘焙',
  'condiments-sauces-oils': '調味/醬料/油',
  'pantry-spices-nuts': '乾貨/香料/堅果',
  others: '其他'
};

const getCategoryLabel = (key) => {
  if (!key) return '';
  return categoryMap[key] || key;
};

//--------編輯-------
const handleAdd = () => {
  modalRef.value.open('add');
};

const handleEdit = (data) => {
  const {
    ingredient_id: id,
    ingredient_name: name,
    main_category: category,
    unit_name: unit,
    carbs_per_100g: carbs,
    protein_per_100g: protein,
    fat_per_100g: fat,
    kcal_per_100g: calories,
    ingredient_image_url: imageUrl,
    is_active: isActive
  } = data;

  modalRef.value.open('edit', {
    id,
    name,
    category,
    unit,
    carbs,
    protein,
    fat,
    calories,
    imageUrl,
    is_active: isActive
  });
};

const fetchData = async () => {
  try {
    // 這裡使用您封裝好的 phpApi
    const response = await phpApi.get('recipes/admin_get_ingredients.php');

    if (response.data.status === 'success') {
      tableData.value = response.data.data.map((item) => {
        const rawStatus = item.is_active ?? item.IS_ACTIVE;
        const rawId = item.ingredient_id ?? item.INGREDIENT_ID;
        const rawName = item.ingredient_name ?? item.INGREDIENT_NAME;
        const rawCategory = item.main_category ?? item.MAIN_CATEGORY;
        const fullUrl = item.full_image_url || '';

        return {
          ...item,
          ingredient_id: Number(rawId),
          is_active: Number(rawStatus) === 1 ? 1 : 0,
          ingredient_name: rawName,
          main_category: rawCategory,
          ingredient_image_url: fullUrl
        };
      });
      console.log('數據已自動重新載入');
    }
  } catch (error) {
    console.error('重新載入失敗:', error.message);
  }
};
// 判斷並處理圖片路徑
const getImageSrc = (url) => {
  // 因為 PHP 已經給了完整的 https://... 網址
  // 這裡什麼都不用做，直接回傳就好
  return url;
};

// 記得同步修改 onMounted 裡的呼叫
onMounted(() => {
  fetchData();
});

// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }

  const searchLower = search.value.toLowerCase();
  return tableData.value.filter((item) => {
    const name = item.ingredient_name ? item.ingredient_name.toLowerCase() : '';
    const categoryKey = item.main_category ? item.main_category : '';
    const categoryText = categoryKey.toLowerCase();
    const categoryLabel = getCategoryLabel(categoryKey).toLowerCase();
    const id = item.ingredient_id ? String(item.ingredient_id) : '';
    return (
      name.includes(searchLower) ||
      categoryText.includes(searchLower) ||
      categoryLabel.includes(searchLower) ||
      id.includes(searchLower)
    );
  });
});

// --- 排序邏輯 ---
const handleSortChange = ({ prop, order }) => {
  if (!order) return; // 如果沒有排序順序（取消排序），不做動作

  // 直接對原始陣列 tableData 進行排序
  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];
    // ingredients.json 沒有日期欄位，若未來有可補上

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
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

onMounted(() => {
  fetchData();
});

const handleStatusChange = async (row) => {
  console.log(
    '1. 開關被點擊了！目前資料:',
    row.ingredient_id,
    row.is_active,
    typeof row.is_active
  );
  try {
    // 直接把這個狀態送到後端
    const response = await phpApi.post('recipes/admin_update_status.php', {
      id: row.ingredient_id,
      is_active: row.is_active // 傳送 true 或 false
    });

    if (response.data.status === 'success') {
      // 可以加個簡單提示，或是什麼都不做(因為開關已經變了)
      console.log('狀態更新成功');
    } else {
      // 失敗的話，要把開關切換回來，避免畫面跟資料庫不同步
      row.is_active = !row.is_active;
      alert('更新失敗: ' + response.data.message);
    }
  } catch (error) {
    console.error('API 錯誤:', error);
    // 失敗回復狀態
    row.is_active = !row.is_active;
    alert('連線錯誤，請稍後再試');
  }
};

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
          <button class="btn h-40 btn-solid" @click="handleAdd">
            新增食材
          </button>
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
        prop="ingredient_id"
        label="食材編號"
        sortable="custom"
        align="center"
        width="120"
      />
      <el-table-column
        prop="main_category"
        label="食材分類"
        sortable="custom"
        align="center"
      >
        <template #default="scope">
          {{ getCategoryLabel(scope.row.main_category) }}
        </template>
      </el-table-column>
      <el-table-column prop="ingredient_name" label="食材名稱" align="center" />
      <!-- 新增圖片欄位 -->
      <el-table-column label="食材圖片" align="center">
        <template #default="scope">
          <img
            v-if="scope.row.ingredient_image_url"
            :src="getImageSrc(scope.row.ingredient_image_url)"
            alt="食材圖片"
            style="
              width: 48px;
              height: 48px;
              object-fit: cover;
              border-radius: 8px;
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="上/下架" align="center" width="120">
        <template #default="scope">
          <el-switch
            v-model="scope.row.is_active"
            size="large"
            inline-prompt
            active-text="上架"
            inactive-text="下架"
            style="
              --el-switch-on-color: #3e8d60;
              --el-switch-off-color: #ababab;
            "
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="詳情" align="center" width="120">
        <template #default="scope">
          <el-button link @click="handleEdit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </template>
      </el-table-column>
      <!-- <el-table-column label="刪除" align="center" width="120">
        <template #default>
          <DeleteButton />
        </template>
      </el-table-column> -->
    </el-table>

    <!-- 頁籤 -->
    <MyPagination
      v-model:currentPage="currentPage"
      :pageSize="pageSize"
      :total="filteredData.length"
    />
    <!-- <el-pagination 
        background
        v-model:current-page=currentPage
        :page-size="pageSize"
        layout="prev, pager, next, slot" 
        :total=tableData.length 
        style="margin-top: 20px; justify-content: flex-end"
      >
        <span class="p-p1" style="margin-right: 10px;">共 {{ tableData.length }} 筆資料</span>
      </el-pagination> -->
    <IngredientModal ref="modalRef" @refresh="fetchData" />
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
