<script setup>

import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';

const router = useRouter();


const form = ref({
  title: '',
  category: 0,
  content: ''
});

const rules = {
  title: [
    { required: true, message: '請輸入標題', trigger: 'blur' }
  ],
  category: [
    { required: true, validator: (rule, value, callback) => {
      if (!value || value === 0) {
        callback(new Error('請選擇分類'));
      } else {
        callback();
      }
    }, trigger: 'change' }
  ],
  content: [
    { required: true, message: '請輸入問題內容', trigger: 'blur' }
  ]
};

const formRef = ref();


const categoryOptions = ['Recimo功能', '食譜與社群', 'Recimo商城', '其他'];

const handlePublish = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('請完整填寫表單');
      return;
    }
    try {
      const payload = new URLSearchParams();
      payload.append('faq_type', form.value.category);
      payload.append('faq_title', form.value.title);
      payload.append('faq_answer', form.value.content);

      const response = await phpApi.post('/system/faqs.php', payload);
      if (response.data.success) {
        ElMessage.success('FAQ 已新增');
        router.back();
      } else {
        ElMessage.error(response.data.message || '新增失敗');
        console.error(response.data.message || '新增失敗');
      }
    } catch (e) {
      ElMessage.error('新增失敗');
      console.error(e);
    }
  });
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
        <h1 class="zh-h2">新增常見問題</h1>
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
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="faq-form">
        <!-- 標題 -->
        <el-form-item label="標題" prop="title" required>
          <el-input v-model="form.title" placeholder="請輸入標題" class="form-input" />
        </el-form-item>

        <!-- 問題分類 -->
        <el-form-item label="問題分類" prop="category" required>
          <el-select v-model="form.category" placeholder="請選擇分類" class="form-select" filterable>
            <el-option label="請選擇" :value="0" />
            <el-option v-for="value in categoryOptions" :key="value" :label="value" :value="value" />
          </el-select>
        </el-form-item>

        <!-- 問題內容 -->
        <el-form-item label="問題內容" prop="content" required>
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="請輸入問題內容" class="form-textarea" />
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