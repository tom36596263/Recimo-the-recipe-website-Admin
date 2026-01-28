<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
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


const categoryMap = {
  'fresh-produce': '新鮮食材',
  'fruits': '水果',
  'meat-poultry': '肉類/家禽',
  'seafood': '海鮮',
  'dairy-eggs-soy': '乳製品/蛋/豆製品',
  'grains-pasta-bakery': '穀類/麵食/烘焙',
  'condiments-sauces-oils': '調味/醬料/油',
  'pantry-spices-nuts': '乾貨/香料/堅果',
  'others': '其他'
}

const form = reactive({ ...initialForm })

// 取得 $parseFile 全域方法
const { appContext } = getCurrentInstance()
const $parseFile = appContext.config.globalProperties.$parseFile
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
  <el-dialog v-model="visible" :title="mode === 'add' ? '新增食材' : '食材詳情'" width="650px" class="ingredient-dialog"
    @closed="handleClosed">
    <el-form :model="form" label-position="top" class="ingredient-form">
      <div class="form-container">
        <div class="form-left">
          <el-form-item label="食材名稱">
            <el-input v-model="form.name" placeholder="請輸入名稱" />
          </el-form-item>

          <el-form-item label="食材分類">
            <el-select v-model="form.category" placeholder="請選擇" style="width: 100%">
              <el-option v-for="(label, key) in categoryMap" :key="key" :label="label" :value="key" />
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
            <el-upload class="ingredient-uploader" action="#" :auto-upload="false" :show-file-list="false"
              @change="handleImageChange">
              <div v-if="form.imageUrl" class="preview-container">
                <img :src="form.imageUrl.startsWith('blob:') ? form.imageUrl : $parseFile(form.imageUrl)"
                  class="preview-img" />
              </div>
              <div v-else class="upload-placeholder">
                <el-icon>
                  <Plus />
                </el-icon>
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
      <button type="button" class="btn btn-solid h-40" style="width: 70px; margin-right: 10px;" @click="handleSubmit">
        {{ mode === 'add' ? '新增' : '儲存' }}
      </button>

      <button type="button" class="btn btn-outline h-40" style="width: 70px;" @click="visible = false">
        關閉
      </button>
    </template>
  </el-dialog>
</template>


<style lang="scss" scoped>
.form-container {
  display: flex;
  gap: 40px;
  padding: 10px 20px;
}

.form-left,
.form-right {
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
</style>