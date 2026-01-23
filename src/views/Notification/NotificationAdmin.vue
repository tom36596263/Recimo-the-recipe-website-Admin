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
    const title = item.NOTIFICATION_TITLE ? item.NOTIFICATION_TITLE.toLowerCase() : '';
    const type = item.NOTIFICATION_TYPE ? item.NOTIFICATION_TYPE.toLowerCase() : '';
    const id = item.NOTIFICATION_ID ? String(item.NOTIFICATION_ID) : '';
    
    return title.includes(searchLower) || 
           type.includes(searchLower) || 
           id.includes(searchLower);
  });
});

const loadJsonData = async () => {
  try {
    const response = await publicApi.get('data/others/notifications.json')
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
          <h2 class="zh-h2">{{route.meta.title}}</h2>
        </div>

        <div class="content-header-function">
          <router-link style="width: 160px" to="/admin/notifications/add">
            <button class="btn h-40 btn-solid">發布消息</button>
          </router-link>
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
        <el-table-column prop="NOTIFICATION_ID" label="消息編號" sortable="custom" align="center" width="180"/>
        <el-table-column prop="NOTIFICATION_TYPE" label="消息類別" sortable="custom" align="center"/>
        <el-table-column prop="NOTIFICATION_TITLE" label="消息標題" align="center"/>
        <el-table-column prop="CREATED_AT" label="發布日期" align="center"/>
        <el-table-column prop="RECEIVER_ID" label="發布對象" align="center"/>

        <el-table-column label="詳情" align="center" width="120">
          <template #default="scope">
            <router-link :to="`/admin/notifications/${scope.row.NOTIFICATION_ID}`" style="color: #555;">
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