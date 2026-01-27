<script setup>
import { ref, onMounted, computed } from 'vue';
const visible = ref(false)
const memberData = ref({})

// 判斷頭貼路徑
const avatarSrc = computed(() => {
  // 如果有資料且 user_url 不為空
  if (memberData.value.user_url) {
    return memberData.value.user_url;
  }
  // 否則回傳預設路徑
  return '/img/site/None_avatar.svg';
});

// 開啟彈窗的方法，供父組件調用
const open = (data) => {
  memberData.value = data
  visible.value = true
}

defineExpose({ open })
</script>


<template>
  <el-dialog v-model="visible" title="會員詳情" width="600px" class="dialog">
    <div class="modal-body">
      <div class="profile-section">
        <div class="avatar-container">
          <img :src="avatarSrc" alt="avatar" class="avatar-img" />
        </div>
        <div class="info-grid">
          <div class="info-item"><strong>會員編號：</strong> {{ memberData.user_id }}</div>
          <div class="info-item"><strong>姓名：</strong> {{ memberData.user_name }}</div>
          <div class="info-item"><strong>電子信箱：</strong> {{ memberData.user_email }}</div>
          <div class="info-item"><strong>電話：</strong> {{ memberData.user_phone }}</div>
          <div class="info-item"><strong>加入日期：</strong> {{ memberData.user_startdate }}</div>
          <div class="info-item"><strong>地址：</strong> {{ memberData.user_address }}</div>
          <div class="info-item"><strong>會員狀態：</strong> {{ memberData.is_active ? '正常' : '停權' }}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline h-40" @click="visible = false">
          關閉
        </button>
      </div>

    </div>
  </el-dialog>
</template>


<style lang="scss" scoped>
.modal-body {
  padding: 20px;
}

.profile-section {
  display: flex;
  gap: 30px;
}

.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.info-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  border-bottom: 1px solid #eee;
}

.info-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.modal-footer {
  padding-top: 20px;
  text-align: right;
}

.btn-close {
  background-color: #3E8D60;
  color: white;
  border: none;
  padding: 8px 25px;
  border-radius: 4px;
  cursor: pointer;
}
</style>