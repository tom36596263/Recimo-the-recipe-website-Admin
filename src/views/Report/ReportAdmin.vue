<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';

const route = useRoute();

// 1. 資料狀態
const allReports = ref([]);
const isLoading = ref(true);
const showFinished = ref(false); // 🏆 預設不顯示已完成案件，保持介面清爽

// 2. 分頁與搜尋設定
const pageSize = ref(4);
const currentPage1 = ref(1); 
const search1 = ref('');
const currentPage2 = ref(1); 
const search2 = ref('');
const currentPage3 = ref(1); 
const search3 = ref('');

// 🏆 當切換顯示狀態時，將分頁歸一
watch(showFinished, () => {
  currentPage1.value = 1;
  currentPage2.value = 1;
  currentPage3.value = 1;
});

const loadDataFromPhp = async () => {
  isLoading.value = true;
  try {
    const res = await phpApi.get('others/report_manage.php');
    if (res.data.success) {
      allReports.value = res.data.data || [];
    }
  } catch (error) {
    console.error('抓取資料失敗:', error.message);
  } finally {
    isLoading.value = false;
  }
};

const getStatusType = (val) => {
  const map = { pending: 'warning', resolved: 'success', ignored: 'info' };
  return map[val] || '';
};

const statusLabel = (val) => {
  const map = { pending: '待處理', resolved: '審核通過', ignored: '審核不通過' };
  return map[val] || '未知狀態';
};

// ===== 3. 抽離重複的篩選邏輯 =====
const createFilteredData = (type, searchStr) => {
  return computed(() => {
    return allReports.value
      .filter((item) => item.report_type === type)
      .filter((item) => {
        // 🏆 如果 showFinished 為 false，只保留 pending
        if (!showFinished.value) {
          return item.status === 'pending';
        }
        return true;
      })
      .filter((item) => {
        const s = searchStr.value.toLowerCase();
        return !s || String(item.report_id).includes(s) || (item.reason && item.reason.toLowerCase().includes(s));
      });
  });
};

const filteredData1 = createFilteredData('comment', search1);
const filteredData2 = createFilteredData('gallery', search2);
const filteredData3 = createFilteredData('recipe', search3);

const displayData1 = computed(() => filteredData1.value.slice((currentPage1.value - 1) * pageSize.value, currentPage1.value * pageSize.value));
const displayData2 = computed(() => filteredData2.value.slice((currentPage2.value - 1) * pageSize.value, currentPage2.value * pageSize.value));
const displayData3 = computed(() => filteredData3.value.slice((currentPage3.value - 1) * pageSize.value, currentPage3.value * pageSize.value));

onMounted(loadDataFromPhp);
</script>

<template>
  <div v-loading="isLoading" class="report-container">
    
    <div class="filter-header">
      <div class="status-switch">
        <span class="label">顯示模式：</span>
        <el-radio-group v-model="showFinished" size="small">
          <el-radio-button :value="false">待處理</el-radio-button>
          <el-radio-button :value="true">全部紀錄</el-radio-button>
        </el-radio-group>
      </div>
      <el-tag v-if="!showFinished" type="info" effect="plain" class="hint-tag">
        目前隱藏已結案案件
      </el-tag>
    </div>

    <div class="report-block">
      <div class="content-header">
        <h2 class="zh-h2">留言{{ route.meta.title || '檢舉管理' }}</h2>
        <SearchBar v-model="search1" placeholder="搜尋留言編號或原因..." width="300px" />
      </div>
      <el-table :data="displayData1" stripe style="width: 100%" :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
        <el-table-column prop="report_id" label="案件編號" align="center" width="100" />
        <el-table-column label="檢舉類型" align="center" width="180">
          <template #default="scope">{{ scope.row.type_text }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="檢舉原因" align="center" show-overflow-tooltip />
        <el-table-column prop="user_id" label="被檢舉人ID" align="center" width="110" />
        <el-table-column label="狀態" align="center" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="scope">
            <router-link :to="{ path: `/admin/reports/message/${scope.row.report_id}`, query: { target_id: scope.row.target_id } }">
              <el-icon class="edit-btn"><Edit /></el-icon>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
      <MyPagination v-model:currentPage="currentPage1" :pageSize="pageSize" :total="filteredData1.length" />
    </div>

    <el-divider />

    <div class="report-block">
      <div class="content-header">
        <h2 class="zh-h2">圖片{{ route.meta.title || '檢舉管理' }}</h2>
        <SearchBar v-model="search2" placeholder="搜尋案件編號或原因..." width="300px" />
      </div>
      <el-table :data="displayData2" stripe style="width: 100%" :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
        <el-table-column prop="report_id" label="案件編號" align="center" width="100" />
        <el-table-column label="檢舉類型" align="center" width="180">
          <template #default="scope">{{ scope.row.type_text }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="檢舉原因" align="center" show-overflow-tooltip />
        <el-table-column prop="user_id" label="被檢舉人ID" align="center" width="110" />
        <el-table-column label="狀態" align="center" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="scope">
            <router-link :to="{ path: `/admin/reports/image/${scope.row.report_id}`, query: { target_id: scope.row.target_id } }">
              <el-icon class="edit-btn"><Edit /></el-icon>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
      <MyPagination v-model:currentPage="currentPage2" :pageSize="pageSize" :total="filteredData2.length" />
    </div>

    <el-divider />

    <div class="report-block">
      <div class="content-header">
        <h2 class="zh-h2">食譜{{ route.meta.title || '檢舉管理' }}</h2>
        <SearchBar v-model="search3" placeholder="搜尋案件編號或原因..." width="300px" />
      </div>
      <el-table :data="displayData3" stripe style="width: 100%" :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
        <el-table-column prop="report_id" label="案件編號" align="center" width="100" />
        <el-table-column label="檢舉類型" align="center" width="180">
          <template #default="scope">{{ scope.row.type_text }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="檢舉原因" align="center" show-overflow-tooltip />
        <el-table-column prop="user_id" label="被檢舉人ID" align="center" width="110" />
        <el-table-column label="狀態" align="center" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="scope">
            <router-link :to="{ path: `/admin/reports/recipe/${scope.row.report_id}`, query: { target_id: scope.row.target_id } }">
              <el-icon class="edit-btn"><Edit /></el-icon>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
      <MyPagination v-model:currentPage="currentPage3" :pageSize="pageSize" :total="filteredData3.length" />
    </div>

  </div>
</template>

<style lang="scss" scoped>
.report-container {
  padding: 20px;
}

// 🏆 新增過濾區塊樣式
.filter-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  
  .status-switch {
    display: flex;
    align-items: center;
    .label {
      font-size: 14px;
      margin-right: 10px;
      color: #666;
    }
  }
}

.report-block {
  margin-bottom: 30px;
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h2 { margin: 0; }
}

:deep(a) {
  text-decoration: none;
  outline: none;
}

.edit-btn {
  cursor: pointer;
  font-size: 20px;
  color: #606266;
  transition: color 0.3s;
  
  &:hover {
    color: #3E8D60; 
  }
}

:deep(.el-input__wrapper) {
  border-radius: 20px;
}
</style>