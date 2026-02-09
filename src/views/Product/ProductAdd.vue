<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 呼叫Api
import { phpApi } from '@/utils/publicApi.js';

const router = useRouter();

// ===== 頁面數據 =====
const isFormValid = ref(false);
const productData = ref({
  product_id: '',
  product_name: '',
  product_category: '',
  product_description: '',
  product_price: 0,
  product_net_weight: '',
  product_image: '',
  nutrition_info: [
    { name: '熱量', value: '', unit: 'kcal' },
    { name: '總脂肪', value: '', unit: 'g' },
    { name: '蛋白質', value: '', unit: 'g' },
    { name: '鈉', value: '', unit: 'mg' }
  ],
  nutrition_info_right: [
    { name: '碳水化合物', value: '', unit: 'g' },
    { name: '飽和脂肪', value: '', unit: 'g' },
    { name: '膳食纖維', value: '', unit: 'g' },
    { name: '糖', value: '', unit: 'g' }
  ],
  ingredient_content: '',
  ingredient_content_right: '',
  storage_period: '',
  product_tips: '',
  recipe_images: []
});

const loading = ref(false);

// ===== 驗證必填項 =====
/**
 * validateForm 方法
 * 功能說明：驗證表單必填項
 */
const validateForm = () => {
  const p = productData.value;

  // 1. 基礎資訊驗證
  if (!p.product_name) { ElMessage.warning('請輸入商品名稱'); return false; }
  if (!p.product_category) { ElMessage.warning('請選擇商品分類'); return false; }
  if (!p.product_price || p.product_price <= 0) { ElMessage.warning('請輸入商品價格'); return false; }
  if (!p.product_description) { ElMessage.warning('請輸入商品描述'); return false; }

  // 2.重量驗證：不能為空，且必須大於 0
  if (!p.product_net_weight || parseFloat(p.product_net_weight) <= 0) {
    ElMessage.warning('請輸入有效的商品重量 (需大於0)');
    return false;
  }


  // 3. 營養資訊驗證 (只要是 空值都視為未填寫)
  const allNutrition = [...p.nutrition_info, ...p.nutrition_info_right];
  // 檢查是否有任何一項的值為 空字串、null 或 undefined
  const hasEmptyNutrition = allNutrition.some(item =>
    item.value === '' || item.value === null || item.value === undefined
  );

  if (hasEmptyNutrition) {
    ElMessage.warning('請完整填寫所有營養資訊');
    return false;
  }

  // 4. 商品介紹驗證
  if (!p.ingredient_content) { ElMessage.warning('請輸入食材內容'); return false; }
  if (!p.ingredient_content_right) { ElMessage.warning('請輸入使用方法'); return false; }
  if (!p.storage_period) { ElMessage.warning('請輸入保存期限'); return false; }
  if (!p.product_tips) { ElMessage.warning('請輸入貼心提醒'); return false; }

  // 5. 圖片驗證 (非常重要，防止資料庫 JSON 解析出錯)
  if (p.recipe_images.length === 0) {
    ElMessage.warning('請至少上傳一張商品圖片');
    return false;
  }

  return true;
};

// ===== 新增商品 =====
/**
 * addProduct 方法
 * 功能說明：保存新增的商品數據到外部 API
 */
const addProduct = async () => {
  if (!validateForm()) return;

  // 複製一份資料以免影響 UI 雙向綁定
  const payload = JSON.parse(JSON.stringify(productData.value))

  payload.recipe_images = payload.recipe_images.map(img => ({
    url: img.url
  }))


  try {
    loading.value = true;
    const response = await phpApi.post('mall/add_product.php', payload);

    // Axios 會自動把後端回傳的 JSON 放在 .data 屬性中
    if (response.data.status === 'success') {
      ElMessage.success(response.data.message);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1000);
    } else {
      // 如果後端回傳 status 失敗
      throw new Error(response.data.message || '新增失敗');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '連線伺服器失敗';
    ElMessage.error(errMsg)
    console.error('新增商品失敗:', error);
  } finally {
    loading.value = false;
  }
};

// ===== 返回列表頁 =====
/**
 * goBack 方法
 * 功能說明：返回商品列表頁面
 */
const goBack = () => {
  router.push('/admin/products');
};

// ===== 刪除圖片 =====
/**
 * deleteImage 方法
 * 功能說明：刪除菜譜圖片
 */
const deleteImage = (imageId) => {
  ElMessageBox.confirm(
    '確定要刪除此圖片嗎？',
    '警告',
    {
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    productData.value.recipe_images = productData.value.recipe_images.filter(
      img => img.id !== imageId
    );
    ElMessage.success('圖片已刪除');
  }).catch(() => {
    ElMessage.info('已取消刪除');
  });
};

// ===== 圖片上傳和處理 =====
/**
 * handleImageUpload 方法
 * 功能說明：處理圖片上傳 - 使用 FileReader 轉換為 base64
 */
const handleImageUpload = (uploadFile) => {
  const file = uploadFile.raw

  if (!(file instanceof File)) {
    ElMessage.error('圖片格式異常')
    return false
  }

  const reader = new FileReader()
  reader.onload = () => {
    productData.value.recipe_images.push({
      id: Date.now(),
      url: reader.result, // 一定是 data:image/...base64
      alt: file.name
    })
  }

  reader.readAsDataURL(file)
  return false
}


/**
 * beforeImageUpload 方法
 * 功能說明：圖片上傳前的驗證
 */
// const beforeImageUpload = (file) => {
//   const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
//   const isLt5M = file.size / 1024 / 1024 < 5;

//   if (!isImage) {
//     ElMessage.error('只能上傳圖片格式的文件（JPG、PNG、GIF、WebP）');
//     return false;
//   }
//   if (!isLt5M) {
//     ElMessage.error('圖片大小不能超過 5MB');
//     return false;
//   }
//   return true;
// };

onMounted(() => {
  // 新增頁面無需載入數據，直接使用初始空數據
});
</script>

<template>
  <div class="product-add-wrapper">
    <!-- ===== 內容區頂部：返回按鈕和操作選項 ===== -->
    <div class="add-header">
      <router-link to="/admin/products" class="back-btn">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        <span>返回</span>
      </router-link>
      <div class="header-actions">
        <el-button type="primary" size="large" @click="addProduct" color="#3E8D60" :loading="loading">
          新增商品
        </el-button>
        <el-button size="large" @click="goBack">
          取消
        </el-button>
      </div>
    </div>

    <!-- ===== 主要內容區：使用 el-card 包裝 ===== -->
    <el-card class="add-card" v-loading="loading">
      <!-- ===== 卡片頂部 ===== -->
      <template #header>
        <div class="card-header">
          <h2 class="card-title">新增商品</h2>
        </div>
      </template>

      <!-- 商品信息行 -->
      <el-row :gutter="20" class="product-info-row">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品分類 <span class="required">*</span></span>
            <el-select v-model="productData.product_category" class="w-full" placeholder="選擇分類">
              <el-option label="低卡健身系列" value="低卡健身系列" />
              <el-option label="日韓風味系列" value="日韓風味系列" />
              <el-option label="歐美西式系列" value="歐美西式系列" />
              <el-option label="台式家常系列" value="台式家常系列" />
            </el-select>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品名稱 <span class="required">*</span></span>
            <el-input v-model="productData.product_name" placeholder="請輸入商品名稱" />
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品價格 <span class="required">*</span></span>
            <el-input v-model.number="productData.product_price" placeholder="請輸入價格" type="number" />
          </div>
        </el-col>
      </el-row>

      <!-- ===== 商品描述區 ===== -->
      <div class="description-section">
        <h3 class="section-title">商品描述 <span class="required">*</span></h3>
        <el-input v-model="productData.product_description" type="textarea" :rows="5" placeholder="請輸入商品詳細描述"
          class="textarea-field" />
      </div>
      <div class="weight-section" style="margin-top: 20px;">
        <h3 class="section-title">商品重量 <span class="required">*</span></h3>
        <el-row>
          <el-col :xs="24" :sm="12" :md="8">
            <el-input v-model="productData.product_net_weight" placeholder="請輸入商品重量" type="number">
              <template #suffix>
                <span class="unit-text">g</span>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>

      <!-- ===== 營養資訊區 ===== -->
      <div class="nutrition-section">
        <h3 class="section-title">營養資訊<span class="required">*</span></h3>
        <el-row :gutter="20" class="nutrition-container">
          <!-- 左側營養資訊 -->
          <el-col :xs="24" :md="12">
            <el-table :data="productData.nutrition_info" stripe class="nutrition-table"
              :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
              <el-table-column label="項目" align="center" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" border />
                </template>
              </el-table-column>
              <el-table-column label="每份含量" align="center">
                <template #default="{ row }">
                  <el-input v-model.number="row.value" type="number" size="small">
                    <template #suffix>
                      <span class="unit-text">{{ row.unit }}</span>
                    </template>
                  </el-input>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          <!-- 右側營養資訊 -->
          <el-col :xs="24" :md="12">
            <el-table :data="productData.nutrition_info_right" stripe class="nutrition-table"
              :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }">
              <el-table-column label="項目" align="center" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" border />
                </template>
              </el-table-column>
              <el-table-column label="每份含量" align="center">
                <template #default="{ row }">
                  <el-input v-model.number="row.value" type="number" size="small">
                    <template #suffix>
                      <span class="unit-text">{{ row.unit }}</span>
                    </template>
                  </el-input>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </div>

      <!-- ===== 食材內容區 ===== -->
      <div class="ingredient-section">
        <h3 class="section-title">商品介紹<span class="required">*</span></h3>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <h4 class="subsection-title">食材內容</h4>
            <el-input v-model="productData.ingredient_content" type="textarea" :rows="5" placeholder="請輸入食材內容"
              class="textarea-field" />
          </el-col>
          <el-col :xs="24" :md="12">
            <h4 class="subsection-title">使用方法</h4>
            <el-input v-model="productData.ingredient_content_right" type="textarea" :rows="5" placeholder="請輸入使用方法"
              class="textarea-field" />
          </el-col>
        </el-row>
      </div>

      <!-- ===== 保存期限和貼心提醒區 ===== -->
      <el-row :gutter="20" class="storage-section">
        <el-col :xs="24" :md="12">
          <h4 class="subsection-title">保存期限</h4>
          <el-input v-model="productData.storage_period" type="textarea" :rows="3" placeholder="請輸入保存期限說明"
            class="textarea-field" />
        </el-col>
        <el-col :xs="24" :md="12">
          <h4 class="subsection-title">貼心提醒</h4>
          <el-input v-model="productData.product_tips" type="textarea" :rows="3" placeholder="請輸入商品提醒資訊"
            class="textarea-field" />
        </el-col>
      </el-row>

      <!-- ===== 菜譜圖片展示區 ===== -->
      <div class="recipe-image-section">
        <h3 class="section-title">商品圖片<span class="required">*</span></h3>
        <div class="recipe-images">
          <div v-for="image in productData.recipe_images" :key="image.id" class="recipe-image-item">
            <img :src="image.url" :alt="image.alt" class="recipe-img" />
            <div class="image-actions">
              <el-button type="danger" size="small" :icon="Delete" circle @click="deleteImage(image.id)" />
            </div>
          </div>
          <div class="recipe-image-placeholder">
            <el-upload :auto-upload="false" :on-change="handleImageUpload" :before-upload="beforeImageUpload"
              :show-file-list="false" drag class="upload-area" accept="image/*">
              <template #default>
                <div class="upload-content">
                  <div class="upload-text">
                    <div class="upload-title">+ 新增圖片</div>
                    <div class="upload-desc">拖拽圖片或點擊上傳</div>
                  </div>
                </div>
              </template>
            </el-upload>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.product-add-wrapper {
  padding: 20px;
  min-height: 100vh;

  // ===== 頂部返回區樣式 =====
  .add-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 8px;

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3e8d60;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.3s;

      &:hover {
        opacity: 0.8;
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  // ===== 主卡片樣式 =====
  .add-card {
    background: white;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    :deep(.el-card__header) {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  // ===== 卡片頂部樣式 =====
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  // ===== 商品資訊行樣式 =====
  .product-info-row {
    margin-bottom: 20px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .info-label {
        font-weight: 600;
        color: #333;
        font-size: 14px;

        .required {
          color: #f56c6c;
          margin-left: 4px;
        }
      }
    }

  }

  // ===== 分割線樣式 =====
  :deep(.el-divider) {
    margin: 20px 0;
    background: #e8e8e8;
  }

  // ===== 區段通用樣式 =====
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 15px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #3e8d60;

    .required {
      color: #f56c6c;
      margin-left: 4px;
    }
  }

  .subsection-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
  }

  // ===== 文字區域樣式 =====
  .textarea-field {
    width: 100%;

    :deep(.el-textarea__inner) {
      // border: 1px solid #e8e8e8;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    }
  }

  // ===== 營養資訊表樣式 =====
  .nutrition-section {
    margin: 20px 0;
  }

  .nutrition-container {
    margin-top: 15px;
  }

  .nutrition-table {
    width: 100%;
    // border: 1px solid #e8e8e8;
    border-radius: 4px;

    :deep(.el-table__body-wrapper) {
      background: #fafafa;
    }

    :deep(.el-table__row) {
      &:hover>td {
        background-color: transparent !important;
      }
    }
  }

  // ===== 食材內容區樣式 =====
  .ingredient-section {
    margin-bottom: 20px;
  }

  // ===== 保存期限區樣式 =====
  .storage-section {
    margin-bottom: 20px;
  }

  // ===== 菜譜圖片區樣式 =====
  .recipe-image-section {
    margin-bottom: 0;
  }

  .recipe-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .recipe-image-item {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    border: 2px solid #e8e8e8;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(62, 141, 96, 0.15);
    }

    .recipe-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      opacity: 0;
      transition: opacity 0.3s;

      &:hover {
        opacity: 1;
      }
    }

    &:hover .image-actions {
      opacity: 1;
    }
  }

  .recipe-image-placeholder {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #3e8d60;
    border-radius: 8px;
    background: #f9fdf7;
    position: relative;

    .upload-area {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(.el-upload) {
        width: 100%;
        height: 100%;
      }

      :deep(.el-upload-dragger) {
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(62, 141, 96, 0.05) !important;
        }
      }

      .upload-content {
        text-align: center;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .upload-text {
          .upload-title {
            color: #3e8d60;
            font-weight: 600;
            font-size: 14px;
          }

          .upload-desc {
            color: #999;
            font-size: 12px;
            margin-top: 4px;
          }
        }
      }
    }
  }
}

// ===== 響應式設計 =====
@media (max-width: 768px) {
  .product-add-wrapper {
    padding: 12px;

    .add-header {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;
    }

    .recipe-images {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }
}
</style>