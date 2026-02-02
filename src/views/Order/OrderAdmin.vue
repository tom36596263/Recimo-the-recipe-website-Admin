<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Edit, Search, Delete } from '@element-plus/icons-vue';
import MyPagination from '@/components/MyPagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import { useRoute } from 'vue-router';
//要引用json的檔案一定要import以下這行
// import { publicApi } from '@/utils/publicApi.js';
import { phpApi } from '@/utils/publicApi.js';
import { ElMessage } from 'element-plus';

const route = useRoute();

const tableData = ref([]); // 原始總資料
const currentPage = ref(1);
const pageSize = ref(8);
const search = ref('');
const status = ref('0');

// 訂單狀態對應中文
// OrderList.vue 修改狀態對照表
const statusMap = {
  0: '訂購成功',
  1: '訂單確認',
  2: '出貨',
  3: '送達',
  '-1': '取消訂單' // 注意 key 如果是負數要用引號
};

const getStatusText = (status) => statusMap[status] ?? '未知狀態';

// ===== 搜尋邏輯 =====
const filteredData = computed(() => {
  if (!search.value) {
    return tableData.value;
  }

  const searchLower = search.value.toLowerCase();
  return tableData.value.filter((item) => {
    const id = item.id ? String(item.id) : '';
    const receiver = item.receiver ? item.receiver.toLowerCase() : '';
    const orderDate = item.date ? item.date.toLowerCase() : '';
    const trackingNo = item.trackingNo ? String(item.trackingNo) : '';

    return (
      id.includes(searchLower) ||
      receiver.includes(searchLower) ||
      orderDate.includes(searchLower) ||
      trackingNo.includes(searchLower)
    );
  });
});

const loadJsonData = async () => {
  try {
    const adminId =
      localStorage.getItem('adminId') || localStorage.getItem('userId') || '1';

    const response = await phpApi.get('mall/get_all_orders.php', {
      params: { admin_id: adminId }
    });

    if (response.data.success) {
      tableData.value = response.data.data.map((item) => {
        //先定義變數：將資料庫原始欄位轉為數字
        const payMethod = Number(item.payment_method);

        // 再進行 return 映射
        return {
          id: item.order_id,
          date: item.created ? item.created.split(' ')[0] : '',
          trackingNo: item.logistics_id || '尚未出貨',
          receiver: item.recipient_name,
          phone: item.recipient_phone,

          payment:
            payMethod === 1
              ? '信用卡付款'
              : payMethod === 2
                ? '貨到付款'
                : '未知方式',

          method: '宅配',
          status: item.order_status
        };
      });
      ElMessage.success('訂單讀取成功');
    }
  } catch (error) {
    console.error('API 錯誤:', error);
    ElMessage.error('連線失敗，請檢查 API 路徑');
  }
};

// --- 排序邏輯 ---
const handleSortChange = ({ prop, order }) => {
  if (!order) return; // 如果沒有排序順序（取消排序），不做動作

  // 直接對原始陣列 tableData 進行排序
  tableData.value.sort((a, b) => {
    let valA = a[prop];
    let valB = b[prop];

    // 如果是日期格式，需要轉成 Date 物件才能正確比較
    if (prop === 'date') {
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
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

onMounted(() => {
  loadJsonData();
});

const handleStatusChange = async (row) => {
  try {
    const adminId =
      localStorage.getItem('adminId') || localStorage.getItem('userId') || '1';

    // 呼叫你提供的 admin_order.php
    const response = await phpApi.post('mall/admin_order.php', {
      admin_id: adminId, // 管理員 ID
      order_id: row.id, // 訂單編號
      order_status: row.status // 新的狀態值 (0~4)
    });

    if (response.data.success) {
      ElMessage.success(`訂單 #${row.id} 狀態更新成功！`);
    } else {
      ElMessage.error(response.data.error || '更新失敗');
    }
  } catch (error) {
    console.error('更新請求失敗:', error);
    ElMessage.error('系統錯誤，無法更新狀態');
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
        prop="id"
        label="訂單編號"
        sortable="custom"
        align="center"
      />
      <el-table-column
        prop="date"
        label="訂單日期"
        sortable="custom"
        align="center"
      />
      <el-table-column prop="trackingNo" label="物流單號" align="center" />
      <el-table-column prop="receiver" label="收件人" align="center" />
      <el-table-column prop="phone" label="電話" align="center" />
      <el-table-column prop="method" label="配送方式" align="center" />
      <el-table-column prop="payment" label="付款方式" align="center" />
      <el-table-column label="訂單狀態" align="center" width="130">
        <template #default="scope">
          <el-select
            v-model="scope.row.status"
            @change="handleStatusChange(scope.row)"
            placeholder=""
            style="width: 115px"
            size="small"
          >
            <el-option label="訂購成功" :value="0" />
            <el-option label="訂單確認" :value="1" />
            <el-option label="出貨" :value="2" />
            <el-option label="送達" :value="3" />
            <el-option label="取消訂單" :value="-1" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="詳情" align="center" width="80">
        <template #default="scope">
          <router-link :to="'/admin/orders/' + scope.row.id">
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
.el-icon {
  color: #555555;
}

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
