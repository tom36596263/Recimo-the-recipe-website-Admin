<script setup>
import { ref, reactive } from 'vue'
const visible = ref(false)
const staffData = ref({})
const mode = ref('add')// 'add' 或 'edit'
const formRef = ref(null)



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

const form = reactive({
  name: '主要管理員',
  username: 'admin123',
  password: '',
  confirmPassword: ''
})

const rules = {
  name: [{ required: true, message: '請輸入名稱', trigger: 'blur' }],
  username: [{ required: true, message: '請輸入帳號', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入新密碼', trigger: 'blur' }],
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

const handleSubmit = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      console.log('Submit Success!', form)
      dialogVisible.value = false
    }
  })
}
</script>


<template>
  <el-dialog
    v-model="visible"
    :title="mode==='edit'?'更改管理員帳號':'新增管理員'"
    width="440px"
    custom-class="admin-dialog"
    destroy-on-close
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-position="top"
      class="custom-form"
    >
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
        <el-button type="primary" class="btn-confirm" @click="handleSubmit(formRef)">
          {{mode==='edit'?'儲存':'新增'}}
        </el-button>
        <el-button class="btn-cancel" @click="visible = false">
          取消
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>



<style lang="scss" >
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