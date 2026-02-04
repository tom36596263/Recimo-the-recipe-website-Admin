<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 🏆 保持使用 publicApi (或根據你的需求改回 phpApi)
import { publicApi } from '@/utils/publicApi.js';
import { Check, Close, ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RecipeIntro from '@/components/workspace/recipedetail/RecipeIntro.vue';
import RecipeSteps from '@/components/workspace/recipedetail/RecipeSteps.vue';
import RecipeIngredients from '@/components/workspace/recipedetail/RecipeIngredients.vue';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();
const $parseFile = proxy.$parseFile;

// ===== 頁面數據 =====
const loading = ref(false);
const reviewLoading = ref(false);
const recipe = ref(null);
const ingredients = ref([]);
const steps = ref([]);

// 🏆 狀態映射表 (與留言檢舉邏輯一致)
const statusTextMap = {
  pending: '待審核',
  resolved: '審核通過',
  ignored: '審核不通過'
};

const statusClassMap = {
  pending: '待審核',
  resolved: '審核通過',
  ignored: '審核不通過'
};

const reportTypeMap = {
  0: '廣告垃圾訊息',
  1: '不當言論',
  2: '色情內容',
  3: '詐騙訊息',
  4: '其他'
};

// 狀態轉換 Helper
const getStatusText = (status) => statusTextMap[status] ?? status ?? '未知狀態';
const getStatusClass = (status) => statusClassMap[status] ?? '';

const reportData = ref({
  reported_recipe_id: '',
  recipe_id: '',
  report_type: '',
  report_reason: '',
  reporter_id: '',
  status: 'pending', // 統一使用 key 值
  review_date: '',
  reviewer_id: '',
  report_date: '',
  update_at: ''
});

// ===== 載入數據 =====
const loadData = async () => {
  try {
    loading.value = true;
    const reportId = route.params.id;
    
    // 1. 取得檢舉資訊
    const reportRes = await publicApi.get('data/social/reported_recipes.json');
    const report = reportRes.data.find(r => String(r.reported_recipe_id) === String(reportId));

    if (report) {
      // 處理後端可能傳回的數字狀態 (0, 1, 2) 轉為字串 key
      let statusKey = report.status;
      if (statusKey === 0 || statusKey === '0') statusKey = 'pending';
      if (statusKey === 1 || statusKey === '1') statusKey = 'resolved';
      if (statusKey === 2 || statusKey === '2') statusKey = 'ignored';

      reportData.value = { 
        ...report, 
        status: statusKey || 'pending'
      };

      // 2. 取得食譜主體
      const recipeRes = await publicApi.get('data/recipe/recipes.json');
      const foundRecipe = recipeRes.data.find(r => String(r.recipe_id) === String(reportData.value.recipe_id));
      recipe.value = foundRecipe || null;

      if (recipe.value) {
        // 3. 取得食材
        const recipeIngRes = await publicApi.get('data/recipe/recipe_ingredient.json');
        const ingMasterRes = await publicApi.get('data/recipe/ingredients.json');
        const recipeIngList = recipeIngRes.data.filter(i => String(i.recipe_id) === String(recipe.value.recipe_id));
        
        ingredients.value = recipeIngList.map(link => {
          const master = ingMasterRes.data.find(m => String(m.ingredient_id) === String(link.ingredient_id));
          return {
            INGREDIENT_NAME: master?.ingredient_name || `食材ID:${link.ingredient_id}`,
            amount: link.amount,
            unit_name: link.unit_name || master?.unit_name || '份',
            note: link.remark || '',
            calories_per_100g: master?.kcal_per_100g || 0,
            protein_per_100g: master?.protein_per_100g || 0,
            fat_per_100g: master?.fat_per_100g || 0,
            carbs_per_100g: master?.carbs_per_100g || 0,
            unit_weight: 1
          };
        });

        // 4. 取得步驟
        const stepsRes = await publicApi.get('data/recipe/steps.json');
        steps.value = stepsRes.data
          .filter(s => String(s.recipe_id) === String(recipe.value.recipe_id))
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
      }
    }
  } catch (e) {
    ElMessage.error('資料載入失敗');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// ===== 計算屬性 (格式化組件資料) =====
const recipeIntroData = computed(() => {
  if (!recipe.value) return null;
  let rawImg = recipe.value.recipe_image_url || recipe.value.coverImg || '';
  let finalImg = rawImg ? (rawImg.match(/^(http|data|blob)/) ? rawImg : $parseFile(rawImg.replace(/^\//, ''))) : 'https://placehold.co/800x600?text=No+Image';
  
  return {
    id: recipe.value.recipe_id,
    title: recipe.value.recipe_title || '未命名食譜',
    image: finalImg,
    time: recipe.value.recipe_total_time || '',
    difficulty: recipe.value.recipe_difficulty || 1,
    description: recipe.value.recipe_description || '暫無簡介'
  };
});

const stepsData = computed(() => {
  return steps.value.map((s, index) => {
    let rawImg = s.step_image_url || '';
    let finalImg = rawImg ? (rawImg.match(/^(http|data|blob)/) ? rawImg : $parseFile(rawImg.replace(/^\//, ''))) : '';
    return {
      id: s.step_id || `s-${index}`,
      title: s.step_title || `步驟 ${index + 1}`,
      content: s.step_content || '',
      image: finalImg,
      time: s.step_total_time || '',
      tags: s.tags || []
    };
  });
});

// ===== 審核操作 (統一呼叫更新) =====
const updateStatus = async (newStatus) => {
  try {
    reviewLoading.value = true;
    // 這裡模擬 API 請求，若是 PHP 請改用 await phpApi.post(...)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    reportData.value.status = newStatus;
    reportData.value.reviewer_id = 'admin_001';
    reportData.value.review_date = new Date().toLocaleString('zh-TW');
    
    ElMessage.success('操作成功');
  } catch (e) {
    ElMessage.error('操作失敗');
  } finally {
    reviewLoading.value = false;
  }
};

const approveReport = () => {
  ElMessageBox.confirm('確定要同意刪除此食譜嗎？', '確認', {
    confirmButtonText: '同意', cancelButtonText: '取消', type: 'warning'
  }).then(() => updateStatus('resolved'));
};

const rejectReport = () => {
  ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認', {
    confirmButtonText: '駁回', cancelButtonText: '取消', type: 'warning'
  }).then(() => updateStatus('ignored'));
};

const resetReview = () => {
  ElMessageBox.confirm('確定要重新審核嗎？', '確認', {
    confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    reportData.value.status = 'pending';
    reportData.value.reviewer_id = '';
    reportData.value.review_date = '';
    ElMessage.success('已重置為待審核狀態');
  });
};

const goBack = () => router.push('/admin/reports');

onMounted(loadData);
</script>

<template>
  <div class="recipe-reports-wrapper">
    <div class="report-header">
      <h2 class="header-title">食譜檢舉管理</h2>
      <div class="header-actions">
        <el-button @click="goBack" class="back-btn">返回</el-button>
      </div>
    </div>
    
    <div class="report-content">
      <div class="report-detail">
        <el-card class="detail-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>食譜資訊</h3>
            </div>
          </template>
          <div v-if="recipe">
            <RecipeIntro :info="recipeIntroData" :hideFavorite="true" :hideCook="true" />
            <el-divider />
            <h4>使用食材</h4>
            <RecipeIngredients :list="ingredients" />
            <el-divider />
            <h4>步驟</h4>
            <RecipeSteps :steps="stepsData" />
          </div>
          <div v-else>
            <el-empty description="查無此食譜" />
          </div>
        </el-card>
      </div>

      <div class="review-panel">
        <el-card class="review-card" v-loading="reviewLoading">
          <template #header>
            <div class="card-header">
              <h3>食譜審核</h3>
            </div>
          </template>
          
          <div class="status-section">
            <div class="status-badge" :class="getStatusClass(reportData.status)">
              {{ getStatusText(reportData.status) }}
            </div>
          </div>

          <el-divider />
          
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ reportTypeMap[reportData.report_type] || '其他' }}</div>
            </div>
            <div class="info-item">
              <span class="info-label">檢舉原因</span>
              <div class="info-value">{{ reportData.report_reason }}</div>
            </div>
            <div class="info-item">
              <span class="info-label">檢舉人 ID</span>
              <div class="info-value">{{ reportData.reporter_id }}</div>
            </div>
            <div class="info-item">
              <span class="info-label">檢舉時間</span>
              <div class="info-value">{{ reportData.report_date }}</div>
            </div>
          </div>

          <el-divider />

          <div v-if="reportData.status === 'pending'" class="action-buttons">
            <el-button type="success" size="large" class="approve-btn" @click="approveReport">
              <div class="btn-content">
                <el-icon><Check /></el-icon>
                <span>同意刪除</span>
              </div>
            </el-button>
            <el-button type="danger" size="large" class="reject-btn" @click="rejectReport">
              <div class="btn-content">
                <el-icon><Close /></el-icon>
                <span>駁回舉報</span>
              </div>
            </el-button>
          </div>

          <div v-else class="review-result">
            <div class="result-info">
              <div class="info-item">
                <span class="info-label">審核人員</span>
                <div class="info-value">{{ reportData.reviewer_id }}</div>
              </div>
              <div class="info-item">
                <span class="info-label">審核時間</span>
                <div class="info-value">{{ reportData.review_date }}</div>
              </div>
            </div>
            <el-divider />
            <el-button type="warning" size="large" class="modify-btn" @click="resetReview" style="width: 100%">
              重新審核
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* CSS 完全保持你原本的樣式 */
.recipe-reports-wrapper {
  padding: 20px;
  min-height: 100vh;
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    .header-title {
      margin: 0;
      font-size: 20px;
      color: #333;
      font-weight: 600;
    }
    .header-actions {
      .back-btn {
        background: white;
        border: 1px solid #dcdfe6;
        color: #606266;
        &:hover {
          color: #3e8d60;
          border-color: #3e8d60;
          background: #f0f9ff;
        }
      }
    }
  }
  .report-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 20px;
    align-items: start;
  }
  .report-detail {
    .detail-card {
      color: #333;
      padding-bottom: 0;
      border: none;
    }
  }
  .info-section {
    margin-bottom: 15px;
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      .info-label {
        font-weight: 600;
        color: #666;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-value {
        color: #333;
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
      }
    }
  }
  .status-section {
    margin-bottom: 15px;
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      width: 100%;
      &.待審核 {
        background: #fef0f0;
        color: #f56c6c;
        border: 1px solid #fde2e2;
      }
      &.審核通過 {
        background: #f0f9ff;
        color: #409eff;
        border: 1px solid #c6e2ff;
      }
      &.審核不通過 {
        background: #f5f7fa;
        color: #909399;
        border: 1px solid #dcdfe6;
      }
    }
  }
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .el-icon {
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    .approve-btn {
      width: 100%;
      &:not(:disabled) {
        background: #3e8d60;
        border-color: #3e8d60;
        color: white;
        &:hover {
          background: #357a52;
          border-color: #357a52;
        }
      }
    }
    .reject-btn {
      width: 100%;
      margin-left: 0;
    }
  }
  .review-panel {
    .review-card {
      background: white;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 20px;
      :deep(.el-card__header) {
        padding: 20px;
        border-bottom: 1px solid #f0f0f0;
      }
      :deep(.el-card__body) {
        padding: 20px;
      }
    }
  }
  .review-result {
    .result-info {
      .info-item {
        margin-bottom: 12px;
        .info-label {
          font-weight: 600;
          color: #666;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 6px;
        }
        .info-value {
          color: #333;
          font-size: 14px;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;
        }
      }
    }
  }
}
@media (max-width: 1024px) {
  .recipe-reports-wrapper {
    .report-content { grid-template-columns: 1fr; }
    .review-panel { .review-card { position: static; } }
  }
}
</style>