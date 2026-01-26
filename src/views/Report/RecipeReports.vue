<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';
import { getCurrentInstance } from 'vue';
import { Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RecipeIntro from '@/components/workspace/recipedetail/RecipeIntro.vue';
import RecipeSteps from '@/components/workspace/recipedetail/RecipeSteps.vue';
import RecipeIngredients from '@/components/workspace/recipedetail/RecipeIngredients.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const reviewLoading = ref(false);
const recipe = ref(null);
const ingredients = ref([]);
const steps = ref([]);
const reportData = ref({
  reported_recipe_id: '',
  recipe_id: '',
  report_type: '',
  report_reason: '',
  reporter_id: '',
  status: '待審核',
  review_date: '',
  reviewer_id: '',
  reporterd_at: '',
  update_at: ''
});

const loadData = async () => {
  try {
    loading.value = true;
    const reportId = route.params.id;
    const reportRes = await publicApi.get('data/social/reported_recipes.json');
    const reportList = reportRes.data;
    // 用小寫欄位名找
    const report = reportList.find(r => String(r.reported_recipe_id) === String(reportId));
    if (report) {
      // 狀態欄位自動轉換
      let status = report.status;
      if (typeof status === 'number') {
        if (status === 0) status = '待審核';
        else if (status === 1) status = '審核通過';
        else if (status === 2) status = '審核不通過';
        else status = '未知狀態';
      }
      reportData.value = { ...reportData.value, ...report, status };
    }
    // 查找 recipe_id
    const recipeRes = await publicApi.get('data/recipe/recipes.json');
    const recipeList = recipeRes.data;
    const foundRecipe = recipeList.find(r => String(r.recipe_id) === String(reportData.value.recipe_id || report?.recipe_id || report?.RECIPE_ID));
    recipe.value = foundRecipe || null;
    const recipeIngRes = await publicApi.get('data/recipe/recipe_ingredient.json');
    const ingMasterRes = await publicApi.get('data/recipe/ingredients.json');
    const recipeIngList = recipeIngRes.data.filter(i => String(i.recipe_id) === String(reportData.value.recipe_id || report?.recipe_id || report?.RECIPE_ID));
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
    const stepsRes = await publicApi.get('data/recipe/steps.json');
    steps.value = stepsRes.data.filter(s => String(s.recipe_id) === String(reportData.value.recipe_id || report?.recipe_id || report?.RECIPE_ID))
      .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
  } catch (e) {
    ElMessage.error('資料載入失敗');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const { proxy } = getCurrentInstance();
const $parsePublicFile = proxy.$parsePublicFile;
const recipeIntroData = computed(() => {
  if (!recipe.value) return null;
  let rawImg = recipe.value.recipe_image_url || recipe.value.coverImg || recipe.value.recipe_cover_image || '';
  let finalImg = '';
  if (rawImg) {
    if (rawImg.startsWith('http') || rawImg.startsWith('data:') || rawImg.startsWith('blob:')) {
      finalImg = rawImg;
    } else {
      finalImg = $parsePublicFile(rawImg.replace(/^\//, ''));
    }
  } else {
    finalImg = 'https://placehold.co/800x600?text=No+Image';
  }
  return {
    id: recipe.value.recipe_id,
    title: recipe.value.recipe_title || recipe.value.title || '未命名食譜',
    image: finalImg,
    time: recipe.value.recipe_total_time || '',
    difficulty: recipe.value.recipe_difficulty || recipe.value.difficulty || 1,
    description: recipe.value.recipe_descreption || recipe.value.recipe_description || recipe.value.description || '暫無簡介'
  };
});

// 步驟資料串圖
const stepsData = computed(() => {
  if (!steps.value || steps.value.length === 0) return [];
  const rId = recipe.value?.recipe_id || '0';
  return steps.value.map((s, index) => {
    let rawImg = s.step_image_url || s.image || s.img || '';
    let finalImg = '';
    if (rawImg && typeof rawImg === 'string' && rawImg.length > 0) {
      if (rawImg.startsWith('data:') || rawImg.startsWith('http') || rawImg.startsWith('blob:')) {
        finalImg = rawImg;
      } else {
        finalImg = $parsePublicFile(rawImg.replace(/^\//, ''));
      }
    }
    return {
      id: s.step_id || s.id || `s-${index}`,
      title: s.step_title || s.title || `步驟 ${index + 1}`,
      content: s.step_content || s.content || s.text || '',
      image: finalImg,
      time: s.step_total_time || s.time || '',
      tags: s.tags || []
    };
  });
});

const approveReport = () => {
  ElMessageBox.confirm('確定要同意刪除此食譜嗎？', '確認', {
    confirmButtonText: '同意',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      reviewLoading.value = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      reportData.value.status = '審核通過';
      reportData.value.reviewer_id = 'admin_001';
      reportData.value.review_date = new Date().toLocaleString('zh-TW');
      ElMessage.success('食譜已審核通過');
    } catch (e) {
      ElMessage.error('操作失敗，請重試');
    } finally {
      reviewLoading.value = false;
    }
  }).catch(() => {
    ElMessage.info('已取消');
  });
};


// 檢舉類型顯示函式（與 ReportAdmin 一致）
const type = (x) => {
  switch (x) {
    case 0:
      return '廣告垃圾訊息';
    case 1:
      return '不當言論';
    case 2:
      return '色情內容';
    case 3:
      return '詐騙訊息';
    default:
      return '其他';
  }
};

const rejectReport = () => {
  ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認', {
    confirmButtonText: '駁回',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      reviewLoading.value = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      reportData.value.status = '審核不通過';
      reportData.value.reviewer_id = 'admin_001';
      reportData.value.review_date = new Date().toLocaleString('zh-TW');
      ElMessage.success('舉報已審核不通過');
    } catch (e) {
      ElMessage.error('操作失敗，請重試');
    } finally {
      reviewLoading.value = false;
    }
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

const resetReview = () => {
  ElMessageBox.confirm('確定要修改審核嗎？', '確認', {
    confirmButtonText: '修改',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    reportData.value.status = '待審核';
    reportData.value.reviewer_id = '';
    reportData.value.review_date = '';
    ElMessage.success('已重置為待審核狀態');
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

const goBack = () => {
  router.push('/admin/reports');
};
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
            <div class="status-badge" :class="reportData.status">
              {{ reportData.status }}
            </div>
          </div>
          <el-divider />
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ type(reportData.report_type) }}</div>
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
          <div v-if="reportData.status === '待審核'" class="action-buttons">
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
            <el-divider />
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
      &:disabled {
        background: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        color: white;
      }
    }
    .reject-btn {
      width: 100%;
      margin-left: 0;
      &:disabled {
        background: #ccc;
        border-color: #ccc;
        cursor: not-allowed;
        color: white;
      }
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
    .report-content {
      grid-template-columns: 1fr;
    }
    .review-panel {
      .review-card {
        position: static;
      }
    }
  }
}
@media (max-width: 768px) {
  .recipe-reports-wrapper {
    padding: 12px;
    .report-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      .header-title {
        font-size: 18px;
      }
    }
    .info-section {
      .info-item {
        .info-label {
          font-size: 12px;
        }
        .info-value {
          font-size: 13px;
        }
      }
    }
  }
}
</style>

