<script setup>
// ===== 導入 =====
import { ref, onMounted, reactive } from 'vue';
import { ArrowLeft, Edit, Delete, Plus } from '@element-plus/icons-vue'; // 圖標
import { useRouter, useRoute } from 'vue-router'; // 路由相關
import { phpApi } from '@/utils/publicApi.js'; // 統一的 API 實例
import { ElMessage, ElMessageBox } from 'element-plus'; // 消息提示
import { parsePublicFile } from '@/utils/parseFile.js'; // 圖片路徑處理

// ===== 路由相關 =====
const router = useRouter(); // 用於導航
const route = useRoute(); // 用於獲取路由參數

// ===== 狀態管理 =====
// 通知詳情數據（包含類別、日期、內容、圖片等）
const notification = ref({});

// 編輯模式的表單數據
const editForm = reactive({
  title: '',
  category: '',
  categoryType: '',
  content: ''
});

// 控制加載狀態（顯示 skeleton loading）
const loading = ref(true);

// 控制編輯模式
const isEditMode = ref(false);

// 控制保存中狀態
const isSaving = ref(false);

// 圖片相關
const newImageFile = ref(null);
const newImagePreview = ref(null);
const formRef = ref(null);

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
    loading.value = true;
    const notificationId = Number(route.params.id);

    // 調用 API 獲取通知詳情
    const response = await phpApi.get(`social/admin_notifications.php?id=${notificationId}`);

    if (response.data.success) {
      const found = response.data.data;
      notification.value = {
        id: found.notification_id,
        title: found.notification_title,
        category: found.notification_type,
        categoryType: found.notification_type,
        date: found.created_at,
        content: found.notification_content,
        image: found.notification_photo_url || ''
      };

      // 初始化編輯表單
      Object.assign(editForm, {
        title: notification.value.title,
        category: notification.value.category,
        categoryType: notification.value.categoryType,
        content: notification.value.content
      });
    } else {
      ElMessage.error(response.data.message || '查無此通知');
    }
  } catch (error) {
    console.error('獲取通知詳情失敗:', error);
    ElMessage.error('獲取數據失敗，請重新整理頁面');
  } finally {
    loading.value = false;
  }
};

/**
 * 返回上一頁
 * 功能說明：使用路由歷史返回
 */
const handleBack = () => {
  if (isEditMode.value) {
    ElMessageBox.confirm(
      '您有未保存的更改，確定要離開嗎？',
      '確認離開',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.back();
    }).catch(() => { });
  } else {
    router.back();
  }
};

/**
 * 切換編輯模式
 */
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    // 取消編輯時重置表單
    Object.assign(editForm, {
      title: notification.value.title,
      category: notification.value.category,
      categoryType: notification.value.categoryType,
      content: notification.value.content
    });
    newImageFile.value = null;
    newImagePreview.value = null;
  }
};

/**
 * 保存編輯
 */
const handleSaveEdit = async () => {
  // 驗證表單
  if (!editForm.title || !editForm.content) {
    ElMessage.warning('標題和內容不能為空');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '確定要保存修改嗎？',
      '確認保存',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
  } catch {
    return;
  }

  isSaving.value = true;

  try {
    // 構建 FormData（包含圖片和表單數據）
    const formData = new FormData();
    formData.append('notification_id', notification.value.id);
    formData.append('notification_title', editForm.title);
    formData.append('notification_type', editForm.categoryType);
    formData.append('notification_content', editForm.content);
    formData.append('link_url', '');

    // 傳送現有圖片 URL（如果沒有新圖片，PHP 會保留此值）
    formData.append('notification_photo_url', notification.value.image || '');

    // 如果有新圖片，添加到 FormData（欄位名為 notification_photo）
    if (newImageFile.value) {
      formData.append('notification_photo', newImageFile.value);
    }

    // 調試：輸出 FormData 內容
    console.log('=== 發送的編輯數據 ===');
    console.log('notification_id:', notification.value.id);
    console.log('notification_title:', editForm.title);
    console.log('notification_type:', editForm.categoryType);
    console.log('notification_content:', editForm.content);
    console.log('notification_photo_url:', notification.value.image || '');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    // 調用更新 API（使用 POST 因為 PUT 不支持文件上傳）
    const response = await phpApi.post('social/admin_notifications.php?_method=PUT', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      // 更新本地數據
      notification.value.title = editForm.title;
      notification.value.category = editForm.category;
      notification.value.categoryType = editForm.categoryType;
      notification.value.content = editForm.content;
      if (newImagePreview.value) {
        notification.value.image = response.data.photo_url || newImagePreview.value;
      }

      ElMessage.success('保存成功！');
      isEditMode.value = false;
      newImageFile.value = null;
      newImagePreview.value = null;
    } else {
      ElMessage.error(response.data.message || '保存失敗');
    }

  } catch (error) {
    console.error('保存失敗:', error);
    ElMessage.error('保存失敗，請稍後重試');
  } finally {
    isSaving.value = false;
  }
};

/**
 * 刪除通知
 */
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '刪除後將無法恢復，確定要刪除此通知嗎？',
      '確認刪除',
      {
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    // 調用刪除 API
    const response = await phpApi.delete('social/admin_notifications.php', {
      data: { notification_id: notification.value.id }
    });

    if (response.data.success) {
      ElMessage.success('刪除成功！');

      // 跳轉回列表頁
      setTimeout(() => {
        router.push('/admin/notifications');
      }, 500);
    } else {
      ElMessage.error(response.data.message || '刪除失敗');
    }

  } catch (error) {
    if (error === 'cancel') {
      return; // 用戶取消
    }
    console.error('刪除失敗:', error);
    ElMessage.error('刪除失敗，請稍後重試');
  }
};

/**
 * 處理圖片上傳
 */
const handleImageUpload = (file) => {
  // 驗證圖片大小（限制 5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('圖片大小不能超過 5MB');
    return;
  }

  // 驗證圖片格式
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF 格式的圖片');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    newImagePreview.value = e.target.result;
    newImageFile.value = file;
    ElMessage.success('圖片添加成功');
  };
  reader.readAsDataURL(file);
};

/**
 * 移除新圖片
 */
const handleRemoveNewImage = () => {
  newImageFile.value = null;
  newImagePreview.value = null;
  ElMessage.info('圖片已移除');
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
      <div class="header-left">
        <el-icon class="back-icon" @click="handleBack">
          <ArrowLeft />
        </el-icon>
        <h1 class="zh-h2">消息詳情</h1>
      </div>
      <div class="header-actions">
        <!-- 編輯模式按鈕組 -->
        <template v-if="isEditMode">
          <el-button type="primary" class="btn-save" :loading="isSaving" :disabled="isSaving" @click="handleSaveEdit">
            {{ isSaving ? '保存中...' : '保存' }}
          </el-button>
          <el-button class="btn-cancel" @click="toggleEditMode" :disabled="isSaving">
            取消
          </el-button>
        </template>
        <!-- 查看模式按鈕組 -->
        <template v-else>
          <el-button type="primary" class="btn-edit" :icon="Edit" @click="toggleEditMode">
            編輯
          </el-button>
          <el-button type="danger" class="btn-delete" :icon="Delete" @click="handleDelete">
            刪除
          </el-button>
          <el-button class="btn-back" @click="handleBack">
            返回
          </el-button>
        </template>
      </div>
    </div>

    <!-- ===== 詳情內容區 ===== -->
    <div class="detail-wrapper">
      <!-- 加載狀態：顯示 skeleton 動畫 -->
      <el-skeleton v-if="loading" :rows="5" animated />

      <!-- 內容顯示：左側詳情 + 右側圖片 -->
      <div v-else class="detail-content">

        <!-- ===== 左側詳情信息 ===== -->
        <div class="detail-info">

          <!-- 查看模式 -->
          <template v-if="!isEditMode">
            <!-- 第一行：標題 -->
            <div class="info-row">
              <div class="info-item full-width">
                <label>標題：</label>
                <span class="info-value">{{ notification.title }}</span>
              </div>
            </div>

            <!-- 第二行：消息編號 -->
            <div class="info-row">
              <div class="info-item full-width">
                <label>消息編號：</label>
                <span class="info-value">{{ notification.id }}</span>
              </div>
            </div>

            <!-- 第三行：發布日期（佔滿整行） -->
            <div class="info-row">
              <div class="info-item full-width">
                <label>發布日期：</label>
                <span class="info-value">{{ notification.date }}</span>
              </div>
            </div>

            <!-- 第四行：消息類別（佔滿整行） -->
            <div class="info-row">
              <div class="info-item full-width">
                <label>消息類別：</label>
                <span class="info-value">{{ getCategoryLabel(notification.categoryType) }}</span>
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
          </template>

          <!-- 編輯模式 -->
          <template v-else>
            <el-form :model="editForm" label-position="top" class="edit-form">
              <!-- 標題 -->
              <el-form-item label="標題" required>
                <el-input v-model="editForm.title" placeholder="請輸入標題" maxlength="100" show-word-limit />
              </el-form-item>

              <!-- 消息類別 -->
              <el-form-item label="消息類別" required>
                <el-select v-model="editForm.categoryType" placeholder="請選擇">
                  <el-option label="一般消息" value="general" />
                  <el-option label="重要通知" value="important" />
                  <el-option label="系統公告" value="system" />
                  <el-option label="促銷活動" value="promotion" />
                  <el-option label="功能更新" value="update" />
                </el-select>
              </el-form-item>

              <!-- 消息內容 -->
              <el-form-item label="消息內容" required>
                <el-input v-model="editForm.content" type="textarea" :rows="8" placeholder="請輸入消息內容" maxlength="1000"
                  show-word-limit />
              </el-form-item>
            </el-form>
          </template>
        </div>

        <!-- ===== 右側圖片 ===== -->
        <div class="detail-image" v-if="notification.image || isEditMode">
          <!-- 查看模式 -->
          <template v-if="!isEditMode">
            <img v-if="notification.image" :src="parsePublicFile(notification.image)" alt="notification" />
          </template>

          <!-- 編輯模式 -->
          <template v-else>
            <div class="image-edit-box">
              <!-- 顯示新圖片預覽或原圖片 -->
              <div v-if="newImagePreview || notification.image" class="image-preview">
                <img :src="newImagePreview || parsePublicFile(notification.image)" alt="notification" />
                <el-button v-if="newImagePreview" type="danger" size="small" class="btn-remove-image"
                  @click="handleRemoveNewImage">
                  移除新圖片
                </el-button>
              </div>

              <!-- 上傳新圖片 -->
              <el-upload drag action="#" :auto-upload="false" @change="(file) => handleImageUpload(file.raw)"
                accept="image/*" :show-file-list="false">
                <template #default>
                  <div class="upload-content">
                    <el-icon class="upload-icon">
                      <Plus />
                    </el-icon>
                    <p>{{ newImagePreview ? '更換圖片' : '上傳新圖片' }}</p>
                  </div>
                </template>
              </el-upload>
            </div>
          </template>
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;

    .back-icon {
      font-size: 24px;
      cursor: pointer;
      color: #666;
      transition: color 0.3s;

      &:hover {
        color: $primary-green;
      }
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  // 操作按鈕組
  .header-actions {
    display: flex;
    gap: 12px;

    // 保存按鈕樣式
    .btn-save {
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

    // 編輯按鈕樣式
    .btn-edit {
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

    // 刪除按鈕樣式
    .btn-delete {
      padding: 8px 24px;
      height: 36px;
      border-radius: 6px;
    }

    // 返回/取消按鈕樣式
    .btn-back,
    .btn-cancel {
      padding: 8px 24px;
      height: 36px;
      border-radius: 6px;
      border: 1px solid $border-color;
      background-color: transparent;

      &:hover {
        background-color: #f5f5f5;
      }
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
  grid-template-columns: 1fr;
  gap: 40px;

  &:has(.detail-image) {
    grid-template-columns: 1fr 250px;
  }
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

// ===== 編輯模式樣式 =====
/**
 * 編輯表單樣式
 */
.edit-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: $text-color;
      padding-bottom: 8px;
    }
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

/**
 * 表單行並排佈局
 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

/**
 * 圖片編輯容器
 */
.image-edit-box {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;

  .image-preview {
    position: relative;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;

    img {
      width: 100%;
      max-width: 250px;
      border-radius: 8px;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn-remove-image {
      margin-top: 10px;
      width: 100%;
      max-width: 250px;
    }
  }

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 20px;
    border: 2px dashed $border-color;
    border-radius: 8px;
    background-color: #f9f9f9;

    &:hover {
      border-color: $primary-green;
      background-color: #f0f7f4;
    }
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;

    .upload-icon {
      font-size: 36px;
      color: $primary-green;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  }
}
</style>