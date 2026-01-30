<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue';
import axios from 'axios';
import { Edit ,Search} from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import DeleteButton from '@/components/DeleteButton.vue';
import IngredientModal from '@/components/modal/IngredientModal.vue';
import { useRoute } from 'vue-router';
//要引用json的檔案一定要import以下這行
import { publicApi } from '@/utils/publicApi.js';
import { parsePublicFile } from '@/utils/parseFile';

// 取得 $parseFile 全域方法
const route = useRoute();


const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const search = ref('')
const modalRef = ref(null)

// 主分類中文對照
const categoryMap = {
  'fresh-produce': '新鮮食材',
  'fruits': '水果',
  'meat-poultry': '肉類/家禽',
  'seafood': '海鮮',
  'dairy-eggs-soy': '乳製品/蛋/豆製品',
  'grains-pasta-bakery': '穀類/麵食/烘焙',
  'condiments-sauces-oils': '調味/醬料/油',
  'pantry-spices-nuts': '乾貨/香料/堅果',
  'others': '其他'
}

const getCategoryLabel = (key) => {
  if (!key) return ''
  return categoryMap[key] || key
}

//--------編輯-------
const handleAdd = () => {
  modalRef.value.open('add')
}

const handleEdit = (data) => {
  const { ingredient_id:id,
    ingredient_name:name,
    main_category:category,
    unit_name:unit,
    carbs_per_100g:carbs,
    protein_per_100g:protein,
    fat_per_100g:fat,
    kcal_per_100g:calories,
    ingredient_image_url:imageUrl
  } = data
  modalRef.value.open('edit', {
    id,
    name,
    category,
    unit,
    carbs,
    protein,
    fat,
    calories,
    imageUrl
  })
}



const loadJsonData = async () => {
  try {
    const response = await publicApi.get('data/recipe/ingredients.json')
    tableData.value = response.data
  } catch (error) {
    console.error('抓取 JSON 失敗:', error.message)
  }
}

// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }
  
  const searchLower = search.value.toLowerCase();
  return tableData.value.filter(item => {
    const name = item.ingredient_name ? item.ingredient_name.toLowerCase() : '';
    const categoryKey = item.main_category ? item.main_category : '';
    const categoryText = categoryKey.toLowerCase();
    const categoryLabel = getCategoryLabel(categoryKey).toLowerCase();
    const id = item.ingredient_id ? String(item.ingredient_id) : '';
    return name.includes(searchLower) || 
           categoryText.includes(searchLower) || 
           categoryLabel.includes(searchLower) ||
           id.includes(searchLower);
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
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

onMounted(() => {
  loadJsonData()
})





const handleStatusChange = (row) => {
  //暫無改動資料狀態功能
  console.log('當前這筆資料的 ID:', row.USER_ID);
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
          <h2 class="zh-h2">{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <div style="width: 160px">
            <button class="btn h-40 btn-solid" @click="handleAdd">新增食材</button>
          </div>
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
        <el-table-column prop="ingredient_id" label="食材編號" sortable="custom" align="center" width="120"/>
        <el-table-column prop="main_category" label="食材分類" sortable="custom" align="center">
          <template #default="scope">
            {{ getCategoryLabel(scope.row.main_category) }}
          </template>
        </el-table-column>
        <el-table-column prop="ingredient_name" label="食材名稱" align="center"/>
        <!-- 新增圖片欄位 -->
        <el-table-column label="食材圖片" align="center">
          <template #default="scope">
            <img v-if="scope.row.ingredient_image_url" :src="parsePublicFile(scope.row.ingredient_image_url)" alt="食材圖片" style="width:48px;height:48px;object-fit:cover;border-radius:8px;" />
          </template>
        </el-table-column>
        <el-table-column label="上/下架" align="center" width="120">
          <template #default="scope">
            <!-- ingredients.json 沒有 is_active 欄位，若有請補上正確欄位 -->
            <el-switch 
            v-model="scope.row.is_active" 
            size="large" 
            class="ml-2" 
            inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" 
            active-text="上架" 
            inactive-text="下架"
            @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <el-button link @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="刪除" align="center" width="120">
          <template #default>
            <DeleteButton/>
          </template>
        </el-table-column>
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
      <IngredientModal ref="modalRef" />
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