<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi, phpApi } from '@/utils/publicApi.js';
import { Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RecipeIntro from '@/components/workspace/recipedetail/RecipeIntro.vue';
import RecipeSteps from '@/components/workspace/recipedetail/RecipeSteps.vue';
import RecipeIngredients from '@/components/workspace/recipedetail/RecipeIngredients.vue';

const route = useRoute();
const router = useRouter();

// 🏆 修正：更安全的取得方式
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
  status === 'pending'
    ? '待審核'
    : status === 'resolved'
      ? '審核通過'
      : '審核不通過';

const reportData = ref({
  reported_recipe_id: '',
  recipe_id: '',
  report_type: '',
  report_reason: '',
  reporter_id: '',
  status: 'pending',
  report_date: '',
  reviewer_id: '',
  review_date: ''
});

// 🏆 圖片處理輔助函數 - 確保拼接後端 8888 埠口路徑
const formatImageUrl = (url) => {
  if (!url) return '';

  // 1. 如果已經是完整網址，直接回傳
  if (url.match(/^(http|data|blob)/)) return url;

  try {
    // 2. 統一格式：確保路徑開頭沒有斜線 (因為 VITE_FILE_URL 通常自帶尾斜線)
    // 或是根據你的 parsePublicFile 邏輯調整
    const cleanPath = url.replace(/^\//, '');

    // 3. 呼叫全域掛載的 $parseFile (即 parseFile.js 裡的 parsePublicFile)
    if ($parseFile) {
      return $parseFile(cleanPath);
    }

    // 4. 萬一 $parseFile 沒掛載成功，手動做保底拼接
    // 請確認你的 .env 檔中 VITE_FILE_URL 是否為 http://localhost:8888/
    const fileBase = import.meta.env.VITE_FILE_URL || 'http://localhost:8888/';
    return `${fileBase}${cleanPath}`;
  } catch (e) {
    console.error('圖片解析出錯:', e);
    return url;
  }
};

const loadData = async () => {
  try {
    loading.value = true;
    const reportIdFromUrl = String(route.params.id).trim();

    const reportRes = await phpApi.get('others/report_manage.php');
    if (reportRes.data.success) {
      const report = reportRes.data.data.find(
        (r) => String(r.report_id) === reportIdFromUrl
      );

      if (report) {
        // 取得純數字 ID (例如 14)
        const pureId = String(report.target_id).replace(/[^\d]/g, '').trim();

        reportData.value = {
          reported_recipe_id: report.report_id,
          recipe_id: pureId,
          report_type: report.type_text,
          report_reason: report.reason,
          reporter_id: report.user_id,
          status: report.status,
          report_date: report.report_at,
          reviewer_id: report.handler_id || '管理員',
          review_date: report.update_at || ''
        };

        const recipeRes = await publicApi.get('data/recipe/recipes.json');
        const foundRecipe = recipeRes.data.find(
          (r) => String(r.recipe_id) === pureId
        );

        if (foundRecipe) {
          recipe.value = foundRecipe;
          const [recipeIngRes, ingMasterRes, stepsRes] = await Promise.all([
            publicApi.get('data/recipe/recipe_ingredient.json'),
            publicApi.get('data/recipe/ingredients.json'),
            publicApi.get('data/recipe/steps.json')
          ]);

          // 在 loadData 函式裡找到 ingredients.value 的 map 部分
          ingredients.value = recipeIngRes.data
            .filter((i) => String(i.recipe_id) === pureId)
            .map((link) => {
              const master = ingMasterRes.data.find(
                (m) => String(m.ingredient_id) === String(link.ingredient_id)
              );
              // 在 ingredients.value = ... 的 map 裡面
              return {
                INGREDIENT_NAME:
                  master?.ingredient_name || `食材ID:${link.ingredient_id}`,
                amount: link.amount,
                unit_name: link.unit_name || '份',
                // 🏆 確保這裡有對接到 JSON 裡的 remark
                remark: link.remark || ''
              };
            });

          steps.value = stepsRes.data
            .filter((s) => String(s.recipe_id) === pureId)
            .sort(
              (a, b) =>
                (Number(a.step_order) || 0) - (Number(b.step_order) || 0)
            );
        }
      }
    }
  } catch (e) {
    console.error('API Error:', e);
  } finally {
    loading.value = false;
  }
};

const recipeIntroData = computed(() => {
  if (!recipe.value) return null;
  return {
    id: recipe.value.recipe_id,
    title: recipe.value.recipe_title || '未命名食譜',
    image: formatImageUrl(
      recipe.value.recipe_image_url || recipe.value.coverImg
    ),
    time: recipe.value.recipe_total_time || '',
    difficulty: Number(recipe.value.recipe_difficulty) || 1,
    // 🏆 修正：同時檢查兩種拼法，預防 JSON 欄位命名錯誤
    description:
      recipe.value.recipe_descreption ||
      recipe.value.recipe_description ||
      '暫無簡介'
  };
});

const stepsData = computed(() => {
  return steps.value.map((s, index) => ({
    id: s.step_id || `s-${index}`,
    title: s.step_title || `步驟 ${index + 1}`,
    content: s.step_content || '',
    image: formatImageUrl(s.step_image_url),
    time: s.step_total_time || '',
    tags: s.tags || []
  }));
});

const updateStatus = async (newStatus) => {
  try {
    reviewLoading.value = true;
    // 🏆 修正：改為實際呼叫 PHP API
    const res = await phpApi.post('others/report_manage.php', {
      report_id: reportData.value.reported_recipe_id,
      report_type: 'recipe',
      target_id: reportData.value.recipe_id, // 👈 這裡的 ID 是純數字
      status: newStatus
    });

    if (res.data.success) {
      ElMessage.success('操作成功');
      reportData.value.status = newStatus;
      await loadData(); // 重新載入以更新更新時間與審核人
    } else {
      ElMessage.error(res.data.message || '操作失敗');
    }
  } catch (e) {
    ElMessage.error('連線異常');
  } finally {
    reviewLoading.value = false;
  }
};

const approveReport = () =>
  ElMessageBox.confirm('確定要同意刪除此食譜嗎？', '確認').then(() =>
    updateStatus('resolved')
  );
const rejectReport = () =>
  ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認').then(() =>
    updateStatus('ignored')
  );
// 🏆 修正後的重新審核邏輯
const resetReview = () => {
  ElMessageBox.confirm(
    '確定要將此案件恢復為「待處理」狀態嗎？',
    '提示',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      // 呼叫 updateStatus 並傳入 'pending'
      // 這會觸發 phpApi.post，把資料庫 status 改回 0
      await updateStatus('pending');
      ElMessage.success('已成功回到待處理狀態');
    })
    .catch(() => {
      // 使用者取消操作，不做事
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
            <RecipeIntro
              :info="recipeIntroData"
              :hideFavorite="true"
              :hideCook="true"
            />
            <el-divider />
            <h4>使用食材</h4>
            <RecipeIngredients :list="ingredients" />
            <el-divider />
            <h4>步驟</h4>
            <RecipeSteps :steps="stepsData" />
          </div>
          <div v-else>
            <el-empty description="查無此食譜內容" />
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
            <div
              class="status-badge"
              :class="getStatusClass(reportData.status)"
            >
              {{ getStatusText(reportData.status) }}
            </div>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ reportData.report_type }}</div>
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
            <el-button
              type="success"
              size="large"
              class="approve-btn"
              @click="approveReport"
            >
              <div class="btn-content">
                <el-icon><Check /></el-icon>
                <span>同意刪除</span>
              </div>
            </el-button>
            <el-button
              type="danger"
              size="large"
              class="reject-btn"
              @click="rejectReport"
            >
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
            <el-button
              type="warning"
              size="large"
              class="modify-btn"
              @click="resetReview"
              style="width: 100%"
            >
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
</style>
