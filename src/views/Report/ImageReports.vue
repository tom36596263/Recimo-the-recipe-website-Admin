<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { phpApi } from '@/utils/publicApi.js';
import { Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const loading = ref(false);

const statusTextMap = { pending: '待審核', resolved: '審核通過', ignored: '審核不通過' };
const statusClassMap = { pending: '待審核', resolved: '已核准', ignored: '已拒絕' };

const getStatusText = (status) => statusTextMap[status] ?? '未知狀態';
const getStatusClass = (status) => statusClassMap[status] ?? '';

const reportData = ref({
  REPORTED_IMAGE_ID: '',
  TARGET_LABEL: '被檢舉目標 ID',
  COMMENT_ID: '',
  RECIPE_ID: '', // 🏆 新增欄位：記錄所在食譜 ID
  REPORTER_ID: '',
  REPORT_TYPE: '',
  REPORT_REASON: '',
  STATUS: 'pending',
  HANDLER_ID: '',
  REPORTERD_AT: '',
  UPDATE_AT: '',
  IMAGE_URL: '',
  INTERNAL_TYPE: '',
  DISPLAY_TEXT: ''
});

const loadReportData = async () => {
  if (loading.value) return; 
  
  try {
    loading.value = true;
    const reportIdFromUrl = String(route.params.id);
    
    // 呼叫後端 API (已在 PHP 補上 recipe_id)
    const response = await phpApi.get('others/report_manage.php');
    
    if (response.data.success) {
      const allData = response.data.data;
      const report = allData.find(r => String(r.report_id) === reportIdFromUrl);

      if (report) {
        const labelMap = {
          comment: '被檢舉留言 ID',
          gallery: '被檢舉成品 ID',
          recipe:  '被檢舉食譜 ID'
        };

        // 1. 修正圖片路徑
        let finalImageUrl = '';
        if (report.report_img) {
          const apiBase = phpApi.defaults.baseURL.replace(/\/+$/, '');
          const cleanPath = report.report_img
            .replace(/^\/+/, '')
            .replace('social/32/', 'social/'); 
          finalImageUrl = `${apiBase}/${cleanPath}`;
        } else {
          finalImageUrl = 'https://placehold.co/400x300?text=No+Image+Provided';
        }

        // 2. 重新賦值並加入 RECIPE_ID
        reportData.value = {
          REPORTED_IMAGE_ID: report.report_id,
          TARGET_LABEL: labelMap[report.report_type] || '被檢舉目標 ID',
          COMMENT_ID: report.target_id || report.report_id, 
          RECIPE_ID: report.recipe_id || 'N/A', // 🏆 抓取 API 回傳的 recipe_id
          REPORTER_ID: report.user_id,
          REPORT_TYPE: report.type_text,
          REPORT_REASON: report.reason || '未提供原因', 
          STATUS: report.status,
          HANDLER_ID: report.handler_id || '管理員',
          REPORTERD_AT: report.report_at,
          UPDATE_AT: (report.status === 'pending') ? '尚未處理' : (report.update_at || '時間不詳'),
          IMAGE_URL: finalImageUrl,
          INTERNAL_TYPE: report.report_type,
          DISPLAY_TEXT: report.display_text || '(此內容不包含文字資訊)'
        };
      } else {
        ElMessage.error('找不到該筆檢舉資料');
        router.push('/admin/reports');
      }
    }
  } catch (error) {
    console.error("載入失敗詳情:", error);
    ElMessage.error('資料載入失敗');
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (newStatus) => {
  try {
    loading.value = true;
    const res = await phpApi.post('others/report_manage.php', {
      report_id: reportData.value.REPORTED_IMAGE_ID,
      report_type: reportData.value.INTERNAL_TYPE,
      target_id: reportData.value.COMMENT_ID,
      status: newStatus
    });

    if (res.data.success) {
      ElMessage.success('狀態已更新');
      await loadReportData(); 
    } else {
      ElMessage.error(res.data.message || '操作失敗');
    }
  } catch (error) {
    ElMessage.error('連線異常');
  } finally {
    loading.value = false;
  }
};

const approveReport = () => {
  ElMessageBox.confirm('確定要同意刪除此內容嗎？', '確認', {
    confirmButtonText: '同意', cancelButtonText: '取消', type: 'warning'
  }).then(() => updateStatus('resolved')).catch(() => {});
};

const rejectReport = () => {
  ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認', {
    confirmButtonText: '駁回', cancelButtonText: '取消', type: 'warning'
  }).then(() => updateStatus('ignored')).catch(() => {});
};

const resetReview = () => {
  ElMessageBox.confirm('確定要修改審核狀態嗎？', '確認', {
    confirmButtonText: '修改', cancelButtonText: '取消', type: 'warning'
  }).then(() => updateStatus('pending')).catch(() => {});
};

const goBack = () => router.push('/admin/reports');
onMounted(loadReportData);
</script>

<template>
  <div class="image-reports-wrapper">
    <div class="report-header">
      <h2 class="header-title">內容檢舉管理</h2>
      <div class="header-actions">
        <el-button @click="goBack" class="back-btn"> 返回 </el-button>
      </div>
    </div>

    <div class="report-content">
      <div class="report-detail">
        <el-card class="detail-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>舉報詳情</h3>
            </div>
          </template>

          <div class="info-section">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">{{ reportData.TARGET_LABEL }}</span>
                  <div class="info-value">{{ reportData.COMMENT_ID }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">所在食譜 ID</span>
                  <div class="info-value"># {{ reportData.RECIPE_ID }}</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <div class="info-section">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">檢舉類型</span>
                  <div class="info-value">{{ reportData.REPORT_TYPE }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">案件編號</span>
                  <div class="info-value">{{ reportData.REPORTED_IMAGE_ID }}</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉原因</span>
              <div class="info-value">{{ reportData.REPORT_REASON }}</div>
            </div>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">被檢舉的原始內容 (心得/留言)</span>
              <div class="info-value original-content-box">
                {{ reportData.DISPLAY_TEXT || '(此筆資料無文字內容)' }}
              </div>
            </div>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">舉報內容圖片</span>
              <div class="image-preview">
                <img
                  :src="reportData.IMAGE_URL"
                  alt="舉報圖片"
                  @error="(e) => (e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found')"
                />
              </div>
              <p v-if="reportData.INTERNAL_TYPE === 'comment'" style="font-size: 12px; color: #999; margin-top: 8px;">
                * 此為留言檢舉，通常不包含實體圖片。
              </p>
            </div>
          </div>

          <el-divider />

          <div class="info-section">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">舉報人 ID</span>
                  <div class="info-value">{{ reportData.REPORTER_ID }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">檢舉時間</span>
                  <div class="info-value">{{ reportData.REPORTERD_AT }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <div class="review-panel">
        <el-card class="review-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>案件審核</h3>
            </div>
          </template>

          <div class="status-section">
            <div class="status-badge" :class="getStatusClass(reportData.STATUS)">
              {{ getStatusText(reportData.STATUS) }}
            </div>
          </div>

          <el-divider />

          <div v-if="reportData.STATUS === 'pending'" class="action-buttons">
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
                <div class="info-value">{{ reportData.HANDLER_ID }}</div>
              </div>
              <div class="info-item">
                <span class="info-label">審核時間</span>
                <div class="info-value">{{ reportData.UPDATE_AT }}</div>
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
/* 保持你原本的樣式，並確保 original-content-box 樣式正確 */
.image-reports-wrapper {
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
  }

  .card-header {
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
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

      .image-preview {
        width: 100%;
        max-width: 400px;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e8e8e8;
        background: #f5f7fa;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }

  :deep(.el-divider) {
    margin: 15px 0;
    background: #e8e8e8;
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

      &.已核准 {
        background: #f0f9ff;
        color: #409eff;
        border: 1px solid #c6e2ff;
      }

      &.已拒絕 {
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

  .result-info {
    .info-item {
      margin-bottom: 12px;

      .info-label {
        font-weight: 600;
        color: #666;
        font-size: 13px;
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

.original-content-box {
  background: #fdf6ec!important; /* 淺橘背景 */
  padding: 12px 15px;
  border-radius: 4px;
  color: #606266;
  white-space: pre-wrap; 
  margin-top: 5px;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .report-content {
    grid-template-columns: 1fr;
  }
  .review-panel .review-card {
    position: static;
  }
}
</style>