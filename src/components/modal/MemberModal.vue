<script setup>
import { ref, computed, reactive } from 'vue';
import { parsePublicFile } from '@/utils/parseFile';

const visible = ref(false);
// 儲存當前管理員等級
const adminLevel = ref(0);

// 改用 reactive 儲存表單資料，方便雙向綁定
const memberData = reactive({
  user_id: '',
  user_name: '',
  user_email: '',
  user_phone: '',
  user_address: '',
  user_startdate: '',
  is_active: false,
  user_url: ''
});

// ==========================================
// 頭貼
// ==========================================
// 圖片預覽用
const previewUrl = ref('');
const rawFile = ref(null);
const emit = defineEmits(['update']);

// 判斷頭貼路徑
const avatarSrc = computed(() => {
  // 如果有新選的圖片預覽，優先顯示
  if (previewUrl.value) return previewUrl.value;
  // 如果原本有資料
  if (memberData.user_url) return memberData.user_url;
  // 否則回傳預設路徑
  return 'img/site/None_avatar.svg';
});

// ==========================================
// 開啟彈窗的方法
// ==========================================
const open = (data) => {
  // 從 localStorage 讀取剛剛路由守衛存進去的等級
  const savedLevel = localStorage.getItem('admin_level');
  adminLevel.value = savedLevel ? parseInt(savedLevel) : 0;

  // console.log('彈窗偵測到等級：', adminLevel.value);

  // 填入會員資料
  Object.assign(memberData, data);
  previewUrl.value = '';
  rawFile.value = null;
  visible.value = true;
};

// 判斷是否為 Level 2 (唯讀模式)
const isReadOnly = computed(() => adminLevel.value < 2);

// 處理圖片選取與預覽的邏輯
const handleFileChange = (file) => {
  rawFile.value = file.raw;
  previewUrl.value = URL.createObjectURL(file.raw);
};

// 處理點擊「確認修改」的邏輯
const handleSubmit = () => {
  // 如果權限不足，雖然按鈕會消失，但這裡加一層保護
  if (isReadOnly.value) return;

  const payload = JSON.parse(JSON.stringify(memberData));
  emit('update', { ...payload, rawFile: rawFile.value });
  visible.value = false;
};

defineExpose({ open })
</script>


<template>
  <el-dialog v-model="visible" title="會員詳情" width="650px" class="dialog">
    <div class="modal-body">
      <div class="profile-section">
        <div class="avatar-container">
          <el-upload v-if="!isReadOnly" class="avatar-uploader" action="#" :auto-upload="false" :show-file-list="false"
            :on-change="handleFileChange">
            <img :src="previewUrl ? previewUrl : parsePublicFile(avatarSrc)" alt="avatar" class="avatar-img" />
            <div class="avatar-hover">更換照片</div>
          </el-upload>

          <img v-else :src="parsePublicFile(avatarSrc)" alt="avatar" class="avatar-img" style="cursor: default;" />
        </div>

        <div class="info-grid">
          <div class="info-item">
            <strong>會員編號：</strong>
            <span>{{ memberData.user_id }}</span>
          </div>
          <div class="info-item">
            <strong>姓名：</strong>
            <el-input v-model="memberData.user_name" size="small" :disabled="isReadOnly" />
          </div>
          <div class="info-item">
            <strong>電子信箱：</strong>
            <span>{{ memberData.user_email }}</span>
          </div>
          <div class="info-item">
            <strong>電話：</strong>
            <el-input v-model="memberData.user_phone" size="small" :disabled="isReadOnly" />
          </div>
          <div class="info-item">
            <strong>加入日期：</strong>
            <span>{{ memberData.user_startdate }}</span>
          </div>
          <div class="info-item">
            <strong>地址：</strong>
            <el-input v-model="memberData.user_address" type="textarea" autosize size="small" :disabled="isReadOnly" />
          </div>
          <div class="info-item">
            <strong>會員狀態：</strong>
            <el-tag :type="memberData.is_active ? 'success' : 'info'">
              {{ memberData.is_active ? '啟用' : '停權' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button v-if="!isReadOnly" class="btn btn-outline h-40" @click="handleSubmit">
        修改
      </button>

      <button v-else class="btn btn-outline h-40" @click="visible = false">
        關閉
      </button>
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

.avatar-container {
  position: relative;

  .avatar-uploader {
    cursor: pointer;
    border-radius: 50%;
    overflow: hidden;
    width: 120px;
    height: 120px;
  }

  .avatar-hover {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 12px;
    text-align: center;
    padding: 4px 0;
    opacity: 0;
    transition: 0.3s;
  }

  &:hover .avatar-hover {
    opacity: 1;
  }
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;

  strong {
    width: 100px;
    flex-shrink: 0;
  }
}

.modal-footer {
  padding-top: 20px;
  text-align: right;
}
</style>