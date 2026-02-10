<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit, Search, Delete } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi, phpApi } from '@/utils/publicApi.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const search = ref('');

const fetchPlans = async () => {
  try {
    const response = await phpApi.get('mealplans/admin_get_plans.php');

    if (response.data.status === 'success') {
      tableData.value = response.data.data.map((item) => ({
        ...item,
        plan_id: Number(item.template_id),
        // 確保轉為數字，供 el-switch 使用
        is_active: Number(item.is_active)
      }));
    }
  } catch (error) {
    console.error('API 錯誤:', error.message);
    ElMessage.error('無法載入計畫列表');
  }
};

onMounted(() => {
  fetchPlans();
});

const handleStatusChange = async (row) => {
  // 記錄原始狀態，以便失敗時還原
  // 因為 toggle 已經變更了 row.is_active 的值，所以原始值是相反的
  const originalStatus = row.is_active === 1 ? 0 : 1;

  try {
    const res = await phpApi.post('mealplans/admin_update_plan_status.php', {
      plan_id: Number(row.plan_id),
      is_active: row.is_active
    });

    if (res.data.status === 'success') {
      ElMessage.success(`計畫 "${row.title}" 狀態已更新`);
    } else {
      throw new Error(res.data.message);
    }
  } catch (err) {
    console.error(err);
    // 更新失敗，將開關切換回原本的狀態
    row.is_active = originalStatus;
    ElMessage.error('更新失敗：' + err.message);
  }
};

const handleCreatePlan = async () => {
  try {
    const res = await phpApi.post('mealplans/admin_create_plan.php', {
      title: '未命名計畫'
    });

    if (res.data.status === 'success') {
      const newId = res.data.template_id;
      ElMessage.success('計畫建立成功，正在跳轉...');
      router.push(`/admin/plans/${newId}`);
    } else {
      ElMessage.error(res.data.message || '建立失敗');
    }
  } catch (err) {
    console.error('建立計畫錯誤:', err);
    ElMessage.error('網路錯誤，無法建立計畫');
  }
};

// 刪除邏輯
const handleDelete = (id) => {
  ElMessageBox.confirm(
    '確定要刪除此計畫嗎？此動作將連同底下的食譜設定一併刪除且無法復原。',
    '刪除確認',
    {
      confirmButtonText: '確定刪除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const res = await phpApi.post('mealplans/admin_delete_plan.php', {
          template_id: Number(id)
        });

        if (res.data.status === 'success') {
          ElMessage.success('刪除成功');
          fetchPlans(); // 重新整理列表
        } else {
          ElMessage.error(res.data.message || '刪除失敗');
        }
      } catch (err) {
        console.error(err);
        ElMessage.error('刪除請求發生錯誤');
      }
    })
    .catch(() => {
      // 取消刪除
    });
};

const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }

  const searchLower = search.value.toLowerCase();
  return tableData.value.filter((item) => {
    const title = item.title ? item.title.toLowerCase() : '';
    // 如果後端沒有回傳 category，這裡加個防呆
    const categoryText = item.category ? item.category.toLowerCase() : '';
    const id = item.plan_id ? String(item.plan_id) : '';

    return (
      title.includes(searchLower) ||
      categoryText.includes(searchLower) ||
      id.includes(searchLower)
    );
  });
});

const loadJsonData = async () => {
  try {
    const response = await publicApi.get('data/plan/meal_plans.json');
    // 如果您希望以後端資料為主，請註解掉下面這行，避免覆蓋 fetchPlans 的結果
    // tableData.value = response.data;
  } catch (error) {
    console.error('抓取 JSON 失敗:', error.message);
  }
};

const handleSortChange = ({ prop, order }) => {
  if (!order) return;

  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    // 🔥 確保 plan_id 以數值方式排序
    if (prop === 'plan_id') {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (prop === 'created_at') {
      // 假設排序欄位是 created_at
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (order === 'ascending') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  currentPage.value = 1;
};

const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

onMounted(() => {
  // loadJsonData(); // 建議註解掉，改用 fetchPlans
});
</script>

<template>
  <div>
    <div class="content-header">
      <div class="content-title">
        <h2 class="zh-h2">{{ route.meta.title }}</h2>
      </div>

      <div class="content-header-function">
        <div style="width: 160px">
          <button class="btn h-40 btn-solid" @click="handleCreatePlan">
            新增計畫
          </button>
        </div>
        <SearchBar v-model="search" placeholder="搜尋..." width="300px" />
      </div>
    </div>

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
        prop="plan_id"
        label="計畫編號"
        sortable="custom"
        align="center"
        width="180"
      />
      <el-table-column prop="title" label="計劃名稱" align="center" />
      <el-table-column prop="created_at" label="建立時間" align="center" />

      <el-table-column label="上/下架" align="center" width="120">
        <template #default="scope">
          <el-switch
            v-model="scope.row.is_active"
            size="large"
            class="ml-2"
            inline-prompt
            :active-value="1"
            :inactive-value="0"
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
            :to="`/admin/plans/${scope.row.plan_id}`"
            style="color: #555"
          >
            <el-icon><Edit /></el-icon>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="刪除" align="center" width="120">
        <template #default="scope">
          <el-button
            type="danger"
            link
            @click="handleDelete(scope.row.plan_id)"
          >
            <el-icon :size="20"><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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

.custom-search-container {
  width: 307px;
}

:deep(.rounded-search .el-input__wrapper) {
  border-radius: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #3e8d60 inset;
  padding: 0 15px;
  height: 40px;
}

:deep(.rounded-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #2e6f4a inset !important;
}

.search-icon {
  color: #555555;
  font-size: 18px;
  margin-right: 8px;
}

:deep(.rounded-search .el-input__inner::placeholder) {
  color: #4a8b6f;
  opacity: 0.8;
}
</style>
