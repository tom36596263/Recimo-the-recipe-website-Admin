<script setup>
// ===== 導入 =====
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js'; // 統一的 API 實例
import { ElMessage } from 'element-plus'; // 消息提示
import { phpApi } from '@/utils/publicApi.js';
// ===== 路由相關 =====
const router = useRouter(); // 用於導航
const route = useRoute(); // 用於獲取路由參數

// ===== 狀態管理 =====
// 訂單詳情數據
const order = ref({
  // 訂單基本信息
  orderNumber: '1',
  orderDate: '2025-10-15',
  totalAmount: 'NT$ 599',

  // 收件人信息
  recipientName: '王曉明',
  recipientPhone: '0988111222',
  recipientAddress: '桃園市中壢區復興路46號',
  shippingNumber: '0003332123',
  paymentMethod: '貨到付款', // 新增付款方式欄位

  // 訂單商品列表
  items: [
    {
      productId: '1',
      productName: '葱頭',
      quantity: 1,
      unitPrice: 'NT$ 199',
      subtotal: 'NT$ 199'
    },
    {
      productId: '2',
      productName: '料理包',
      quantity: 2,
      unitPrice: 'NT$ 200',
      subtotal: 'NT$ 400'
    }
  ],

  // 訂單狀態
  status: 'pending' // pending(待確認) | confirmed(已確認) | shipped(已出貨) | delivered(已送達)
});

// 訂單狀態選項
const statusOptions = [
  { label: '訂購成功', value: 0 },
  { label: '訂單確認', value: 1 },
  { label: '出貨', value: 2 },
  { label: '送達', value: 3 },
  { label: '取消訂單', value: -1 }
];

// 加載狀態
const loading = ref(false);

// ===== 計算屬性 =====
//取得當前訂單狀態的中文標籤
const statusLabel = computed(() => {
  const option = statusOptions.find((opt) => opt.value === order.value.status);
  return option ? option.label : '未知';
});

// ===== 連接資料庫 =====
const fetchOrderDetail = async () => {
  try {
    loading.value = true;
    const orderId = route.params.id;
    const adminId = localStorage.getItem('userId') || '1'; // 取得管理員 ID

    // 呼叫 order.php 並帶入參數
    const response = await phpApi.get('mall/admin_order.php', {
      params: {
        id: orderId,
        admin_id: adminId
      }
    });

    const res = response.data;

    if (res.success) {
      const master = res.order_master;
      const details = res.order_details;

      // 重新對應後端資料庫欄位
      order.value = {
        orderNumber: master.order_id,
        orderDate: master.created,
        totalAmount: `NT$ ${master.total_amount}`,
        recipientName: master.recipient_name,
        recipientPhone: master.recipient_phone,
        recipientAddress: master.shipping_address,
        shippingNumber: master.logistics_id || '無',
        paymentMethod: master.payment_method === 0 ? '貨到付款' : '信用卡付款',

        // 映射商品清單
        items: details.map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: `NT$ ${item.snapshot_price}`,
          subtotal: `NT$ ${item.subtotal}`
        })),

        status: master.order_status
      };
    }
  } catch (error) {
    console.error('獲取訂單詳情失敗:', error);
    ElMessage.error('無法讀取訂單資訊');
  } finally {
    loading.value = false;
  }
};

//更新狀態
const handleStatusChange = async () => {
  try {
    const adminId = localStorage.getItem('userId') || '1';

    // 這裡同樣呼叫 admin_order.php，但改用 POST
    const response = await phpApi.post('mall/admin_order.php', {
      admin_id: adminId,
      order_id: order.value.orderNumber,
      order_status: order.value.status // 確保傳過去的是數字 0, 1, 2, 3,-1
    });

    if (response.data.success) {
      ElMessage.success(response.data.message || '狀態更新成功');
    }
  } catch (error) {
    console.error('更新失敗:', error);
    ElMessage.error('更新狀態失敗');
  }
};

//返回訂單
const handleBack = () => {
  router.back();
};

// ===== 生命週期 =====
onMounted(() => {
  fetchOrderDetail();
});
</script>

<template>
  <div class="order-detail-container">
    <!-- ===== 頂部區域 ===== -->
    <!-- 頁面標題、狀態選擇和返回按鈕 -->
    <div class="content-header">
      <h1 class="zh-h2">訂單詳情</h1>

      <div class="header-right">
        <!-- 狀態選擇下拉框 -->
        <el-select
          v-model="order.status"
          @change="handleStatusChange"
          placeholder="請選擇狀態"
          class="status-select"
        >
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 返回按鈕 -->
        <el-button type="default" class="btn-back" @click="handleBack">
          返回
        </el-button>
      </div>
    </div>

    <!-- ===== 內容區域 ===== -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else class="detail-content">
      <!-- ===== 訂單詳情表格 ===== -->
      <div class="section">
        <h3 class="section-title">訂單詳情</h3>
        <el-table
          :data="[order]"
          stripe
          :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000' }"
        >
          <el-table-column
            prop="orderNumber"
            label="訂單編號"
            align="center"
            width="150"
          />
          <el-table-column prop="orderDate" label="訂單日期" align="center" />
          <el-table-column
            prop="paymentMethod"
            label="付款方式"
            align="center"
          />
          <el-table-column prop="totalAmount" label="金額" align="center" />
        </el-table>
      </div>

      <!-- ===== 收件人信息 ===== -->
      <div class="section">
        <h3 class="section-title">收件人信息</h3>
        <el-table
          :data="[order]"
          stripe
          :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000' }"
        >
          <el-table-column
            prop="recipientName"
            label="收件人名稱"
            align="center"
          />
          <el-table-column
            prop="recipientPhone"
            label="收件人電話"
            align="center"
          />
          <el-table-column
            prop="recipientAddress"
            label="收件人地址"
            align="center"
          />
          <el-table-column
            prop="shippingNumber"
            label="物流編號"
            align="center"
            width="150"
          />
        </el-table>
      </div>

      <!-- ===== 訂購商品 ===== -->
      <div class="section">
        <h3 class="section-title">訂購商品</h3>
        <el-table
          :data="order.items"
          stripe
          :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000' }"
        >
          <el-table-column
            prop="productId"
            label="商品編碼"
            align="center"
            width="120"
          />
          <el-table-column prop="productName" label="商品名稱" align="center" />
          <el-table-column
            prop="quantity"
            label="數量"
            align="center"
            width="100"
          />
          <el-table-column
            prop="unitPrice"
            label="單價"
            align="center"
            width="120"
          />
          <el-table-column
            prop="subtotal"
            label="小計"
            align="center"
            width="120"
          />
        </el-table>
      </div>

      <!-- ===== 總計 ===== -->
      <div class="total-section">
        <span class="total-label">總計</span>
        <span class="total-amount">{{ order.totalAmount }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ===== 顏色變數定義 =====
$primary-green: #438b69; // 主題綠色
$hover-green: #367054;
$border-color: #e0e0e0;
$text-color: #333;
$light-bg: #f9f9f9;

// ===== 容器樣式 =====
/**
 * 頁面容器
 * 功能：設置頁面內邊距，為內容預留空間
 */
.order-detail-container {
  padding: 20px 30px;
}

// ===== 頂部區域樣式 =====
/**
 * 頂部標題和控制區
 * 功能說明：
 * 1. 使用 flexbox 佈局
 * 2. 標題左對齐，控制按鈕右對齐
 * 3. 下方添加邊框作為分割線
 */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid $border-color;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  // 右側控制區
  .header-right {
    display: flex;
    gap: 12px;
    align-items: center;

    // 狀態選擇框
    .status-select {
      width: 120px;
    }

    // 返回按鈕
    .btn-back {
      padding: 8px 24px;
      height: 36px;
      border-radius: 6px;
      border: 1px solid $border-color;
      background-color: #fff;

      &:hover {
        background-color: #f5f5f5;
        border-color: $primary-green;
        color: $primary-green;
      }
    }
  }
}

// ===== 內容區域 =====
/**
 * 詳情內容容器
 * 功能說明：容納多個表格和信息區塊
 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/**
 * 載入骨架屏
 */
.loading-skeleton {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

// ===== 區塊樣式 =====
/**
 * 信息區塊
 * 功能說明：
 * 1. 白色背景卡片
 * 2. 圓角邊框和陰影
 * 3. 內邊距為內容預留空間
 */
.section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  // 區塊標題
  .section-title {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
    border-bottom: 2px solid $primary-green;
    padding-bottom: 10px;
  }

  // 表格樣式優化
  :deep(.el-table) {
    background-color: transparent;

    // 表格行 hover 效果
    .el-table__body tr:hover > td {
      background-color: #f5f9f7 !important;
    }

    // 表頭樣式
    .el-table__header th {
      background-color: #f1f6ef !important;
      font-weight: 600;
      border-bottom: 2px solid $border-color;
    }

    // 表格邊框
    .el-table__cell {
      border-color: $border-color;
      padding: 12px 0;
    }
  }
}

// ===== 總計區塊 =====
/**
 * 訂單總額顯示區
 * 功能說明：
 * 1. 右對齐顯示
 * 2. 突出總額數字
 * 3. 使用較大字體和加粗
 */
.total-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;

  // 總計標籤
  .total-label {
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
  }

  // 總額數字
  .total-amount {
    font-size: 24px;
    font-weight: 700;
    color: $primary-green;
  }
}

// ===== 響應式設計 =====
/**
 * 平板及以下螢幕的適配
 * 功能說明：
 * 1. 頂部控制區垂直堆疊
 * 2. 表格縮小字體
 */
@media (max-width: 768px) {
  .order-detail-container {
    padding: 15px 20px;
  }

  .content-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;

    .header-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .section {
    padding: 20px 15px;

    :deep(.el-table) {
      font-size: 13px;
    }
  }

  .total-section {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
