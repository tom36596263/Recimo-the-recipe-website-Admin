<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const visible = ref(false)
const mode = ref('add') // 'add' 或 'edit'

const initialForm = {
  id: '',
  name: '',
  category: '',
  unit: '',
  carbs: '',
  protein: '',
  fat: '',
  calories: '',
  imageUrl: ''
}

const form = reactive({ ...initialForm })

// 開啟彈窗的方法，供父組件調用
const open = (type, data = null) => {
  mode.value = type
  if (type === 'edit' && data) {
    Object.assign(form, data)
  } else {
    Object.assign(form, initialForm)
  }
  visible.value = true
}

const handleImageChange = (file) => {
  // 這裡處理圖片預覽邏輯
  form.imageUrl = URL.createObjectURL(file.raw)
}

const handleSubmit = () => {
  console.log('提交數據:', form)
  visible.value = false
}

const handleClosed = () => {
  // 彈窗關閉後重置數據
  Object.assign(form, initialForm)
}

// 暴露方法給父組件
defineExpose({ open })
</script>


<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增食材' : '食材詳情'"
    width="650px"
    class="ingredient-dialog"
    @closed="handleClosed"
  >
    <el-form :model="form" label-position="top" class="ingredient-form">
      <div class="form-container">
        <div class="form-left">
          <el-form-item label="食材名稱">
            <el-input v-model="form.name" placeholder="請輸入名稱" />
          </el-form-item>
          
          <el-form-item label="食材分類">
            <el-select v-model="form.category" placeholder="請選擇" style="width: 100%">
              <el-option label="蛋、乳製品" value="eggs_dairy" />
              <el-option label="肉類" value="meat" />
              <el-option label="蔬菜" value="vegetables" />
            </el-select>
          </el-form-item>

          <el-form-item label="計量單位">
            <el-input v-model="form.unit" placeholder="如：顆、克" />
          </el-form-item>

          <div v-if="mode === 'edit'" class="ingredient-id">
            <label>食材編號</label>
            <p>{{ form.id }}</p>
          </div>

          <div class="upload-section">
            <el-upload
              class="ingredient-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              @change="handleImageChange"
            >
              <div v-if="form.imageUrl" class="preview-container">
                <img :src="form.imageUrl" class="preview-img" />
              </div>
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>新增圖片</span>
              </div>
            </el-upload>
          </div>
        </div>

        <div class="form-right">
          <el-form-item label="碳水">
            <el-input v-model="form.carbs" placeholder="g" />
          </el-form-item>
          
          <el-form-item label="蛋白質">
            <el-input v-model="form.protein" placeholder="g" />
          </el-form-item>

          <el-form-item label="脂質">
            <el-input v-model="form.fat" placeholder="g" />
          </el-form-item>

          <el-form-item label="熱量">
            <el-input v-model="form.calories" placeholder="100 (kcal / 100g)">
              <template v-if="mode === 'edit'" #suffix>(kcal / 100g)</template>
            </el-input>
          </el-form-item>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="success" class="btn-submit" @click="handleSubmit">
          {{ mode === 'add' ? '新增' : '儲存' }}
        </el-button>
        <el-button class="btn-close" @click="visible = false">關閉</el-button>
      </div>
    </template>
  </el-dialog>
</template>


<style lang="scss">
.ingredient-dialog {
  border-radius: 8px;
  overflow: hidden;

  .el-dialog__header {
    background-color: #e8f5e9; // 淺綠色頂部
    margin-right: 0;
    padding: 15px 20px;
    .el-dialog__title {
      font-weight: bold;
      color: #333;
    }
  }

  .form-container {
    display: flex;
    gap: 40px;
    padding: 10px 20px;
  }

  .form-left, .form-right {
    flex: 1;
  }

  .el-form-item {
    margin-bottom: 18px;
    .el-form-item__label {
      padding-bottom: 4px;
      font-weight: 500;
    }
  }

  // 食材編號樣式
  .ingredient-id {
    margin-bottom: 15px;
    label {
      display: block;
      color: #606266;
      font-size: 14px;
      margin-bottom: 4px;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #333;
    }
  }

  // 圖片上傳框樣式
  .upload-section {
    margin-top: 20px;
    .ingredient-uploader {
      .el-upload {
        border: 1px solid #dcdfe6;
        border-radius: 8px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        width: 120px;
        height: 120px;
        transition: border-color 0.3s;
        &:hover { border-color: #67c23a; }
      }
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #909399;
      font-size: 12px;
      .el-icon { font-size: 20px; margin-bottom: 8px; }
    }
    .preview-img {
      width: 120px;
      height: 120px;
      object-fit: cover;
    }
  }

  // 底部按鈕樣式
  .dialog-footer {
    padding: 10px 20px 20px;
    .btn-submit {
      background-color: #40916c;
      border-color: #40916c;
      padding: 10px 30px;
      &:hover { background-color: #2d6a4f; }
    }
    .btn-close {
      background-color: #40916c;
      color: white;
      padding: 10px 30px;
      &:hover { opacity: 0.9; }
    }
  }
}
</style>