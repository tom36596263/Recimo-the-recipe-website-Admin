<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';

const router = useRouter();
const route = useRoute();

const form = ref({
  title: '',
  category: '',
  content: ''
});

const loadFaqDetail = async () => {
  try {
    const faqId = Number(route.params.id);
    const response = await publicApi.get('data/others/faqs.json');
    if (Array.isArray(response.data)) {
      const found = response.data.find(item => item.faq_id === faqId);
      if (found) {
        form.value = {
          title: found.faq_title,
          category: found.faq_type,
          content: found.faq_content
        };
      }
    }
  } catch (e) {
    // 可加錯誤提示
  }
};

onMounted(() => {
  loadFaqDetail();
});

const handlePublish = () => {
  console.log('發布表單:', form.value);
  // 這裡添加發布邏輯
};

const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="faq-add-container">
    <!-- 頂部 -->
    <div class="content-header">
      <div class="header-left">
        <el-icon class="back-icon" @click="handleCancel">
          <ArrowLeft />
        </el-icon>
        <h1 class="zh-h2">編輯常見問題</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" class="btn-publish" @click="handlePublish">
          儲存
        </el-button>
        <el-button class="btn-cancel" @click="handleCancel">
          取消
        </el-button>
      </div>
    </div>

    <!-- 表單區域 -->
    <div class="form-wrapper">
      <el-form :model="form" label-position="top" class="faq-form">
        <!-- 標題 -->
        <el-form-item label="標題">
          <el-input
            v-model="form.title"
            placeholder="請輸入標題"
            class="form-input"
          />
        </el-form-item>

        <!-- 問題分類 -->
        <el-form-item label="問題分類">
          <el-select
            v-model="form.category"
            placeholder="請選擇分類"
            class="form-select"
          >
            <el-option label="請選擇" value="help" />
            <el-option label="帳號相關" value="account" />
            <el-option label="食譜相關" value="recipe" />
            <el-option label="購物相關" value="shopping" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <!-- 問題內容 -->
        <el-form-item label="問題內容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="請輸入問題內容"
            class="form-textarea"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-green: #438b69;
$hover-green: #367054;
$border-color: #e0e0e0;

.faq-add-container {
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
.form-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.faq-form {
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

  .el-input{
    border: 0;
    padding: 0;
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
</style>