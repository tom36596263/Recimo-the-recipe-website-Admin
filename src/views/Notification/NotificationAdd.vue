<script setup>
import { ref } from 'vue';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
  title: '',
  target: 'all',
  category: 'general',
  content: ''
});

const imageFile = ref(null);
const imagePreview = ref(null);

const handlePublish = () => {
  console.log('發布消息:', form.value);
  // 這裡添加發布邏輯
};

const handleCancel = () => {
  router.back();
};

const handleImageUpload = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
    imageFile.value = file;
  };
  reader.readAsDataURL(file);
};

const handleRemoveImage = () => {
  imageFile.value = null;
  imagePreview.value = null;
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
        <el-button type="primary" class="btn-publish" @click="handlePublish">
          發布
        </el-button>
        <el-button class="btn-cancel" @click="handleCancel">
          取消
        </el-button>
      </div>
    </div>

    <!-- 表單區域 -->
    <div class="form-wrapper">
      <div class="form-content">
        <!-- 左側表單 -->
        <el-form :model="form" label-position="top" class="notification-form">
          <!-- 標題 -->
          <el-form-item label="標題">
            <el-input
              v-model="form.title"
              placeholder="請輸入標題"
              class="form-input"
            />
          </el-form-item>

          <!-- 發布對象 -->
          <el-form-item label="發布對象">
            <el-select
              v-model="form.target"
              placeholder="請選擇發布對象"
              class="form-select"
            >
              <el-option label="全部" value="all" />
              <el-option label="會員" value="member" />
              <el-option label="商家" value="merchant" />
              <el-option label="特定用戶" value="specific" />
            </el-select>
          </el-form-item>

          <!-- 消息類別 -->
          <el-form-item label="消息類別">
            <el-select
              v-model="form.category"
              placeholder="請選擇類別"
              class="form-select"
            >
              <el-option label="一般消息" value="general" />
              <el-option label="重要通知" value="important" />
              <el-option label="更新公告" value="update" />
              <el-option label="促銷訊息" value="promotion" />
            </el-select>
          </el-form-item>

          <!-- 消息內容 -->
          <el-form-item label="消息內容">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="8"
              placeholder="請輸入消息內容"
              class="form-textarea"
            />
          </el-form-item>
        </el-form>

        <!-- 右側圖片上傳 -->
        <div class="image-upload-box">
          <div v-if="!imagePreview" class="upload-placeholder">
            <el-upload
              drag
              action="#"
              :auto-upload="false"
              @change="(file) => handleImageUpload(file.raw)"
              accept="image/*"
            >
              <template #default>
                <div class="upload-content">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <p>新增圖片</p>
                </div>
              </template>
            </el-upload>
          </div>

          <div v-else class="image-preview">
            <img :src="imagePreview" alt="preview" />
            <el-button
              type="danger"
              size="small"
              class="btn-remove"
              @click="handleRemoveImage"
            >
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
.el-input{
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