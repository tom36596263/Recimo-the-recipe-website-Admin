<script setup>
import { defineEmits } from 'vue';
const emit = defineEmits(['updated']);
import { ref, shallowReactive } from 'vue'
const visible = ref(false)
const staffData = ref({})
const mode = ref('add')// 'add' 或 'edit'
const formRef = ref(null)

let form = shallowReactive({
  name: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const open = (type, data = null) => {
  mode.value = type;
  // 預設全部清空
  form.name = '';
  form.username = '';
  form.password = '';
  form.confirmPassword = '';
  // 編輯時帶入正確欄位
  if (type === 'edit' && data) {
    form.name = data.admin_name || data.name || data.staff_name || data.username || '';
    form.username = data.admin_account || data.username || data.account || '';
    staffData.value = data;
  }
  visible.value = true;
};

defineExpose({ open })

const usernameError = ref('');
const usernamePasswordPattern = /^[A-Za-z0-9@_.-]{6,}$/;
const rules = {
  name: [{ required: true, message: '請輸入名稱', trigger: 'blur' }],
  username: [
    { required: true, message: '請輸入帳號', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (usernameError.value) {
          callback(new Error(usernameError.value));
          usernameError.value = '';
        } else if (!usernamePasswordPattern.test(value)) {
          callback(new Error('帳號需至少6字，僅限英文、數字、@、_、-、.'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  password: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!usernamePasswordPattern.test(value)) {
          callback(new Error('密碼需至少6字，僅限英文、數字、@、_、-、.'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '請確認密碼', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('兩次輸入的密碼不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

import { phpApi } from '@/utils/publicApi.js';
import { ElMessage } from 'element-plus';

const handleSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      // 新增模式才送出 API
      if (mode.value === 'add') {
        try {
          const payload = {
            admin_account: form.username,
            admin_password: form.password,
            admin_name: form.name
          };
          const res = await phpApi.post('others/admin_add.php', payload);
          ElMessage.success('新增成功');
          visible.value = false;
          emit('updated');
        } catch (e) {
          // 檢查是否帳號已存在
          const msg = e?.response?.data || e.message;
          if (msg && msg.includes('帳號已存在')) {
            usernameError.value = '帳號已存在，請更換帳號';
            if (formEl && formEl.validateField) formEl.validateField('username');
          }
          ElMessage.error('新增失敗: ' + msg);
        }
      } else if (mode.value === 'edit') {
        try {
          const payload = {
            admin_id: Number(staffData.value.admin_id),
            admin_account: form.username,
            admin_password: form.password,
            admin_name: form.name,
          };
          const res = await phpApi.patch('others/admin_update.php', payload);
          ElMessage.success('更新成功');
          visible.value = false;
          emit('updated');
        } catch (e) {
          // 檢查是否帳號已存在
          const msg = e?.response?.data || e.message;
          if (msg && msg.includes('帳號已存在')) {
            usernameError.value = '帳號已存在，請更換帳號';
            if (formEl && formEl.validateField) formEl.validateField('username');
          }
          ElMessage.error('更新失敗: ' + msg);
        }
      }
    }
  });
}
</script>


<template>
  <el-dialog v-model="visible" :title="mode === 'edit' ? '更改管理員帳號' : '新增管理員'" width="440px" custom-class="admin-dialog"
    destroy-on-close>
    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="custom-form">
      <el-form-item label="名稱" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="帳號" prop="username">
        <el-input v-model="form.username" />
      </el-form-item>

      <el-form-item label="新密碼" prop="password">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>

      <el-form-item label="確認密碼" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button type="button" class="btn btn-solid h-40" style="width: 70px;" @click="handleSubmit(formRef)">
          {{ mode === 'edit' ? '儲存' : '新增' }}
        </button>

        <button type="button" class="btn btn-outline h-40" style="width: 70px;" @click="visible = false">
          取消
        </button>
      </div>
    </template>
  </el-dialog>
</template>



<style lang="scss">
// 定義主題色
$primary-green: #438b69;
$hover-green: #367054;



.custom-form {
  .el-form-item {
    margin-bottom: 18px;

    .el-form-item__label {
      font-weight: bold;
      color: #333;
      padding-bottom: 4px;

      &::before {
        display: none; // 隱藏必填紅星（如果想跟圖片一樣簡潔）
      }
    }

    .el-input__inner {
      height: 40px;
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 20px;
  justify-content: center;

  .el-button {
    width: 120px;
    height: 40px;
    font-size: 1rem;
    border-radius: 6px;
    transition: all 0.3s;

    &.btn-confirm {
      background-color: $primary-green;
      border-color: $primary-green;

      &:hover {
        background-color: $hover-green;
        border-color: $hover-green;
      }
    }

    &.btn-cancel {
      background-color: transparent;
      border: 1px solid $primary-green;
      color: $primary-green;

      &:hover {
        background-color: rgba($primary-green, 0.1);
      }
    }
  }
}
</style>