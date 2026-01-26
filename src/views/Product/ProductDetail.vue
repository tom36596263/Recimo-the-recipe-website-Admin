<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';
import { ArrowLeft, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 取得 $parsePublicFile 全域方法
const { appContext } = getCurrentInstance()
const $parsePublicFile = appContext.config.globalProperties.$parsePublicFile

const route = useRoute();
const router = useRouter();

// ===== 頁面數據 =====
const isEditMode = ref(false);
const productData = ref({
  product_id: '',
  product_name: '',
  product_category: '',
  product_description: '',
  product_price: 0,
  product_image: '',
  nutrition_info: [
    { name: '熱量', value: '250g' },
    { name: '碳水化合', value: '4.2g' },
    { name: '蛋白質', value: '28.0g' },
    { name: '鈉', value: '420 mg' }
  ],
  nutrition_info_right: [
    { name: '醣水化合物', value: '42.0g' },
    { name: '飽和脂肪', value: '0.8 g' },
    { name: '膳食纖維', value: '5.5g' },
    { name: '鐵', value: '0.5g' }
  ],
  ingredient_content: '農業港澳珠江糙糙米、又不相關性米米？農的的｜綠脂肪指數症症。導入化能代族人，健身及關鍵管理養份、採用低溫吹膜住宅部份、搬運超級食物人選，攪拌食一口都吃滑膜足展與純淨厭棄。',
  ingredient_content_right: '農業港澳珠江糙糙米、又不相關性米米？農的的｜綠脂肪指數症症。導入化能代族人，健身及關鍵管理養份、採用低溫吹膜住宅部份、搬運超級食物人選，攪拌食一口都吃滑膜足展與純淨厭棄。',
  storage_period: '冷凍保存 12 個月',
  product_tips: '本產品含有動物製品，過敏者請留意。',
  recipe_images: [
    { id: 1, url: 'https://via.placeholder.com/150', alt: '菜譜圖片1' },
    { id: 2, url: 'https://via.placeholder.com/150', alt: '菜譜圖片2' }
  ]
});

const loading = ref(false);
const originalProductData = ref(null); // 保存原始數據用於取消時還原

// ===== 步驟1：載入商品數據 =====
/**
 * loadProductData 方法
 * 功能說明：根據路由參數取得商品 ID，並從外部 API 獲取商品詳細資料
 * 
 * 執行步驟：
 * Step 1: 從路由參數中取得商品 ID
 * Step 2: 設定 loading 狀態為 true
 * Step 3: 調用 publicApi 取得 products.json 數據
 * Step 4: 根據商品 ID 篩選對應的商品資料
 * Step 5: 更新 productData 並設定 loading 為 false
 */
const loadProductData = async () => {
  try {
    const productId = route.params.id;
    loading.value = true;
    
    // Step 3: 取得所有商品數據
    const response = await publicApi.get('data/mall/products.json');
    const products = response.data;
    
    // Step 4: 根據商品 ID 篩選單個商品
    const product = products.find(p => String(p.product_id) === String(productId));
    
    // Step 5: 更新商品數據
    if (product) {
      // 轉換圖片資料結構
      const recipeImages = product.product_image?.map(img => ({
        id: img.id,
        url: img.image_url,
        alt: product.product_name
      })) || [];
      
      productData.value = {
        ...productData.value,
        ...product,
        recipe_images: recipeImages
      };
    }
  } catch (error) {
    console.error('載入商品數據失敗:', error.message);
  } finally {
    loading.value = false;
  }
};

// ===== 步驟2：編輯模式切換 =====
/**
 * toggleEditMode 方法
 * 功能說明：切換編輯模式和查看模式
 */
const toggleEditMode = () => {
  if (!isEditMode.value) {
    // 進入編輯模式時，深拷貝當前數據
    originalProductData.value = JSON.parse(JSON.stringify(productData.value));
  } else {
    // 取消編輯時，還原原始數據
    if (originalProductData.value) {
      productData.value = JSON.parse(JSON.stringify(originalProductData.value));
      originalProductData.value = null;
    }
  }
  isEditMode.value = !isEditMode.value;
};

// ===== 步驟3：保存商品數據 =====
/**
 * saveProductData 方法
 * 功能說明：保存修改後的商品數據到外部 API
 */
const saveProductData = async () => {
  try {
    loading.value = true;
    // 模擬 API 請求 - 實際應調用後端保存接口
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success('商品資訊保存成功！');
    isEditMode.value = false;
    originalProductData.value = null; // 清除備份
  } catch (error) {
    ElMessage.error('保存失敗，請重試');
    console.error('保存商品數據失敗:', error);
  } finally {
    loading.value = false;
  }
};

// ===== 步驟4：返回列表頁 =====
/**
 * goBack 方法
 * 功能說明：返回商品列表頁面
 */
const goBack = () => {
  router.push('/admin/products');
};

// ===== 步驟5：刪除圖片 =====
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

// ===== 步驟6：圖片上傳和處理 =====
/**
 * handleImageUpload 方法
 * 功能說明：處理圖片上傳 - 使用 FileReader 轉換為 base64
 */
const handleImageUpload = (uploadFile) => {
  // 獲取實際的 File 對象，兼容不同的參數格式
  const fileObj = uploadFile?.raw || uploadFile?.file?.raw || uploadFile;
  
  if (!fileObj || typeof fileObj.slice !== 'function') {
    ElMessage.error('文件獲取失敗');
    return false;
  }
  
  // 使用 FileReader 讀取文件並轉換為 base64
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const newId = Math.max(...productData.value.recipe_images.map(img => img.id), 0) + 1;
    productData.value.recipe_images.push({
      id: newId,
      url: e.target.result, // base64 編碼的圖片
      alt: fileObj.name.replace(/\.[^/.]+$/, '') // 移除副檔名作為 alt 文本
    });
    ElMessage.success('圖片上傳成功');
  };
  
  reader.onerror = () => {
    ElMessage.error('圖片讀取失敗，請重試');
    console.error('圖片讀取失敗');
  };
  
  // 讀取文件為 Data URL (base64)
  reader.readAsDataURL(fileObj);
  
  // 返回 false 阻止默認上傳行為
  return false;
};

/**
 * beforeImageUpload 方法
 * 功能說明：圖片上傳前的驗證
 */
const beforeImageUpload = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('只能上傳圖片格式的文件（JPG、PNG、GIF、WebP）');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('圖片大小不能超過 5MB');
    return false;
  }
  return true;
};

// ===== 步驟7：編輯營養資訊 =====
/**
 * updateNutrition 方法
 * 功能說明：更新營養資訊
 */
const updateNutrition = (index, field, value) => {
  productData.value.nutrition_info[index][field] = value;
};

const updateNutritionRight = (index, field, value) => {
  productData.value.nutrition_info_right[index][field] = value;
};

onMounted(() => {
  loadProductData();
});
</script>

<template>
  <div class="product-detail-wrapper">
    <!-- ===== 內容區頂部：返回按鈕和修改選項 ===== -->
    <div class="detail-header">
      <router-link to="/admin/products" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </router-link>
      <div class="header-actions">
        <el-button 
          v-if="!isEditMode"
          type="primary" 
          size="large"
          @click="toggleEditMode"
          color="#3E8D60"
        >
          修改
        </el-button>
        <el-button 
          v-if="isEditMode"
          type="primary" 
          size="large"
          @click="saveProductData"
          color="#3E8D60"
        >
          保存
        </el-button>
        <el-button 
          v-if="isEditMode"
          size="large"
          @click="toggleEditMode"
        >
          取消
        </el-button>
        <el-button 
          v-if="!isEditMode"
          size="large"
          @click="goBack"
        >
          返回
        </el-button>
      </div>
    </div>

    <!-- ===== 主要內容區：使用 el-card 包裝 ===== -->
    <el-card class="detail-card" v-loading="loading">
      <!-- ===== 步驟2：商品基本資訊區 =====
           功能：顯示商品標題、分類、價格等基本資訊
      -->
      <template #header>
        <div class="card-header">
          <h2 class="product-title">{{ productData.product_name }}</h2>
        </div>
      </template>

      <!-- 商品信息行 -->
      <el-row :gutter="20" class="product-info-row">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品分類</span>
            <el-select
              v-model="productData.product_category"
              :disabled="!isEditMode"
              class="w-full"
              placeholder="選擇分類"
            >
              <el-option label="蔬菜" value="vegetable" />
              <el-option label="肉類" value="meat" />
            </el-select>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品名稱</span>
            <el-input
              v-model="productData.product_name"
              :disabled="!isEditMode"
              placeholder="請輸入商品名稱"
            />
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="info-item">
            <span class="info-label">商品價格</span>
            <el-input
              v-model="productData.product_price"
              :disabled="!isEditMode"
              placeholder="請輸入價格"
            />
          </div>
        </el-col>
      </el-row>

      <!-- ===== 步驟3：商品描述區 =====
           功能：顯示完整的商品描述文本
      -->
      <el-divider />
      <div class="description-section">
        <h3 class="section-title">商品描述</h3>
        <el-input
          v-model="productData.product_description"
          type="textarea"
          :rows="5"
          :disabled="!isEditMode"
          placeholder="商品詳細描述"
          class="textarea-field"
        />
      </div>

      <!-- ===== 步驟4：營養資訊區 =====
           功能：以表格形式展示營養成分（左右兩列設計）
      -->
      <el-divider />
      <div class="nutrition-section">
        <h3 class="section-title">營養資訊</h3>
        <el-row :gutter="20" class="nutrition-container">
          <!-- 左側營養資訊 -->
          <el-col :xs="24" :md="12">
            <el-table
              :data="productData.nutrition_info"
              stripe
              class="nutrition-table"
              :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }"
            >
              <el-table-column label="項目" align="center" width="100">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.name"
                    :disabled="!isEditMode"
                    size="small"
                    border
                  />
                </template>
              </el-table-column>
              <el-table-column label="每份含量" align="center">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.value"
                    :disabled="!isEditMode"
                    size="small"
                    border
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          <!-- 右側營養資訊 -->
          <el-col :xs="24" :md="12">
            <el-table
              :data="productData.nutrition_info_right"
              stripe
              class="nutrition-table"
              :header-cell-style="{ backgroundColor: '#F1F6EF', color: '#000', fontWeight: 'normal' }"
            >
              <el-table-column label="項目" align="center" width="100">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.name"
                    :disabled="!isEditMode"
                    size="small"
                    border
                  />
                </template>
              </el-table-column>
              <el-table-column label="每份含量" align="center">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.value"
                    :disabled="!isEditMode"
                    size="small"
                    border
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </div>

      <!-- ===== 步驟5：食材內容區 =====
           功能：展示食材列表和相關資訊（左右兩欄設計）
      -->
      <el-divider />
      <div class="ingredient-section">
        <h3 class="section-title">食材內容</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-input
              v-model="productData.ingredient_content"
              type="textarea"
              :rows="5"
              :disabled="!isEditMode"
              placeholder="食材內容"
              class="textarea-field"
            />
          </el-col>
          <el-col :xs="24" :md="12">
            <el-input
              v-model="productData.ingredient_content_right"
              type="textarea"
              :rows="5"
              :disabled="!isEditMode"
              placeholder="食材內容"
              class="textarea-field"
            />
          </el-col>
        </el-row>
      </div>

      <!-- ===== 步驟6：保存期限和貼心提醒區 =====
           功能：顯示保存方式和使用注意事項
      -->
      <el-divider />
      <el-row :gutter="20" class="storage-section">
        <el-col :xs="24" :md="12">
          <h4 class="subsection-title">保存期限</h4>
          <el-input
            v-model="productData.storage_period"
            type="textarea"
            :rows="3"
            :disabled="!isEditMode"
            placeholder="保存期限說明"
            class="textarea-field"
          />
        </el-col>
        <el-col :xs="24" :md="12">
          <h4 class="subsection-title">貼心提醒</h4>
          <el-input
            v-model="productData.product_tips"
            type="textarea"
            :rows="3"
            :disabled="!isEditMode"
            placeholder="產品提醒資訊"
            class="textarea-field"
          />
        </el-col>
      </el-row>

      <!-- ===== 步驟7：菜譜圖片展示區 =====
           功能：展示與商品相關的菜譜圖片
      -->
      <el-divider />
      <div class="recipe-image-section">
        <h3 class="section-title">商品圖片</h3>
        <div class="recipe-images">
          <div
            v-for="image in productData.recipe_images"
            :key="image.id"
            class="recipe-image-item"
          >
            <img :src="image.url.startsWith('blob:') || image.url.startsWith('data:') ? image.url : $parsePublicFile(image.url)" :alt="image.alt" class="recipe-img" />
            <div v-if="isEditMode" class="image-actions">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                circle
                @click="deleteImage(image.id)"
              />
            </div>
          </div>
          <div class="recipe-image-placeholder">
            <el-upload
              v-if="isEditMode"
              :auto-upload="false"
              :on-change="handleImageUpload"
              :before-upload="beforeImageUpload"
              :show-file-list="false"
              drag
              class="upload-area"
              accept="image/*"
            >
              <template #default>
                <div class="upload-content">
                  <div class="upload-text">
                    <div class="upload-title">+ 新增圖片</div>
                    <div class="upload-desc">拖拽圖片或點擊上傳</div>
                  </div>
                </div>
              </template>
            </el-upload>
            <div v-else class="empty-text">暫無圖片</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.product-detail-wrapper {
  padding: 20px;
  min-height: 100vh;

  // ===== 頂部返回區樣式 =====
  .detail-header {
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
  .detail-card {
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

    .product-title {
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
      }
    }

    :deep(.el-input__wrapper) {
      background-color: #f5f7fa;
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
      background-color: #f5f7fa;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    }
  }

  // ===== 營養資訊表樣式 =====
  .nutrition-section {
    margin-bottom: 20px;
  }

  .nutrition-container {
    margin-top: 15px;
  }

  .nutrition-table {
    width: 100%;
    border: 1px solid #e8e8e8;
    border-radius: 4px;

    :deep(.el-table__body-wrapper) {
      background: #fafafa;
    }

    :deep(.el-table__row) {
      &:hover > td {
        background-color: #f0f8f4 !important;
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

    .empty-text {
      color: #999;
      font-size: 14px;
    }
  }
}

// ===== 響應式設計 =====
@media (max-width: 768px) {
  .product-detail-wrapper {
    padding: 12px;

    .detail-header {
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