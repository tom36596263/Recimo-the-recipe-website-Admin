<script setup>
import { ref, onMounted, computed } from 'vue';
const visible = ref(false)
const memberData = ref({})


// 開啟彈窗的方法，供父組件調用
const open = (data) => {
  memberData.value = data
  visible.value = true
}

defineExpose({ open })
</script>


<template>
  <el-dialog
    v-model="visible"
    title="會員詳情"
    width="600px"
    class="dialog"
  >
    <div class="modal-body">
        <div class="profile-section">
          <div class="avatar-container">
            <img src="/img/test1.jpg" alt="avatar" class="avatar-img" />
          </div>
          <div class="info-grid">
            <div class="info-item"><strong>會員編號：</strong> {{ memberData.USER_ID }}</div>
            <div class="info-item"><strong>姓名：</strong> {{ memberData.USER_NAME }}</div>
            <div class="info-item"><strong>電子信箱：</strong> {{ memberData.USER_EMAIL }}</div>
            <div class="info-item"><strong>電話：</strong> {{ memberData.USER_PHONE }}</div>
            <div class="info-item"><strong>加入日期：</strong> {{ memberData.USER_STARTDATE }}</div>
            <div class="info-item"><strong>地址：</strong> {{ memberData.USER_ADDRESS }}</div>
            <div class="info-item"><strong>會員狀態：</strong> {{ memberData.IS_ACTIVE?'正常':'停權' }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <el-button class="btn-close" @click="visible = false">關閉</el-button>
        </div>
        
      </div>
  </el-dialog>
</template>


<style lang="scss" scoped>

.modal-body { padding: 20px; }
.profile-section { display: flex; gap: 30px; }
.avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; }
.info-grid { flex: 1; display: grid; grid-template-columns: 1fr; gap: 15px; border-bottom: 1px solid #eee; }
.info-item { border-bottom: 1px solid #eee; padding-bottom: 5px; }
.modal-footer { padding-top: 20px; text-align: right; }
.btn-close { background-color: #3E8D60; color: white; border: none; padding: 8px 25px; border-radius: 4px; cursor: pointer; }
</style>