<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit ,Search,Delete} from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute } from 'vue-router';
//要引用json的檔案一定要import以下這行
import { publicApi } from '@/utils/publicApi.js';

const route = useRoute();

const tableData1 = ref([])        // 原始總資料
const tableData2 = ref([])        // 原始總資料
const tableData3 = ref([])        // 原始總資料
const currentPage1 = ref(1)
const currentPage2 = ref(1)
const currentPage3 = ref(1)
const pageSize = ref(4)
const search1 = ref('')  // 評論舉報搜尋
const search2 = ref('')  // 圖片舉報搜尋
const search3 = ref('')  // 食譜舉報搜尋

const loadJsonData = async () => {
  try {
    const res1 = await publicApi.get('data/social/reported_comments.json')
    const res2 = await publicApi.get('data/social/reported_images.json')
    const res3 = await publicApi.get('data/social/reported_recipes.json')
    tableData1.value = res1.data
    tableData2.value = res2.data
    tableData3.value = res3.data
  } catch (error) {
    console.error('抓取 JSON 失敗:', error.message)
  }
}

// --- 排序邏輯 ---
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

// ===== 搜尋和篩選邏輯 =====
const filteredData1 = computed(() => {
  if (!search1.value) {
    return tableData1.value;
  }
  
  const searchLower = search1.value.toLowerCase();
  return tableData1.value.filter(item => {
    const id = item.REPORTED_COMMENT_ID ? String(item.REPORTED_COMMENT_ID) : '';
    const reporter = item.REPORTER_ID ? String(item.REPORTER_ID) : '';
    const reason = item.REPORT_REASON ? item.REPORT_REASON.toLowerCase() : '';
    
    return id.includes(searchLower) || 
           reporter.includes(searchLower) || 
           reason.includes(searchLower);
  });
});

const filteredData2 = computed(() => {
  if (!search2.value) {
    return tableData2.value;
  }
  
  const searchLower = search2.value.toLowerCase();
  return tableData2.value.filter(item => {
    const id = item.REPORTED_IMAGE_ID ? String(item.REPORTED_IMAGE_ID) : '';
    const reporter = item.REPORTER_ID ? String(item.REPORTER_ID) : '';
    const reason = item.REPORT_REASON ? item.REPORT_REASON.toLowerCase() : '';
    
    return id.includes(searchLower) || 
           reporter.includes(searchLower) || 
           reason.includes(searchLower);
  });
});

const filteredData3 = computed(() => {
  if (!search3.value) {
    return tableData3.value;
  }
  const searchLower = search3.value.toLowerCase();
  return tableData3.value.filter(item => {
    const id = item.reported_recipe_id ? String(item.reported_recipe_id) : '';
    const reporter = item.reporter_id ? String(item.reporter_id) : '';
    const reason = item.report_reason ? item.report_reason.toLowerCase() : '';
    return id.includes(searchLower) || 
           reporter.includes(searchLower) || 
           reason.includes(searchLower);
  });
});

// 顯示資料依然是計算出來的（會隨著 tableData 排序而變動）
const displayData1 = computed(() => {
  const start = (currentPage1.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData1.value.slice(start, end)
})
const displayData2 = computed(() => {
  const start = (currentPage2.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData2.value.slice(start, end)
})
const displayData3 = computed(() => {
  const start = (currentPage3.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData3.value.slice(start, end)
})



const status = (x)=>{
  switch (x) {
  case 0:
    return '待處理'
    break;
  case 1:
    return '審核通過'
    break;
  case 2:
    return '審核不通過'
    break;
  default:return '未知狀態'

}
}
const type = (x)=>{
  switch (x) {
  case 0:
    return '廣告垃圾訊息'
    break;
  case 1:
    return '不當言論'
    break;
  case 2:
    return '色情內容'
    break;
  case 3:
    return '詐騙訊息'
    break;
  default:return '其他'

}
}



onMounted(() => {
  loadJsonData()
})

const handleStatusChange = (row) => {
  //暫無改動資料狀態功能
  console.log(row);
  
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
          <h2 class="zh-h2">留言{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <SearchBar
            v-model="search1"
            placeholder="搜尋..."
            width="300px"
          />
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        :data="displayData1" 
        @sort-change="handleSortChange"
        style="width: 100%" 
        stripe 
        :header-cell-style="{backgroundColor: '#F1F6EF' , color:'#000', fontWeight: 'normal'}"
      >
        <el-table-column prop="REPORTED_COMMENT_ID" label="案件編號" sortable="custom" align="center" width="180"/>
        <el-table-column label="檢舉類型" sortable="custom" align="center">
          <template #default="scope">
            {{ type(scope.row.REPORT_TYPE) }}
          </template>
        </el-table-column>
        <el-table-column prop="REPORT_REASON" label="檢舉原因" align="center"/>
        <el-table-column prop="REPORTER_ID" label="被檢舉會員編號" align="center"/>
        <el-table-column prop="STATUS" label="審核狀態" align="center">
          <template #default="scope">
            {{ status(scope.row.STATUS) }}
          </template>
        </el-table-column>

        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <router-link :to="`/admin/reports/message/${scope.row.REPORTED_COMMENT_ID}`" style="color: #555;">
              <el-icon><Edit /></el-icon>
            </router-link>
            <!-- <el-button link>
              <el-icon><Edit /></el-icon>
            </el-button> -->
          </template>
        </el-table-column>
      </el-table>

      <!-- 頁籤 -->
      <MyPagination 
      v-model:currentPage="currentPage1" 
      :pageSize="pageSize" 
      :total="filteredData1.length"
      />
  </div>



  <div>
    <!-- 內容區頂部 -->
      <div class="content-header">
        <div class="content-title">
          <h2 class="zh-h2">圖片{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <SearchBar
            v-model="search2"
            placeholder="搜尋..."
            width="300px"
          />
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        :data="displayData2" 
        @sort-change="handleSortChange"
        style="width: 100%" 
        stripe 
        :header-cell-style="{backgroundColor: '#F1F6EF' , color:'#000', fontWeight: 'normal'}"
      >
        <el-table-column prop="REPORTED_IMAGE_ID" label="案件編號" sortable="custom" align="center" width="180"/>
        <el-table-column prop="REPORT_TYPE" label="檢舉類型" sortable="custom" align="center">
          <template #default="scope">
            {{ type(scope.row.REPORT_TYPE) }}
          </template>
        </el-table-column>
        <el-table-column prop="REPORT_REASON" label="檢舉原因" align="center"/>
        <el-table-column prop="REPORTER_ID" label="被檢舉會員編號" align="center"/>
        <el-table-column prop="STATUS" label="審核狀態" align="center">
          <template #default="scope">
            {{ status(scope.row.STATUS) }}
          </template>
        </el-table-column>
        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <router-link :to="`/admin/reports/image/${scope.row.REPORTED_IMAGE_ID}`" style="color: #555;">
              <el-icon><Edit /></el-icon>
            </router-link>
          </template>
        </el-table-column>
      </el-table>

      <!-- 頁籤 -->
      <MyPagination 
      v-model:currentPage="currentPage2" 
      :pageSize="pageSize" 
      :total="filteredData2.length"
      />
  </div>



  <div>
    <!-- 內容區頂部 -->
      <div class="content-header">
        <div class="content-title">
          <h2 class="zh-h2">食譜{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <SearchBar
            v-model="search3"
            placeholder="搜尋..."
            width="300px"
          />
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        :data="displayData3" 
        @sort-change="handleSortChange"
        style="width: 100%" 
        stripe 
        :header-cell-style="{backgroundColor: '#F1F6EF' , color:'#000', fontWeight: 'normal'}"
      >
        <el-table-column prop="reported_recipe_id" label="案件編號" sortable="custom" align="center" width="180"/>
        <el-table-column prop="report_type" label="檢舉類型" sortable="custom" align="center">
          <template #default="scope">
            {{ type(scope.row.report_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="report_reason" label="檢舉原因" align="center"/>
        <el-table-column prop="reporter_id" label="被檢舉會員編號" align="center"/>
        <el-table-column prop="status" label="審核狀態" align="center">
          <template #default="scope">
            {{ status(scope.row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <router-link :to="`/admin/reports/recipe/${scope.row.reported_recipe_id}`" style="color: #555;">
              <el-icon><Edit /></el-icon>
            </router-link>
          </template>
        </el-table-column>
      </el-table>


      <!-- 頁籤 -->
      <MyPagination 
      v-model:currentPage="currentPage3" 
      :pageSize="pageSize" 
      :total="filteredData3.length"
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