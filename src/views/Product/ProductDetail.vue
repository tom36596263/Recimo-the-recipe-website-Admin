<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { publicApi } from '@/utils/publicApi.js';
import { phpApi } from '@/utils/publicApi';
import { ArrowLeft, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const { appContext } = getCurrentInstance();
const $parseFile = appContext.config.globalProperties.$parseFile;
const route = useRoute();
const router = useRouter();

const isEditMode = ref(false);
const loading = ref(false);
const originalProductData = ref(null);

const productData = ref({
  id: '',
  product_name: '',
  product_category: '',
  product_description: '',
  product_price: 0,
  product_release: 1,
  nutrition_info: [],
  nutrition_info_right: [],
  ingredient_content: '',
  ingredient_content_right: '',
  storage_period: '',
  product_tips: '',
  recipe_images: []
});

const loadProductData = async () => {
  try {
    const productId = route.params.id;
    loading.value = true;

    // 指向正確的 PHP API
    const response = await phpApi.get('mall/admin_products_api.php', {
      params: { action: 'read' }
    });

    // 💡 關鍵 Debug：檢查整個 response 物件
    console.log('完整 Response:', response);

    // 某些 API 封裝會多一層 data，例如 response.data.data
    const products = response.data?.data || response.data || [];

    console.log('解析後的商品陣列:', products);

    if (!Array.isArray(products) || products.length === 0) {
      console.error('警告：API 回傳的不是陣列，或陣列是空的！');
      ElMessage.warning('目前資料庫中沒有商品資料');
      return;
    }

    // 尋找商品 (強制轉型比對)
    const product = products.find((p) => {
      const apiId = p.id || p.product_id || p.PRODUCT_ID;
      return String(apiId) === String(productId);
    });

    if (product) {
      console.log('成功匹配商品:', product);
      const t = product.tags || {};

      // 更新資料
      productData.value = {
        id: product.id,
        product_name: product.product_name || '',
        product_category: product.product_category || '',
        product_description: product.product_description || '',
        product_price: product.product_price || 0,
        product_release: t.product_release ?? 1,
        nutrition_info: [
          { name: '熱量', value: t.product_kcal || 0, unit: 'kcal' },
          { name: '總脂肪', value: t.product_fat || 0, unit: 'g' },
          { name: '蛋白質', value: t.product_protein || 0, unit: 'g' },
          { name: '鈉', value: t.product_sodium || 0, unit: 'mg' }
        ],
        nutrition_info_right: [
          { name: '碳水化合物', value: t.product_carbs || 0, unit: 'g' },
          { name: '飽和脂肪', value: t.product_saturated_fat || 0, unit: 'g' },
          { name: '膳食纖維', value: t.product_fiber || 0, unit: 'g' },
          { name: '糖', value: t.product_sugar || 0, unit: 'g' }
        ],
        ingredient_content: t.product_ingredients || '',
        ingredient_content_right: t.product_cooking_method || '',
        storage_period: t.product_storage_method || '',
        product_tips: t.product_reminder || '',
        recipe_images: (product.images || []).map((url, index) => ({
          id: index,
          url: url,
          alt: product.product_name
        }))
      };
    } else {
      console.error(
        `比對失敗：網址 ID 為 ${productId}，但 API 的商品 ID 分別為:`,
        products.map((p) => p.id || p.product_id)
      );
    }
  } catch (error) {
    console.error('讀取過程發生異常:', error);
  } finally {
    loading.value = false;
  }
};

const saveProductData = async () => {
  try {
    loading.value = true;
    const formData = new FormData();

    // 1. 基本資料
    formData.append('product_id', productData.value.id);
    formData.append('product_name', productData.value.product_name);
    formData.append('product_category', productData.value.product_category);
    formData.append('product_price', productData.value.product_price);
    formData.append(
      'product_description',
      productData.value.product_description
    );
    formData.append('product_release', productData.value.product_release);

    // 2. 營養資訊 (對應 PHP 的變數名)
    formData.append('product_kcal', productData.value.nutrition_info[0].value);
    formData.append('product_fat', productData.value.nutrition_info[1].value);
    formData.append(
      'product_protein',
      productData.value.nutrition_info[2].value
    );
    formData.append(
      'product_sodium',
      productData.value.nutrition_info[3].value
    );
    formData.append(
      'product_carbs',
      productData.value.nutrition_info_right[0].value
    );
    formData.append(
      'product_saturated_fat',
      productData.value.nutrition_info_right[1].value
    );
    formData.append(
      'product_fiber',
      productData.value.nutrition_info_right[2].value
    );
    formData.append(
      'product_sugar',
      productData.value.nutrition_info_right[3].value
    );

    // 3. 詳細文字
    formData.append(
      'product_ingredients',
      productData.value.ingredient_content
    );
    formData.append('product_storage_method', productData.value.storage_period);
    formData.append('product_reminder', productData.value.product_tips);
    formData.append(
      'product_cooking_method',
      productData.value.ingredient_content_right
    );

    // 4. 圖片處理 (重點！)
    productData.value.recipe_images.forEach((img) => {
      if (img.raw) {
        // 如果有 raw，代表是新選擇的檔案
        formData.append('product_images[]', img.raw);
      } else {
        // 如果沒有 raw，代表是原本就有的舊圖片網址
        formData.append('existing_images[]', img.url);
      }
    });

    const response = await phpApi.post(
      'mall/admin_products_api.php?action=update',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (response.data.status === 'success') {
      ElMessage.success('保存成功！');
      isEditMode.value = false;
      loadProductData(); // 重新讀取，獲取新的 JSON 結構
    } else {
      throw new Error(response.data.message || '更新失敗');
    }
  } catch (error) {
    console.error('保存錯誤:', error);
    ElMessage.error('保存失敗: ' + error.message);
  } finally {
    loading.value = false;
  }
};
const goBack = () => router.push('/admin/products');

const toggleEditMode = () => {
  if (!isEditMode.value) {
    originalProductData.value = JSON.parse(JSON.stringify(productData.value));
  } else {
    if (originalProductData.value) {
      productData.value = JSON.parse(JSON.stringify(originalProductData.value));
    }
  }
  isEditMode.value = !isEditMode.value;
};

const beforeImageUpload = (rawFile) => {
  const isJPGorPNG =
    rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) {
    ElMessage.error('圖片格式必須是 JPG 或 PNG');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('圖片大小不能超過 2MB');
    return false;
  }
  return true;
};

// 處理預覽並將 File 物件存入陣列
const handleImageUpload = (uploadFile) => {
  if (!uploadFile.raw) return;

  const previewUrl = URL.createObjectURL(uploadFile.raw);

  // 取得目前陣列中最大的 ID 並 +1，確保在目前編輯狀態下不重複
  const maxId =
    productData.value.recipe_images.length > 0
      ? Math.max(...productData.value.recipe_images.map((img) => img.id))
      : 0;

  productData.value.recipe_images.push({
    id: maxId + 1, // 這裡確保在前端目前的 list 裡是唯一的
    url: previewUrl,
    raw: uploadFile.raw,
    alt: uploadFile.name
  });
};

// 刪除圖片 (包含預覽圖或舊圖)
const deleteImage = (id) => {
  productData.value.recipe_images = productData.value.recipe_images.filter(
    (img) => img.id !== id
  );
};

// 處理圖片載入失敗
const handleImgError = (e) => {
  e.target.src = 'https://placehold.co/150?text=No+Image';
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
        <el-icon>
          <ArrowLeft />
        </el-icon>
        <span>返回</span>
      </router-link>
      <div class="header-actions">
        <button
          v-if="!isEditMode"
          class="btn btn-solid h-40"
          style="width: 70px"
          @click="toggleEditMode"
        >
          修改
        </button>

        <button
          v-if="isEditMode"
          class="btn btn-solid h-40"
          style="width: 70px"
          @click="saveProductData"
        >
          保存
        </button>

        <button
          v-if="isEditMode"
          class="btn btn-outline h-40"
          style="width: 70px"
          @click="toggleEditMode"
        >
          取消
        </button>

        <button
          v-if="!isEditMode"
          class="btn btn-outline h-40"
          style="width: 70px"
          @click="goBack"
        >
          返回
        </button>
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
              <el-option label="低卡健身系列" value="低卡健身系列" />
              <el-option label="日韓風味系列" value="日韓風味系列" />
              <el-option label="歐美西式系列" value="歐美西式系列" />
              <el-option label="台式家常系列" value="台式家常系列" />
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
      <div class="nutrition-section">
        <h3 class="section-title">營養資訊</h3>
        <el-row :gutter="20" class="nutrition-container">
          <!-- 左側營養資訊 -->
          <el-col :xs="24" :md="12">
            <el-table
              :data="productData.nutrition_info"
              stripe
              class="nutrition-table"
              :header-cell-style="{
                backgroundColor: '#F1F6EF',
                color: '#000',
                fontWeight: 'normal'
              }"
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
                <template #default="{ row }">
                  <el-input
                    v-model.number="row.value"
                    :disabled="!isEditMode"
                    type="number"
                    size="small"
                  >
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
            <el-table
              :data="productData.nutrition_info_right"
              stripe
              class="nutrition-table"
              :header-cell-style="{
                backgroundColor: '#F1F6EF',
                color: '#000',
                fontWeight: 'normal'
              }"
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
                <template #default="{ row }">
                  <el-input
                    v-model="row.value"
                    :disabled="!isEditMode"
                    size="small"
                    type="text"
                  >
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

      <!-- ===== 步驟5：食材內容區 =====
           功能：展示食材列表和相關資訊（左右兩欄設計）
      -->
      <div class="ingredient-section">
        <h3 class="section-title">商品介紹</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <h4 class="subsection-title">食材內容</h4>
            <el-input
              v-model="productData.ingredient_content"
              type="textarea"
              :rows="5"
              :disabled="!isEditMode"
              placeholder="請輸入食材內容"
              class="textarea-field"
            />
          </el-col>
          <el-col :xs="24" :md="12">
            <h4 class="subsection-title">使用方法</h4>
            <el-input
              v-model="productData.ingredient_content_right"
              type="textarea"
              :rows="5"
              :disabled="!isEditMode"
              placeholder="請輸入使用方法"
              class="textarea-field"
            />
          </el-col>
        </el-row>
      </div>

      <!-- ===== 步驟6：保存期限和貼心提醒區 =====
           功能：顯示保存方式和使用注意事項
      -->
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
      <div class="recipe-image-section">
        <h3 class="section-title">商品圖片</h3>
        <div class="recipe-images">
          <div
            v-for="image in productData.recipe_images"
            :key="image.id"
            class="recipe-image-item"
          >
            <img
              :src="
                image.url.startsWith('blob:') || image.url.startsWith('data:')
                  ? image.url
                  : image.url
              "
              :alt="image.alt"
              class="recipe-img"
              @error="handleImgError"
            />
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
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);

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
    border-bottom: 1px solid #3e8d60;
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
    border: 1px solid #e8e8e8;
    border-radius: 4px;

    :deep(.el-table__body-wrapper) {
      background: #fafafa;
    }

    :deep(.el-table__row) {
      &:hover > td {
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
    border: 1px solid #e8e8e8;
    transition:
      transform 0.3s,
      box-shadow 0.3s;
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
    border: 1px dashed #3e8d60;
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
