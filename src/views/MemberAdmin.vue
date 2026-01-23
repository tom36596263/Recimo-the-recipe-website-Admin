<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit ,Search} from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import MemberModal from '@/components/modal/MemberModal.vue'
import { useRoute } from 'vue-router';
//要引用json的檔案一定要import以下這行
import { publicApi } from '@/utils/publicApi.js';

const route = useRoute();

const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const modalRef = ref(null)
// ===== 步驟1：定義搜尋關鍵詞ref =====
// 儲存使用者輸入的搜尋文字，透過 v-model 與 SearchBar 組件雙向綁定
const search = ref('')

// ===== 步驟2：搜尋邏輯 - 過濾表格數據 =====
/**
 * filteredData 計算屬性
 * 功能說明：根據搜尋關鍵詞過濾會員資料
 * 
 * 執行步驟：
 * Step 1: 檢查是否有搜尋關鍵詞，若無則直接返回原始資料
 * Step 2: 將搜尋關鍵詞轉為小寫，便於不區分大小寫的比對
 * Step 3: 遍歷所有會員資料，檢查以下欄位是否包含搜尋關鍵詞：
 *        - USER_NAME（會員名稱）
 *        - USER_EMAIL（電子郵件）
 *        - USER_ID（會員編號）
 *        - USER_PHONE（電話號碼）
 * Step 4: 只返回符合條件的會員資料
 */
const filteredData = computed(() => {
  // Step 1: 若無搜尋關鍵詞，返回全部資料
  if (!search.value) {
    return tableData.value;
  }
  
  // Step 2: 搜尋關鍵詞轉小寫（不區分大小寫）
  const searchLower = search.value.toLowerCase();
  
  // Step 3 & 4: 過濾符合條件的資料
  return tableData.value.filter(item => {
    const name = item.USER_NAME ? item.USER_NAME.toLowerCase() : '';
    const email = item.USER_EMAIL ? item.USER_EMAIL.toLowerCase() : '';
    const id = item.USER_ID ? String(item.USER_ID) : '';
    const phone = item.USER_PHONE ? item.USER_PHONE.toLowerCase() : '';
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           id.includes(searchLower) || 
           phone.includes(searchLower);
  });
});

const loadJsonData = async () => {
  try {
    const response = await publicApi.get('data/user/users.json')
    tableData.value = response.data
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

// ===== 步驟3：分頁邏輯 - 計算當前頁顯示的數據 =====
/**
 * displayData 計算屬性
 * 功能說明：根據當前頁碼和每頁筆數，從過濾後的資料中提取應顯示的資料
 * 
 * 執行步驟：
 * Step 1: 根據當前頁碼 (currentPage) 和每頁筆數 (pageSize) 計算起始索引
 * Step 2: 計算結束索引 (起始索引 + 每頁筆數)
 * Step 3: 使用 slice() 方法從 filteredData 中提取該頁的資料
 * Step 4: 將提取的資料傳給表格 el-table 進行展示
 */
const displayData = computed(() => {
  // Step 1 & 2: 計算分頁的起始和結束位置
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  // Step 3 & 4: 提取該頁應顯示的資料
  return filteredData.value.slice(start, end)
})

onMounted(() => {
  loadJsonData()
})

const handleStatusChange = (row) => {
  //暫無改動資料狀態功能
  console.log('當前這筆資料的 ID:', row.USER_ID);
};

//-------------彈窗功能-----------
const showDetail = (data) =>{
  modalRef.value.open(data)
}

</script>

<template>
  <div>
    <!-- 內容區頂部 -->
      <div class="content-header">
        <div class="content-title">
          <h2 class="zh-h2">{{route.meta.title}}</h2>
        </div>
        

        <div class="content-header-function">
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
        <el-table-column prop="USER_ID" label="會員編號" sortable="custom" align="center" width="180"/>
        <el-table-column prop="USER_NAME" label="姓名" sortable="custom" align="center"/>
        <el-table-column prop="USER_EMAIL" label="電子信箱" align="center"/>
        <el-table-column prop="USER_STARTDATE" label="加入日期" sortable="custom" align="center"/>

        <el-table-column label="狀態" align="center" width="120">
          <template #default="scope">
            <el-switch 
            v-model="scope.row.IS_ACTIVE" 
            size="large" 
            class="ml-2" 
            inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" 
            active-text="啟用" 
            inactive-text="停權"
            @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>

        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <el-button link  @click="showDetail(scope.row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>


      <!-- 頁籤 -->
      <MyPagination 
      v-model:currentPage="currentPage" 
      :pageSize="pageSize" 
      :total="filteredData.length"
      />
      <!-- 彈窗 -->
      <MemberModal ref="modalRef"/>
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