<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete} from '@element-plus/icons-vue'

//刪除彈窗
const open = () => {
  ElMessageBox.confirm(
    '確定要刪除嗎?',
    '警告',
    {
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'my-custom-confirm',
    }
  )
    .then(() => {
      ElMessage({
        type: 'success',
        message: '刪除成功',
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消刪除',
      })
    })
}

</script>

<template>
  <el-button link @click="open">
        <el-icon><Delete /></el-icon>
    </el-button>
</template>

<style lang="scss">
    .my-custom-confirm{
        background-color: #3E8D60 !important; 

    }
</style>