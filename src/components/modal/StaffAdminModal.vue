<script setup>
import { ref, onMounted, computed } from 'vue';
const visible = ref(false)
const staffData = ref({})
const mode = ref('add')// 'add' 或 'edit'
const password = ref('')
const confirmPassword = ref('')

// 開啟彈窗的方法，供父組件調用
const open = (type, data=null) => {
  mode.value = type
  if (type === 'edit' && data) {
    staffData.value = data
  } else {
    staffData.value = {}
  }
  visible.value = true
}

defineExpose({ open })
</script>


<template>
  <el-dialog
    v-model="visible"
    :title="mode==='edit'?'更改管理員帳號':'新增管理員'"
    width="600px"
    class="ingredient-dialog"
  >
    <!-- <div class="modal-body"> -->
        <div class="profile-section">
          <div class="info-grid">
            <el-form-item label="名稱" v-if="staffData.ADMIN_LEVEL!=2">
              <el-input v-model="staffData.ADMIN_NAME" placeholder="請輸入名稱" />
            </el-form-item>
            <div class="info-item" v-else><strong>名稱：</strong> {{ staffData.ADMIN_NAME }}</div>

            <el-form-item label="帳號"  v-if="staffData.ADMIN_LEVEL!=2">
              <el-input v-model="staffData.ADMIN_ACCOUNT" placeholder="請輸入帳號" />
            </el-form-item>
            <div class="info-item" v-else><strong>帳號：</strong> {{ staffData.ADMIN_ACCOUNT }}</div>

            <el-form-item label="新密碼">
              <el-input v-model="password" placeholder="請輸入密碼" />
            </el-form-item>
            <el-form-item label="確認密碼">
              <el-input v-model="confirmPassword" placeholder="請輸入確認密碼" />
            </el-form-item>
          </div>
        </div>
        <div class="modal-footer">
          <el-button class="btn-close" @click="visible = false">{{mode==='edit'?'儲存':'新增'}}</el-button>
          <el-button class="btn-close" @click="visible = false">關閉</el-button>
        </div>
        
      <!-- </div> -->
  </el-dialog>
</template>


<style lang="scss">
  .el-dialog__header {
    background-color: #e8f5e9; // 淺綠色頂部
    margin-right: 0;
    padding: 15px 20px;
    .el-dialog__title {
      font-weight: bold;
      color: #333;
    }
  }
// .modal-overlay {
//   position: fixed;
//   top: 0; left: 0; width: 100%; height: 100%;
//   background: rgba(0, 0, 0, 0.5);
//   display: flex; justify-content: center; align-items: center;
//   z-index: 1000;
// }
.modal-body { padding: 20px; }
.profile-section { display: flex; gap: 30px; }
.avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; }
.info-grid { flex: 1; display: grid; grid-template-columns: 1fr; gap: 15px; border-bottom: 1px solid #eee; }
.info-item { border-bottom: 1px solid #eee; padding-bottom: 5px; }
.modal-footer { padding-top: 20px; text-align: right; }
.btn-close { background-color: #3E8D60; color: white; border: none; padding: 8px 25px; border-radius: 4px; cursor: pointer; }
</style>