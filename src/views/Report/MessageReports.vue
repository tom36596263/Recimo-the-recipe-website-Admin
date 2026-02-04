<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 🏆 改用 phpApi
import { phpApi } from '@/utils/publicApi.js';
import { ArrowLeft, Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

// ===== 頁面數據 =====
const loading = ref(false);

// 檢舉類型對應中文 (這裡保持你的對應，或根據 PHP 回傳的 type_text 顯示)
const reportTypeMap = {
  0: '廣告/垃圾訊息',
  1: '人身攻擊/歧視',
  2: '不當圖片',
  3: '詐騙/不實訊息',
  4: '其他違規'
};

// 審核狀態對應中文 (對應 PHP 回傳的字串狀態)
const statusTextMap = {
  pending: '待審核',
  resolved: '審核通過',
  ignored: '審核不通過'
};

// 將字串狀態轉為你原本 CSS 用的數字 (0, 1, 2)
const statusNumberMap = {
  pending: 0,
  resolved: 1,
  ignored: 2
};

// 根據 STATUS 獲取狀態文字
const getStatusText = (status) => statusTextMap[status] ?? '未知狀態';

// 根據 STATUS 獲取狀態 class (這裡會回傳 "待審核" 等，對應你 CSS 的 class)
const getStatusClass = (status) => {
  const num = statusNumberMap[status];
  if (num === 0) return '待審核';
  if (num === 1) return '已核准'; // 修正：對應你 CSS 裡的 .已核准
  if (num === 2) return '已拒絕'; // 修正：對應你 CSS 裡的 .已拒絕
  return '';
};

const reportData = ref({
  REPORTED_COMMENT_ID: '',
  COMMENT_ID: '',
  REPORTER_ID: '',
  REPORT_TYPE: '',
  REPORT_REASON: '',
  STATUS: 'pending', // 初始改為字串
  HANDLER_ID: '',
  REPORTERD_AT: '',
  UPDATE_AT: '',
  comment_content: ''
});

// ===== 步驟1：載入舉報數據 (從 PHP 抓) =====
const loadReportData = async () => {
  try {
    loading.value = true;
    const reportId = route.params.id;
    // 🏆 呼叫 PHP API
    const response = await phpApi.get('others/report_manage.php');
    if (response.data.success) {
      const allData = response.data.data;
      // 找到對應 ID 的資料
      const report = allData.find(
        (r) => String(r.report_id) === String(reportId)
      );

      if (report) {
        // 映射後端欄位到你原本的 reportData 結構
        reportData.value = {
          REPORTED_COMMENT_ID: report.report_id,
          COMMENT_ID: report.comment_id || 'N/A',
          REPORTER_ID: report.user_id,
          REPORT_TYPE: report.type_text, // 直接用後端給的中文
          REPORT_REASON: report.reason,
          STATUS: report.status, // 'pending', 'resolved', 'ignored'
          HANDLER_ID: '管理員', // 後端有需要可再補
          REPORTERD_AT: report.report_at,
          UPDATE_AT: report.update_at,
          comment_content: report.reason // 如果有內容欄位再替換
        };
      }
    }
  } catch (error) {
    console.error('載入舉報數據失敗:', error.message);
    ElMessage.error('無法取得資料庫連線');
  } finally {
    loading.value = false;
  }
};

// 封裝一個更新狀態的 function
const updateStatus = async (newStatus) => {
  try {
    loading.value = true;
    const res = await phpApi.post('others/report_manage.php', {
      report_id: reportData.value.REPORTED_COMMENT_ID,
      report_type: 'comment',
      status: newStatus
    });

    if (res.data.success) {
      ElMessage.success('操作成功');
      await loadReportData(); // 重新整理頁面數據
    } else {
      ElMessage.error(res.data.message || '操作失敗');
    }
  } catch (error) {
    ElMessage.error('連線異常');
  } finally {
    loading.value = false;
  }
};

// ===== 步驟2：核准舉報 =====
const approveReport = () => {
  ElMessageBox.confirm('確定要核准此舉報內容嗎？', '確認', {
    confirmButtonText: '同意',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => updateStatus('resolved'))
    .catch(() => ElMessage.info('已取消'));
};

// ===== 步驟3：拒絕舉報 =====
const rejectReport = () => {
  ElMessageBox.confirm('確定要駁回此舉報嗎？', '確認', {
    confirmButtonText: '駁回',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => updateStatus('ignored'))
    .catch(() => ElMessage.info('已取消'));
};

// ===== 步驟4：修改審核 =====
const resetReview = () => {
  ElMessageBox.confirm('確定要修改審核嗎？', '確認', {
    confirmButtonText: '修改',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => updateStatus('pending'))
    .catch(() => ElMessage.info('已取消'));
};

const goBack = () => router.push('/admin/reports');

onMounted(loadReportData);
</script>

<template>
  <div class="message-reports-wrapper">
    <div class="report-header">
      <h2 class="header-title">留言檢舉管理</h2>
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
                  <span class="info-label">被檢舉留言編號</span>
                  <div class="info-value">{{ reportData.COMMENT_ID }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="info-item">
                  <span class="info-label">案件編號</span>
                  <div class="info-value">
                    {{ reportData.REPORTED_COMMENT_ID }}
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
          <el-divider />
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ reportData.REPORT_TYPE }}</div>
            </div>
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
          <el-divider />
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">文言內容</span>
              <el-input
                v-model="reportData.comment_content"
                type="textarea"
                :rows="6"
                readonly
                class="content-textarea"
              />
            </div>
          </div>
          <el-divider />
        </el-card>
      </div>

      <div class="review-panel">
        <el-card class="review-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>留言審核</h3>
            </div>
          </template>

          <div class="status-section">
            <div
              class="status-badge"
              :class="getStatusClass(reportData.STATUS)"
            >
              {{ getStatusText(reportData.STATUS) }}
            </div>
          </div>

          <el-divider />

          <div v-if="reportData.STATUS === 'pending'" class="action-buttons">
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
            <el-divider />
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
/* 這裡完全沒動你的 CSS */
.message-reports-wrapper {
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
      .content-textarea {
        width: 100%;
        :deep(.el-textarea__inner) {
          background-color: #f5f7fa;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          resize: none;
          font-size: 14px;
          line-height: 1.6;
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
  .reviewer-info {
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

// ===== 響應式設計 =====
@media (max-width: 1024px) {
  .message-reports-wrapper {
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
  .message-reports-wrapper {
    padding: 12px;

    .report-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-title h2 {
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
