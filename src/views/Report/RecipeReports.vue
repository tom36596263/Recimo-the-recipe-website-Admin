<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';
import { Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RecipeIntro from '@/components/workspace/recipedetail/RecipeIntro.vue';
import RecipeSteps from '@/components/workspace/recipedetail/RecipeSteps.vue';
import RecipeIngredients from '@/components/workspace/recipedetail/RecipeIngredients.vue';

const route = useRoute();
const router = useRouter();
const instance = getCurrentInstance();
const $parseFile = instance?.proxy?.$parseFile;

const loading = ref(false);
const reviewLoading = ref(false);
const recipe = ref(null);
const ingredients = ref([]);
const steps = ref([]);

// 狀態映射
const statusTextMap = { 
  pending: '待審核', 
  resolved: '審核通過', 
  ignored: '審核不通過' 
};
const getStatusText = (status) => statusTextMap[status] ?? '未知狀態';
const getStatusClass = (status) =>
  status === 'pending' ? '待審核' : status === 'resolved' ? '審核通過' : '審核不通過';

const reportData = ref({
  reported_recipe_id: '',
  recipe_id: '',
  report_type: '',
  report_reason: '',
  status: 'pending',
  report_date: '',
  reviewer_id: '',
  review_date: ''
});

// 圖片路徑處理
const formatImageUrl = (url) => {
  if (!url) return '';
  if (url.match(/^(http|data|blob)/)) return url;
  try {
    const cleanPath = url.replace(/^\//, '');
    if ($parseFile) return $parseFile(cleanPath);
    const fileBase = import.meta.env.VITE_FILE_URL || 'http://localhost:8888/';
    return `${fileBase}${cleanPath}`;
  } catch (e) {
    return url;
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const reportIdFromUrl = String(route.params.id).trim();

    // 1. 抓取檢舉清單資訊
    const reportRes = await phpApi.get('others/report_manage.php');
    if (reportRes.data.success) {
      const report = reportRes.data.data.find(r => String(r.report_id) === reportIdFromUrl);

      if (report) {
        const pureId = String(report.target_id).replace(/[^\d]/g, '').trim();
        reportData.value = {
          reported_recipe_id: report.report_id,
          recipe_id: pureId,
          report_type: report.type_text,
          report_reason: report.reason,
          status: report.status,
          report_date: report.report_at,
          reviewer_id: report.handler_id || '管理員',
          review_date: report.update_at || ''
        };

        // 2. 抓取食譜詳細內容
        const recipeRes = await phpApi.get(`recipes/recipe_detail_get.php?recipe_id=${pureId}&admin=1`);

        
        if (recipeRes.data.success) {
          const resData = recipeRes.data.data;
          recipe.value = resData.main;
          
          ingredients.value = (resData.ingredients || []).map(i => ({
            INGREDIENT_NAME: i.ingredient_name,
            amount: i.amount,
            unit_name: i.unit_name || '份',
            remark: i.remark || ''
          }));

          steps.value = resData.steps || [];
        } else {
          ElMessage.error('找不到食譜內容');
        }
      }
    }
  } catch (e) {
    console.error('API Error:', e);
    ElMessage.error('資料載入失敗');
  } finally {
    loading.value = false;
  }
};

const recipeIntroData = computed(() => {
  if (!recipe.value) return null;
  return {
    id: recipe.value.recipe_id,
    title: recipe.value.recipe_title,
    image: formatImageUrl(recipe.value.recipe_image_url),
    time: recipe.value.recipe_total_time,
    difficulty: Number(recipe.value.recipe_difficulty) || 1,
    description: recipe.value.recipe_description || '暫無簡介'
  };
});

const stepsData = computed(() => {
  return steps.value.map((s, index) => ({
    id: s.step_id || `s-${index}`,
    title: s.step_title || `步驟 ${index + 1}`,
    content: s.step_content || '',
    image: formatImageUrl(s.step_image_url),
    time: s.step_total_time || ''
  }));
});

const updateStatus = async (newStatus) => {
  try {
    reviewLoading.value = true;
    const res = await phpApi.post('others/report_manage.php', {
      report_id: reportData.value.reported_recipe_id,
      report_type: 'recipe',
      target_id: reportData.value.recipe_id,
      status: newStatus
    });

    if (res.data.success) {
      ElMessage.success('操作成功');
      await loadData();
    } else {
      ElMessage.error(res.data.message || '操作失敗');
    }
  } catch (e) {
    ElMessage.error('連線異常');
  } finally {
    reviewLoading.value = false;
  }
};

const approveReport = () => ElMessageBox.confirm('確定要同意刪除此食譜嗎？', '確認').then(() => updateStatus('resolved'));
const rejectReport = () => ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認').then(() => updateStatus('ignored'));
const resetReview = () => ElMessageBox.confirm('確定要將此案件恢復為「待處理」狀態嗎？', '提示').then(() => updateStatus('pending'));
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
              <h3>食譜資訊內容</h3>
            </div>
          </template>
          <div v-if="recipe">
            <RecipeIntro :info="recipeIntroData" :hideFavorite="true" :hideCook="true" />
            <el-divider />
            <h4>使用食材</h4>
            <RecipeIngredients :list="ingredients" />
            <el-divider />
            <h4>製作步驟</h4>
            <RecipeSteps :steps="stepsData" />
          </div>
          <div v-else>
            <el-empty description="查無此食譜詳細內容" />
          </div>
        </el-card>
      </div>

      <div class="review-panel">
        <el-card class="review-card" v-loading="reviewLoading">
          <template #header>
            <div class="card-header">
              <h3>審核控制台</h3>
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
              <span class="info-label">食譜 ID</span>
              <div class="info-value"># {{ reportData.recipe_id }}</div>
            </div>
            <div class="info-item">
              <span class="info-label">食譜名稱</span>
              <div class="info-value" style="font-weight: bold; color: #3e8d60; font-size: 16px;">
                {{ recipe?.recipe_title || '載入中...' }}
              </div>
            </div>
            
            <el-divider style="margin: 12px 0; border-style: dashed;" />

            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ reportData.report_type }}</div>
            </div>
            <div class="info-item">
              <span class="info-label">檢舉理由</span>
              <div class="info-value">{{ reportData.report_reason || '未提供理由' }}</div>
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
            <el-button type="warning" size="large" @click="resetReview" style="width: 100%">
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
      border: none;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
    }
  }
  .info-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      .info-label {
        font-weight: 600;
        color: #888;
        font-size: 12px;
        text-transform: uppercase;
      }
      .info-value {
        color: #333;
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }
  .status-section {
    .status-badge {
      padding: 10px;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
      &.待審核 { background: #fff5f5; color: #f56c6c; border: 1px solid #feb2b2; }
      &.審核通過 { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
      &.審核不通過 { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    }
  }
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    .approve-btn { background: #3e8d60; border-color: #3e8d60; color: white; width: 100%; }
    .reject-btn { width: 100%; margin: 0 !important; }
    .btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
  }
  .review-panel {
    .review-card {
      position: sticky;
      top: 20px;
      border: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
  }
  .review-result {
    .result-info {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }
}
@media (max-width: 1024px) {
  .report-content { grid-template-columns: 1fr; }
  .review-panel .review-card { position: static; }
}
</style>