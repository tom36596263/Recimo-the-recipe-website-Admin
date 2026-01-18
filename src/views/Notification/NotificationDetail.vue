<script setup>
// ===== 導入 =====
import { ref, onMounted } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue'; // 返回箭頭圖標
import { useRouter, useRoute } from 'vue-router'; // 路由相關
import { publicApi } from '@/utils/publicApi.js'; // 統一的 API 實例
import { ElMessage } from 'element-plus'; // 消息提示

// ===== 路由相關 =====
const router = useRouter(); // 用於導航
const route = useRoute(); // 用於獲取路由參數

// ===== 狀態管理 =====
// 通知詳情數據（包含類別、發布對象、日期、內容、圖片等）
const notification = ref({
  category: '系統維護預告',
  target: '會員',
  categoryType: '系統維護資訊',
  date: '2025/10/15',
  id: '1',
  content: `親愛的用戶您好：
為了提供更優質、穩定的服務與用戶，並保化促進商店改完整操作指南，我們將於下時段進行系統升級維護：

• 維護時間：2025年1月1日（三）-（預計4小時）
• 影響範圍：維護期間網頁所有用戶及App登入，食譜類資費用戶與員工部份。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。
• 更新重點：1. 優化食譜步驟排序功能，提升體驗流暢度。2. 提升伺服器穩定性。

維護您請上述時段使用服務。若操作發生異常，我們將立即程度幫助，不另行通知。您成的不便，敬請原諒。`,
  image: '/img/test1.jpg'
});

// 控制加載狀態（顯示 skeleton loading）
const loading = ref(true);

// ===== 方法 =====
/**
 * 獲取通知詳情（包括圖片）
 * 功能說明：
 * 1. 根據路由參數 ID 獲取對應通知的詳細信息
 * 2. 支持同步本地數據或非同步請求後端 API
 * 3. 加載過程中顯示 skeleton 動畫
 * 4. 錯誤時顯示提示信息
 */
const fetchNotificationDetail = async () => {
  try {
    loading.value = true; // 開始加載
    // 根據 route.params.id 獲取具體的通知信息
    const notificationId = route.params.id || '1';
    
    // 如果要串接後端，改為以下代碼：
    // const response = await publicApi.get(`notifications/${notificationId}`);
    // if (response.data) {
    //   notification.value = response.data;
    // }
    
    // 模擬延遲，使用本地數據（生產環境改為實際 API 請求）
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    // 捕獲錯誤並顯示提示
    console.error('獲取通知詳情失敗:', error);
    ElMessage.error('獲取數據失敗，請重新整理頁面');
  } finally {
    loading.value = false; // 加載完成
  }
};

/**
 * 返回上一頁
 * 功能說明：使用路由歷史返回
 */
const handleBack = () => {
  router.back();
};

// ===== 生命週期 =====
/**
 * 組件掛載完成時執行
 * 功能說明：頁面加載時自動獲取通知詳情
 */
onMounted(() => {
  fetchNotificationDetail();
});
</script>

<template>
  <div class="notification-detail-container">
    <!-- ===== 頂部區域 ===== -->
    <!-- 頁面標題和返回按鈕 -->
    <div class="content-header">
      <h1 class="zh-h2">消息詳情</h1>
      <!-- 返回按鈕，點擊返回上一頁 -->
      <el-button type="primary" class="btn-back" @click="handleBack">
        返回
      </el-button>
    </div>

    <!-- ===== 詳情內容區 ===== -->
    <div class="detail-wrapper">
      <!-- 加載狀態：顯示 skeleton 動畫 -->
      <el-skeleton v-if="loading" :rows="5" animated />
      
      <!-- 內容顯示：左側詳情 + 右側圖片 -->
      <div v-else class="detail-content">
        
        <!-- ===== 左側詳情信息 ===== -->
        <div class="detail-info">
          
          <!-- 第一行：標籤 + 消息編號 -->
          <div class="info-row">
            <div class="info-item">
              <label>標籤：</label>
              <span class="info-value">{{ notification.category }}</span>
            </div>
            <div class="info-item">
              <label>消息編號：</label>
              <span class="info-value">{{ notification.id }}</span>
            </div>
          </div>

          <!-- 第二行：發布對象 + 發布日期 -->
          <div class="info-row">
            <div class="info-item">
              <label>發布對象：</label>
              <span class="info-value">{{ notification.target }}</span>
            </div>
            <div class="info-item">
              <label>發布日期：</label>
              <span class="info-value">{{ notification.date }}</span>
            </div>
          </div>

          <!-- 第三行：消息類別（佔滿整行） -->
          <div class="info-row">
            <div class="info-item full-width">
              <label>消息類別：</label>
              <span class="info-value">{{ notification.categoryType }}</span>
            </div>
          </div>

          <!-- 消息內容區：可滾動的文本框 -->
          <div class="info-section">
            <label>消息內容</label>
            <div class="content-box">
              <!-- 按換行符分割內容並逐行顯示 -->
              <p v-for="(line, index) in notification.content.split('\n')" :key="index">
                {{ line }}
              </p>
            </div>
          </div>
        </div>

        <!-- ===== 右側圖片 ===== -->
        <div class="detail-image">
          <!-- 消息圖片展示 -->
          <img :src="notification.image" alt="notification" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ===== 顏色變數定義 =====
$primary-green: #438b69; // 主題綠色
$border-color: #e0e0e0; // 邊框顏色
$text-color: #333; // 文本顏色

// ===== 容器樣式 =====
/**
 * 頁面容器
 * 功能：設置頁面內邊距，為內容預留空間
 */
.notification-detail-container {
  padding: 20px 30px;
}

// ===== 頂部區域樣式 =====
/**
 * 頂部標題和按鈕區
 * 功能說明：
 * 1. 使用 flexbox 佈局，標題左對齐，按鈕右對齐
 * 2. 下方添加邊框作為分割線
 * 3. 設置下邊距以分隔內容區域
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

  // 返回按鈕樣式
  .btn-back {
    background-color: $primary-green;
    border-color: $primary-green;
    padding: 8px 24px;
    height: 36px;
    border-radius: 6px;

    &:hover {
      background-color: #367054;
      border-color: #367054;
    }
  }
}

// ===== 詳情區域樣式 =====
/**
 * 詳情內容容器
 * 功能說明：
 * 1. 白色背景卡片設計
 * 2. 圓角邊框和陰影增加視覺層次
 * 3. 內邊距為內容預留空間
 */
.detail-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/**
 * 詳情內容網格佈局
 * 功能說明：
 * 1. 使用 CSS Grid 實現左右兩欄布局
 * 2. 左欄：詳情信息
 * 3. 右欄：圖片展示（寬度固定 250px）
 * 4. 間隔設置為 40px
 */
.detail-content {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 40px;
}

// ===== 左側詳情信息樣式 =====
/**
 * 詳情信息容器
 * 功能說明：使用 flex 列佈局，各信息塊垂直堆疊
 */
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/**
 * 信息行樣式
 * 功能說明：
 * 1. 使用 Grid 實現兩列佈局（每列占 1fr）
 * 2. 下方添加邊框作為分割線
 * 3. 內邊距為內容預留空間
 */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  border-bottom: 1px solid $border-color;
  padding-bottom: 15px;

  // 單個信息項樣式
  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    // 全寬信息項（佔據整行）
    &.full-width {
      grid-column: 1 / -1;
    }

    // 標籤樣式
    label {
      font-weight: 600;
      color: $text-color;
      white-space: nowrap; // 防止標籤換行
      min-width: 70px;
    }

    // 信息值樣式（允許換行）
    .info-value {
      color: #666;
      word-break: break-all;
    }
  }
}

/**
 * 信息段落樣式（用於消息內容區）
 * 功能說明：
 * 1. 標籤和內容垂直堆疊
 * 2. 設置間隔
 */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  // 標籤樣式
  label {
    font-weight: 600;
    color: $text-color;
    font-size: 14px;
  }

  // 內容框樣式
  .content-box {
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 15px;
    background-color: #f9f9f9;
    min-height: 150px;
    max-height: 300px;
    overflow-y: auto; // 內容過長時出現滾動條

    // 文本段落樣式
    p {
      margin: 8px 0;
      color: #555;
      line-height: 1.6; // 增加行高，提高可讀性
      font-size: 14px;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

// ===== 右側圖片樣式 =====
/**
 * 圖片展示容器
 * 功能說明：
 * 1. 使用 flex 居中圖片
 * 2. flex-start 使圖片靠上對齊
 */
.detail-image {
  display: flex;
  justify-content: center;
  align-items: flex-start;

  // 圖片樣式
  img {
    width: 100%; // 響應式寬度
    max-width: 250px; // 最大寬度限制
    border-radius: 8px;
    object-fit: cover; // 保持寬高比，填充容器
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// ===== 響應式設計 =====
/**
 * 平板及以下螢幕的適配
 * 功能說明：
 * 1. 左右兩欄變為上下排列
 * 2. 圖片居中顯示
 */
@media (max-width: 1024px) {
  .detail-content {
    grid-template-columns: 1fr; // 改為單列
    gap: 20px;
  }

  .detail-image {
    justify-content: center;
    align-items: center;
  }
}
</style>