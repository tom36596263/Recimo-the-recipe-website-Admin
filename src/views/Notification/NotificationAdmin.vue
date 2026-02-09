<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit, Delete, Search } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute, useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const tableData = ref([]);       // 原始總資料
const currentPage = ref(1);
const pageSize = ref(8);
const search = ref('');

// 類別映射（英文 -> 中文）
const categoryMap = {
  general: '一般消息',
  important: '重要通知',
  system: '系統公告',
  promotion: '促銷活動',
  update: '功能更新'
};

// 轉換類別為中文
const getCategoryLabel = (category) => {
  return categoryMap[category] || category;
};

// ===== 搜尋邏輯 =====
// 只顯示 sender_id 為 1 的資料，並支援搜尋
const filteredData = computed(() => {
  let filtered = tableData.value.filter(item => item.sender_id == 1);

  // 應用搜尋
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(item => {
      const title = item.notification_title ? item.notification_title.toLowerCase() : '';
      const type = item.notification_type ? item.notification_type.toLowerCase() : '';
      const id = item.notification_id ? String(item.notification_id) : '';
      return title.includes(searchLower) ||
        type.includes(searchLower) ||
        id.includes(searchLower);
    });
  }

  return filtered;
});

const loadJsonData = async () => {
  try {
    const response = await phpApi.get('social/admin_notifications.php')
    if (response.data.success) {
      tableData.value = response.data.data
    } else {
      ElMessage.error('獲取通知列表失敗')
    }
  } catch (error) {
    console.error('抓取數據失敗:', error.message)
    ElMessage.error('獲取通知列表失敗')
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

/**
 * 刪除單個通知
 */
const handleDeleteOne = async (row) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除消息「${row.notification_title}」嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 調用刪除 API
    const response = await phpApi.delete('social/admin_notifications.php', {
      data: { notification_id: Number(row.notification_id) }
    });

    if (response.data.success) {
      // 從列表中移除
      const index = tableData.value.findIndex(item => item.notification_id === row.notification_id);
      if (index > -1) {
        tableData.value.splice(index, 1);
      }
      ElMessage.success('刪除成功！');
    } else {
      ElMessage.error(response.data.message || '刪除失敗');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('刪除失敗:', error);
      ElMessage.error('刪除失敗，請稍後重試');
    }
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
        <router-link style="width: 160px" to="/admin/notifications/add">
          <button class="btn h-40 btn-solid">發布消息</button>
        </router-link>
        <SearchBar v-model="search" placeholder="搜尋編號、標題、類別..." width="320px" />
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="displayData" @sort-change="handleSortChange" style="width: 100%" stripe
      :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">

      <el-table-column prop="notification_id" label="消息編號" sortable="custom" align="center" width="120" />
      <el-table-column prop="notification_title" label="消息標題" align="center" min-width="200" />
      <el-table-column prop="notification_type" label="消息類別" sortable="custom" align="center" width="120">
        <template #default="scope">
          {{ getCategoryLabel(scope.row.notification_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="發布日期" sortable="custom" align="center" width="140" />

      <!-- 查看列 -->
      <el-table-column label="詳情" align="center" width="80">
        <template #default="scope">
          <router-link :to="`/admin/notifications/${scope.row.notification_id}`">
            <el-icon>
              <Edit />
            </el-icon>
          </router-link>
        </template>
      </el-table-column>

      <!-- 刪除列 -->
      <el-table-column label="刪除" align="center" width="80">
        <template #default="scope">
          <el-icon class="delete-icon" @click="handleDeleteOne(scope.row)">
            <Delete />
          </el-icon>
        </template>
      </el-table-column>
    </el-table>

    <!-- 頁籤 -->
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

// 圖示樣式
.el-icon {
  color: #555555;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #3E8D60;
  }
}

.delete-icon {
  &:hover {
    color: #f56c6c;
  }
}
</style>