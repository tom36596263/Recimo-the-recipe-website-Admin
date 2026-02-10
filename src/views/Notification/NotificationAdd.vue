<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

// 表單數據
const form = ref({
  title: '',
  category: 'general',
  content: '',
  sendTarget: 'all', // 發送對象：all（全部）/ specific（特定用戶）
  selectedUsers: [] // 選中的用戶 ID 列表
});

// 用戶列表
const userList = ref([]);
const isLoadingUsers = ref(false);

// 表單驗證規則
const rules = reactive({
  title: [
    { required: true, message: '請輸入標題', trigger: 'blur' },
    { min: 2, max: 100, message: '標題長度應在 2 到 100 個字符之間', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '請選擇消息類別', trigger: 'change' }
  ],
  content: [
    { required: true, message: '請輸入消息內容', trigger: 'blur' },
    { min: 10, max: 1000, message: '內容長度應在 10 到 1000 個字符之間', trigger: 'blur' }
  ],
  sendTarget: [
    { required: true, message: '請選擇發送對象', trigger: 'change' }
  ],
  selectedUsers: [
    {
      validator: (rule, value, callback) => {
        if (form.value.sendTarget === 'specific' && (!value || value.length === 0)) {
          callback(new Error('請至少選擇一位用戶'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
});

const imageFile = ref(null);
const imagePreview = ref(null);
const formRef = ref(null);
const isSubmitting = ref(false);

/**
 * 獲取用戶列表
 */
const fetchUsers = async () => {
  isLoadingUsers.value = true;
  try {
    const response = await phpApi.get('auth/get_members.php');
    if (response.data && Array.isArray(response.data)) {
      // 過濾掉系統帳號（user_id = 1）
      userList.value = response.data
        .filter(user => user.user_id !== 1)
        .map(user => ({
          value: user.user_id,
          label: `${user.user_name} (${user.user_email})`
        }));
    }
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    ElMessage.error('獲取用戶列表失敗');
  } finally {
    isLoadingUsers.value = false;
  }
};

/**
 * 組件掛載時獲取用戶列表
 */
onMounted(() => {
  fetchUsers();
});

/**
 * 發布消息
 */
const handlePublish = async () => {
  // 驗證表單
  if (!formRef.value) {
    ElMessage.error('表單初始化失敗');
    return;
  }

  try {
    await formRef.value.validate();
  } catch (error) {
    ElMessage.warning('請完整填寫表單');
    return;
  }

  // 二次確認
  try {
    await ElMessageBox.confirm(
      '確定要發布此消息嗎？',
      '確認發布',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
  } catch {
    return; // 用戶取消
  }

  isSubmitting.value = true;

  try {
    // 構建 FormData（包含圖片和表單數據）
    const formData = new FormData();
    formData.append('notification_title', form.value.title);
    formData.append('notification_type', form.value.category);
    formData.append('notification_content', form.value.content);
    
    // 根據發送對象設置 receiver_id
    if (form.value.sendTarget === 'all') {
      formData.append('receiver_id', 0); // 0 表示發送給全部會員
    } else {
      // 發送給特定用戶，傳遞用戶 ID 陣列（JSON 字符串）
      formData.append('receiver_id', JSON.stringify(form.value.selectedUsers));
    }
    
    formData.append('link_url', '');

    // 如果有圖片，添加到 FormData（欄位名為 notification_photo）
    if (imageFile.value) {
      formData.append('notification_photo', imageFile.value);
    }

    // 調試：輸出 FormData 內容
    console.log('=== 發送的 FormData ===');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    // 調用發布 API（使用 multipart/form-data）
    const response = await phpApi.post('social/admin_notifications.php', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      // 顯示發送結果（包含發送給多少用戶的信息）
      const successMsg = response.data.message || '消息發布成功！';
      ElMessage.success({
        message: successMsg,
        duration: 3000
      });

      // 跳轉回列表頁
      setTimeout(() => {
        router.push('/admin/notifications');
      }, 1000);
    } else {
      ElMessage.error(response.data.message || '發布失敗');
    }

  } catch (error) {
    console.error('發布失敗:', error);
    console.error('錯誤詳情:', error.response?.data);

    // 顯示後端返回的詳細錯誤信息
    const errorMsg = error.response?.data?.message || error.message || '發布失敗，請稍後重試';
    ElMessage.error(errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 取消操作
 */
const handleCancel = async () => {
  // 檢查是否有未保存的內容
  const hasContent = form.value.title || form.value.content || imageFile.value || form.value.selectedUsers.length > 0;

  if (hasContent) {
    try {
      await ElMessageBox.confirm(
        '您有未保存的內容，確定要離開嗎？',
        '確認取消',
        {
          confirmButtonText: '確定',
          cancelButtonText: '繼續編輯',
          type: 'warning'
        }
      );
      router.back();
    } catch {
      return; // 用戶選擇繼續編輯
    }
  } else {
    router.back();
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
    imagePreview.value = e.target.result;
    imageFile.value = file;
    ElMessage.success('圖片添加成功');
  };
  reader.readAsDataURL(file);
};

/**
 * 移除圖片
 */
const handleRemoveImage = () => {
  imageFile.value = null;
  imagePreview.value = null;
  ElMessage.info('圖片已移除');
};
</script>

<template>
  <div class="notification-add-container">
    <!-- 頂部 -->
    <div class="content-header">
      <div class="header-left">
        <el-icon class="back-icon" @click="handleCancel">
          <ArrowLeft />
        </el-icon>
        <h1 class="zh-h2">發布消息</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" class="btn-publish" @click="handlePublish" :loading="isSubmitting"
          :disabled="isSubmitting">
          {{ isSubmitting ? '發布中...' : '發布' }}
        </el-button>
        <el-button class="btn-cancel" @click="handleCancel" :disabled="isSubmitting">
          取消
        </el-button>
      </div>
    </div>

    <!-- 表單區域 -->
    <div class="form-wrapper">
      <div class="form-content">
        <!-- 左側表單 -->
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="notification-form">
          <!-- 標題 -->
          <el-form-item label="標題" prop="title">
            <el-input v-model="form.title" placeholder="請輸入標題（2-100 字符）" class="form-input" maxlength="100"
              show-word-limit />
          </el-form-item>

          <!-- 消息類別 -->
          <el-form-item label="消息類別" prop="category">
            <el-select v-model="form.category" placeholder="請選擇類別" class="form-select">
              <el-option label="一般消息" value="general" />
              <el-option label="重要通知" value="important" />
              <el-option label="系統公告" value="system" />
              <el-option label="促銷活動" value="promotion" />
              <el-option label="功能更新" value="update" />
            </el-select>
          </el-form-item>

          <!-- 發送對象 -->
          <el-form-item label="發送對象" prop="sendTarget">
            <el-radio-group v-model="form.sendTarget" class="send-target-group">
              <el-radio value="all">全部用戶</el-radio>
              <el-radio value="specific">特定用戶</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 選擇用戶（僅在選擇特定用戶時顯示） -->
          <el-form-item 
            v-if="form.sendTarget === 'specific'" 
            label="選擇用戶" 
            prop="selectedUsers"
          >
            <el-select
              v-model="form.selectedUsers"
              multiple
              filterable
              placeholder="請選擇要發送的用戶"
              class="form-select"
              :loading="isLoadingUsers"
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
            >
              <el-option
                v-for="user in userList"
                :key="user.value"
                :label="user.label"
                :value="user.value"
              />
            </el-select>
            <div class="selected-count" v-if="form.selectedUsers.length > 0">
              已選擇 {{ form.selectedUsers.length }} 位用戶
            </div>
          </el-form-item>

          <!-- 消息內容 -->
          <el-form-item label="消息內容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="8" placeholder="請輸入消息內容（10-1000 字符）"
              class="form-textarea" maxlength="1000" show-word-limit />
          </el-form-item>
        </el-form>

        <!-- 右側圖片上傳 -->
        <div class="image-upload-box">
          <div v-if="!imagePreview" class="upload-placeholder">
            <el-upload drag action="#" :auto-upload="false" @change="(file) => handleImageUpload(file.raw)"
              accept="image/*">
              <template #default>
                <div class="upload-content">
                  <el-icon class="upload-icon">
                    <Plus />
                  </el-icon>
                  <p>新增圖片</p>
                </div>
              </template>
            </el-upload>
          </div>

          <div v-else class="image-preview">
            <img :src="imagePreview" alt="preview" />
            <el-button type="danger" size="small" class="btn-remove" @click="handleRemoveImage">
              移除圖片
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-green: #438b69;
$hover-green: #367054;
$border-color: #e0e0e0;

.notification-add-container {
  padding: 20px 30px;
}

// 頂部區域
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

  .header-right {
    display: flex;
    gap: 12px;

    .btn-publish {
      background-color: $primary-green;
      border-color: $primary-green;
      padding: 8px 24px;
      height: 36px;
      border-radius: 6px;

      &:hover {
        background-color: $hover-green;
        border-color: $hover-green;
      }
    }

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

// 表單區域
.el-input {
  border: 0;
  padding: 0;
}

.form-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.notification-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: #333;
      padding-bottom: 8px;
    }

    .el-form-item__content {
      width: 100%;
    }
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;

    :deep(.el-input__wrapper) {
      border-radius: 4px;
      height: 40px;
      width: 100%;
      box-sizing: border-box;
    }

    :deep(.el-input__inner) {
      width: 100%;
    }
  }

  .form-select {
    width: 100%;
    box-sizing: border-box;

    :deep(.el-input__wrapper) {
      border-radius: 4px;
      height: 40px;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .form-textarea {
    width: 100%;
    box-sizing: border-box;

    :deep(.el-textarea__inner) {
      border-radius: 4px;
      font-family: inherit;
      resize: none;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .send-target-group {
    width: 100%;

    :deep(.el-radio) {
      margin-right: 30px;
    }
  }

  .selected-count {
    margin-top: 8px;
    font-size: 12px;
    color: $primary-green;
    font-weight: 500;
  }
}

// 圖片上傳區域
.image-upload-box {
  border: 2px dashed $border-color;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #f9f9f9;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  :deep(.el-upload) {
    width: 100%;
    height: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 100%;
    border: none;
    background-color: transparent;
    padding: 0;
    border-radius: 0;

    &:hover {
      background-color: transparent;
    }
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 4px;
    object-fit: cover;
  }

  .btn-remove {
    width: 100%;
  }
}
</style>