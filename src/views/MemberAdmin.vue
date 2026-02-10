<script setup>
import { ref, onMounted, computed } from 'vue';
import { Edit, Search } from '@element-plus/icons-vue'
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import MemberModal from '@/components/modal/MemberModal.vue'
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
const route = useRoute();
// 呼叫Api
import { phpApi } from '@/utils/publicApi.js';


const tableData = ref([])        // 原始總資料
const currentPage = ref(1)
const pageSize = ref(8)
const modalRef = ref(null)

// ==========================================
// 定義搜尋關鍵詞ref
// ==========================================
// 儲存使用者輸入的搜尋文字，透過 v-model 與 SearchBar 組件雙向綁定
const search = ref('')

// ==========================================
// 搜尋邏輯 - 過濾表格數據
// ==========================================
const filteredData = computed(() => {
  // 若無搜尋關鍵詞，返回全部資料
  if (!search.value) {
    return tableData.value;
  }

  // 搜尋關鍵詞轉小寫（不區分大小寫）
  const searchLower = search.value.toLowerCase();

  // 過濾符合條件的資料
  return tableData.value.filter(item => {
    const name = item.user_name ? item.user_name.toLowerCase() : '';
    const email = item.user_email ? item.user_email.toLowerCase() : '';
    const id = item.user_id ? String(item.user_id) : '';
    const phone = item.user_phone ? item.user_phone.toLowerCase() : '';
    // 只返回符合條件的會員資料
    return name.includes(searchLower) ||
      email.includes(searchLower) ||
      id.includes(searchLower)// ||
    //phone.includes(searchLower);
  });
});

const loadJsonData = async () => {
  try {
    const response = await phpApi.get(`auth/get_members.php?t=${new Date().getTime()}`);
    tableData.value = response.data
  } catch (error) {
    // console.error('抓取 JSON 失敗:', error.message)
  }
}

// ==========================================
// 排序邏輯
// ==========================================
const handleSortChange = ({ prop, order }) => {
  // 如果沒有排序順序（取消排序），不做動作
  if (!order) return;

  // 直接對原始陣列 tableData 進行排序
  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    // 🔥 確保 user_id 以數值方式排序
    if (prop === 'user_id') {
      valA = Number(valA);
      valB = Number(valB);
    }

    // 如果是日期格式，需要轉成 Date 物件才能正確比較
    if (prop === 'user_startdate') {
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

// ==========================================
// 分頁邏輯 - 計算當前頁顯示的數據
// ==========================================

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

const handleStatusChange = async (row) => {
  try {
    const response = await phpApi.post('auth/update_status.php', {
      user_id: Number(row.user_id),
      is_active: row.is_active
    });

    if (response.data.status === 'success') {
      // 根據 row.is_active 決定提醒顏色
      if (row.is_active) {
        // 啟用時：顯示綠色 (success)
        ElMessage.success(response.data.message);
      } else {
        // 停權時：顯示灰色 (info)
        ElMessage({
          message: response.data.message,
          type: 'info', // 'info' 在 Element Plus 預設是灰色
        });
      }
    } else {
      throw new Error(response.data.message || '更新失敗');
    }
  } catch (error) {
    // 失敗時撥回開關狀態
    row.is_active = !row.is_active;
    // console.error('更新失敗:', error);

    // 失敗時顯示紅色 (error)
    ElMessage.error(error.message || '系統連線異常');
  }
};

// ==========================================
// 彈窗功能
// ==========================================
const showDetail = (data) => {
  // 檢查這裡拿到的 level 是不是正確的 (例如從 localStorage 拿)
  // 如果登入時有存 admin_level，這裡才拿得到
  const currentLevel = localStorage.getItem('admin_level') || 0;

  // 必須傳入第二個參數 level
  modalRef.value.open(data, parseInt(currentLevel));
};

// 處理修改資料後的 API 提交
// 修改 handleUpdate 函式
const handleUpdate = async (formData) => {
  // 強制從 localStorage 抓取，不依賴傳進來的參數
  const currentLevel = localStorage.getItem('admin_level') || '0';
  // console.log('--- 修改啟動 ---');
  // console.log('目前檢查等級:', currentLevel);

  // 建立新的 FormData
  const fd = new FormData();

  // 手動塞入所有必填欄位 (確保名稱與 PHP 接收的一模一樣)
  fd.append('user_id', Number(formData.user_id));
  fd.append('current_admin_level', '2'); // 先測試直接寫死 '2' 看看 PHP 是否收得到
  fd.append('user_name', formData.user_name || '');
  fd.append('user_phone', formData.user_phone || '');
  fd.append('user_address', formData.user_address || '');
  fd.append('user_url', formData.user_url || '');

  // 強制轉為字串送出
  fd.append('current_admin_level', String(currentLevel));

  // 處理圖片檔案
  if (formData.rawFile) {
    fd.append('image', formData.rawFile); // 檔案 key 必須與 PHP 的 $_FILES['image'] 對應
  }

  try {
    // 確保這裡的 phpApi 是您 utils/publicApi.js 匯出的那個
    // 在這裡單獨設定 headers，覆蓋掉 publicApi.js 的預設值
    const response = await phpApi.post('auth/update_member.php', fd, {
      headers: {
        'Content-Type': undefined // 強制讓瀏覽器自己決定格式
      }
    });

    // console.log('PHP 回應資料:', response.data);

    if (response.data.status === 'success') {
      ElMessage.success(response.data.message);
      await loadJsonData(); // 重新整理列表
      modalRef.value.visible = false;
    } else {
      // 這裡會顯示 PHP 回傳的 "權限不足，您的等級是：0"
      throw new Error(response.data.message);
    }
  } catch (error) {
    // console.error('修改失敗:', error);
    // 增加詳細提示
    ElMessage.success(response.data.message);
  }
}
</script>

<template>
  <div>
    <!-- 內容區頂部 -->
    <div class="content-header">
      <div class="content-title">
        <h2 class="zh-h2">{{ route.meta.title }}</h2>
      </div>


      <div class="content-header-function">
        <SearchBar v-model="search" placeholder="搜尋..." width="300px" />
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="displayData" @sort-change="handleSortChange" style="width: 100%" stripe
      :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
      <el-table-column prop="user_id" label="會員編號" sortable="custom" align="center" width="180" />
      <el-table-column prop="user_name" label="姓名" sortable="custom" align="center" />
      <el-table-column label="電子信箱" align="center" width="220">
        <template #default="scope">
          <div class="email-column">
            <template v-if="scope.row.user_email && scope.row.user_email.endsWith('@line.com')">
              <div class="line-status-tag">
                <i class="fab fa-line"></i>
                <span>LINE 註冊</span>
              </div>
              <span class="email-text line-id truncate" :title="scope.row.user_email">
                {{ scope.row.user_email.split('@')[0] }}
              </span>
            </template>

            <template v-else>
              <span class="email-text truncate">{{ scope.row.user_email }}</span>
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="user_startdate" label="加入日期" sortable="custom" align="center" />

      <el-table-column label="狀態" align="center" width="120">
        <template #default="scope">
          <el-switch v-model="scope.row.is_active" size="large" class="ml-2" inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" active-text="啟用" inactive-text="停權"
            @change="handleStatusChange(scope.row)" />
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
    <!-- 彈窗 -->
    <MemberModal ref="modalRef" @update="handleUpdate" />
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

.email-column {
  display: flex;
  flex-direction: column; // 標籤與文字上下排列，節省橫向空間
  align-items: center;
  gap: 4px;
}

/* line的email亂碼改成這些 */
.email-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 垂直置中關鍵 */
  position: relative;
  /* 為了讓子元素絕對定位 */
  min-height: 50px;
  /* 固定高度確保置中效果 */
  cursor: default;

  &:hover {
    .email-text.line-id {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0);
      /* Hover 時回到定位點並顯示 */
    }

    // Hover 時讓標籤稍微往上移一點，給 Email 留位置
    .line-status-tag {
      transform: translateY(-10px);
    }
  }
}

/* 一般 Email 不受影響 */
.email-text.truncate {
  display: inline-block;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.line-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #06C755;
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.email-text.line-id {
  position: absolute;
  /* 絕對定位，不佔據空間 */
  bottom: 4px;
  /* 靠底部顯示 */
  left: 50%;
  /* 靠左 50% */
  transform: translate(-50%, 5px);
  /* 初始位置：水平置中且下移 5px */

  color: #999;
  font-size: 11px;
  font-family: monospace;
  white-space: nowrap;

  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1;
}
</style>