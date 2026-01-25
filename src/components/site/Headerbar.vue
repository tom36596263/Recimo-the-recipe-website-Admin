<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

// 1. 定義響應式變數，預設為「載入中...」或空白
const adminInfo = ref({
  name: '',
  level: ''
});

// 根據 level 轉換稱呼
const roleName = computed(() => {
  const level = Number(adminInfo.value.level);
  if (level === 2) return '主要管理員';
  if (level === 1) return '管理員';
  return '';
});

onMounted(() => {
  const userData = localStorage.getItem('admin_user');

  if (userData) {
    try {
      const user = JSON.parse(userData);
      adminInfo.value.name = user.name;
      adminInfo.value.level = user.level;
    } catch (error) {
      console.error('解析使用者資料失敗', error);
    }
  } else {
    router.push('/login');
  }
});
/**
 * 處理登出邏輯
 */
const handleLogout = () => {
  ElMessageBox.confirm('確定要登出管理系統嗎？', '登出確認', {
    confirmButtonText: '確定登出',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'custom-logout-box', // 自定義類名
  }).then(() => {
    // 清除存儲的資訊
    localStorage.removeItem('admin_user');
    ElMessage.success('已成功登出');
    router.push('/login');
  }).catch(() => {
    // 使用者取消登出
  });
};
</script>

<template>
  <div class="headerbar">
    <h3 class="zh-h3">{{ adminInfo.name }} ({{ roleName }})</h3>
    <div style="width: 80px">
      <button class="btn h-40 btn-solid" @click="handleLogout">登出</button>
    </div>
  </div>
</template>

<style lang="scss">
//中性色
$neutral-color-black: #000;
$neutral-color-800: #555555;
$neutral-color-700: #868686;
$neutral-color-400: #ABABAB;
$neutral-color-100: #F5F5F5;
$neutral-color-white: #fff;

// 網站主色
$primary-color-800: #2E6F4A;
$primary-color-700: #3E8D60;
$primary-color-400: #74D09C;
$primary-color-100: #F1F6EF;

//強調色
$accent-color-800: #ED8A00;
$accent-color-700: #FFA527;
$accent-color-400: #FFCB82;
$accent-color-100: #FFF1DE;

//輔助色
//success
$secondary-color-success-700: #5ED822;
$secondary-color-success-400: #8FEF60;
$secondary-color-success-200: #CDFFB5;
//warning
$secondary-color-warning-700: #EEEE05;
$secondary-color-warning-400: #F7F766;
$secondary-color-warning-200: #FFFFB0;
//danger
$secondary-color-danger-700: #FF5858;
$secondary-color-danger-400: #FF8686;
$secondary-color-danger-200: #FFCFCF;
//info
$secondary-color-info-700: #5AABFF;
$secondary-color-info-400: #90C6FF;
$secondary-color-info-200: #D3E9FF;

.headerbar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 30px;
  padding-right: 20px;
}


.custom-logout-box {
  border-radius: 10px;

  // 彈窗「確定」按鈕顏色
  .el-button--primary {
    border: 1px solid $secondary-color-danger-700 !important;
    background-color: $secondary-color-danger-700 !important;
    color: $neutral-color-white;

    &:hover {
      border: 1px solid $secondary-color-danger-700 !important;
      background-color: $secondary-color-danger-400 !important;
    }
  }

  // 彈窗「取消」按鈕顏色
  .el-button:not(.el-button--primary) {
    border: 1px solid $secondary-color-danger-700 !important;
    background-color: $neutral-color-white !important;
    color: $secondary-color-danger-700 !important;

    &:hover {
      background-color: $secondary-color-danger-200 !important;
    }
  }
}


// 彈窗「驚嘆號」顏色
.el-message-box__status.el-message-box-icon--warning {
  color: $secondary-color-danger-700;
}
</style>