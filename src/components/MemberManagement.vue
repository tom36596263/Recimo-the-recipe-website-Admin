<script setup>
defineProps({
  modelValue: Boolean, // 控制顯示
  memberData: Object   // 傳入的會員資料
});
defineEmits(['update:modelValue']);
</script>


<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-content">
      <div class="modal-header">
        <h3>會員詳情</h3>
        <button class="close-btn" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="profile-section">
          <div class="avatar-container">
            <img src="./test1.jpg" alt="avatar" class="avatar-img" />
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
      </div>

      <div class="modal-footer">
        <button class="btn-close" @click="$emit('update:modelValue', false)">關閉</button>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white; width: 600px; border-radius: 8px; overflow: hidden;
}
.modal-header {
  background-color: #e8f5e9; padding: 10px 20px;
  display: flex; justify-content: space-between; align-items: center;
  .close-btn{
    background-color: #e8f5e9;
    border: 0;
    cursor: pointer;
  }
}
.modal-body { padding: 30px; }
.profile-section { display: flex; gap: 30px; }
.avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; }
.info-grid { flex: 1; display: grid; grid-template-columns: 1fr; gap: 15px; border-bottom: 1px solid #eee; }
.info-item { border-bottom: 1px solid #eee; padding-bottom: 5px; }
.modal-footer { padding: 15px; text-align: right; }
.btn-close { background-color: #3E8D60; color: white; border: none; padding: 8px 25px; border-radius: 4px; cursor: pointer; }
</style>