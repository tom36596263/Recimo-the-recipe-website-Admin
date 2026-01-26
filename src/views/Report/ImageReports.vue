<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi } from '@/utils/publicApi.js';
import { Check, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

// ===== 頁面數據 =====
const loading = ref(false);

// 檢舉類型對應中文
const reportTypeMap = {
  0: '廣告/垃圾訊息',
  1: '人身攻擊/歧視',
  2: '不當圖片',
  3: '詐騙/不實訊息',
  4: '其他違規'
}

// 審核狀態對應中文
const statusMap = {
  0: '待審核',
  1: '審核通過',
  2: '審核不通過'
}

// 根據 STATUS 獲取狀態文字
const getStatusText = (status) => statusMap[status] ?? '未知狀態'

// 根據 STATUS 獲取狀態 class
const getStatusClass = (status) => {
  if (status === 0) return '待審核'
  if (status === 1) return '審核通過'
  if (status === 2) return '審核不通過'
  return ''
}

const reportData = ref({
  REPORTED_IMAGE_ID: '',
  COMMENT_ID: '',
  REPORTER_ID: '',
  REPORT_TYPE: '',
  REPORT_REASON: '',
  STATUS: '',
  HANDLER_ID: '',
  REPORTERD_AT: '',
  UPDATE_AT: ''
});

// ===== 步驟1：載入舉報數據 =====
/**
 * loadReportData 方法
 * 功能說明：根據路由參數取得舉報 ID，並從外部 API 獲取舉報詳細資料
 */
const loadReportData = async () => {
  try {
    loading.value = true;
    const reportId = route.params.id;
    const response = await publicApi.get('data/social/reported_images.json');
    const reports = response.data;
    const report = reports.find(r => String(r.REPORTED_IMAGE_ID) === String(reportId));
    if (report) {
      reportData.value = { ...report };
    }
  } catch (error) {
    console.error('載入舉報數據失敗:', error.message);
  } finally {
    loading.value = false;
  }
};

// ===== 步驟2：核准舉報 =====
/**
 * approveReport 方法
 * 功能說明：核准移除舉報圖片
 */
const approveReport = () => {
  ElMessageBox.confirm(
    '確定要同意刪除此圖片嗎？',
    '確認',
    {
      confirmButtonText: '同意',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      // 模擬 API 請求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      reportData.value.STATUS = 1;
      reportData.value.HANDLER_ID = 10;
      reportData.value.UPDATE_AT = new Date().toLocaleString('zh-TW');
      ElMessage.success('舉報已審核通過');
    } catch (error) {
      ElMessage.error('操作失敗，請重試');
      console.error('核准失敗:', error);
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

// ===== 步驟3：拒絕舉報 =====
/**
 * rejectReport 方法
 * 功能說明：拒絕舉報
 */
const rejectReport = () => {
  ElMessageBox.confirm(
    '確定要駁回此舉報嗎？',
    '確認',
    {
      confirmButtonText: '駁回',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      // 模擬 API 請求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      reportData.value.STATUS = 2;
      reportData.value.HANDLER_ID = 10;
      reportData.value.UPDATE_AT = new Date().toLocaleString('zh-TW');
      ElMessage.success('舉報已審核不通過');
    } catch (error) {
      ElMessage.error('操作失敗，請重試');
      console.error('拒絕失敗:', error);
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

// ===== 步驟4：修改審核 =====
/**
 * resetReview 方法
 * 功能說明：重置審核狀態，允許重新審核
 */
const resetReview = () => {
  ElMessageBox.confirm(
    '確定要修改審核嗎？',
    '確認',
    {
      confirmButtonText: '修改',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    reportData.value.STATUS = 0;
    reportData.value.HANDLER_ID = null;
    reportData.value.UPDATE_AT = null;
    ElMessage.success('已重置為待審核狀態');
  }).catch(() => {
    ElMessage.info('已取消');
  });
};

// ===== 步驟5：返回列表 =====
/**
 * goBack 方法
 * 功能說明：返回舉報列表頁面
 */
const goBack = () => {
  router.push('/admin/reports');
};

onMounted(() => {
  loadReportData();
});
</script>

<template>
  <div class="image-reports-wrapper">
    <!-- ===== 頂部返回區 ===== -->
    <div class="report-header">
      <h2 class="header-title">圖片檢舉管理</h2>
      <div class="header-actions">
        <el-button @click="goBack" class="back-btn">
          返回
        </el-button>
      </div>
    </div>

    <!-- ===== 主要內容區 ===== -->
    <div class="report-content">
      <!-- ===== 左側：舉報詳情 ===== -->
      <div class="report-detail">
        <el-card class="detail-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>舉報詳情</h3>
            </div>
          </template>

          <!-- 基本信息 -->
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
                  <div class="info-value">{{ reportData.REPORTED_IMAGE_ID }}</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <!-- 檢舉類型 -->
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉類型</span>
              <div class="info-value">{{ reportTypeMap[reportData.REPORT_TYPE] ?? reportData.REPORT_TYPE }}</div>
            </div>
          </div>

          <el-divider />

          <!-- 檢舉原因 -->
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">檢舉原因</span>
              <div class="info-value">{{ reportData.REPORT_REASON }}</div>
            </div>
          </div>

          <el-divider />

          <!-- 圖片預覽 -->
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">舉報圖片</span>
              <div class="image-preview">
                <img src="https://via.placeholder.com/400x300" alt="舉報圖片" />
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 舉報人 ID 與檢舉時間 -->
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

      <!-- ===== 右側：審核面板 ===== -->
      <div class="review-panel">
        <el-card class="review-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>圖片審核</h3>
            </div>
          </template>

          <!-- 審核狀態 -->
          <div class="status-section">
            <div class="status-badge" :class="reportData.status">
              {{ reportData.status }}
            </div>
          </div>

          <!-- 審核狀態 -->
          <div class="status-section">
            <div class="status-badge" :class="getStatusClass(reportData.STATUS)">
              {{ getStatusText(reportData.STATUS) }}
            </div>
          </div>

          <el-divider />

          <!-- 審核按鈕（待審核狀態） -->
          <div v-if="reportData.STATUS === 0" class="action-buttons">
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

          <!-- 審核結果（已審核狀態） -->
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
.image-reports-wrapper {
  padding: 20px;
  min-height: 100vh;

  // ===== 頂部返回區 =====
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

  // ===== 主要內容區 =====
  .report-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 20px;
    align-items: start;
  }

  // ===== 左側詳情卡片 =====
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

  // ===== 卡片頂部 =====
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

  // ===== 信息項樣式 =====
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

  // ===== 分割線 =====
  :deep(.el-divider) {
    margin: 15px 0;
    background: #e8e8e8;
  }

  // ===== 右側審核面板 =====
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

  // ===== 審核狀態 =====
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

  // ===== 審核按鈕 =====
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

  // ===== 審核人員信息 =====
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
  .image-reports-wrapper {
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
  .image-reports-wrapper {
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