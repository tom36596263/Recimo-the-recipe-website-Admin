<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { phpApi } from '@/utils/publicApi.js';
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  recipeId: {
    type: [Number, String],
    required: true
  },
  onDelete: Function
});
const emit = defineEmits(['deleted']);

const handleDelete = () => {
  ElMessageBox.confirm(
    '確定要永久刪除此食譜嗎？此動作無法復原。',
    '警告',
    {
      confirmButtonText: '確定刪除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await phpApi.post('recipes/recipe_delete.php', {
        recipe_id: props.recipeId
      });
      if (res.data.status === 'success') {
        ElMessage.success('刪除成功');
        emit('deleted'); // 💡 通知父元件重新刷清單
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      ElMessage.error('刪除失敗：' + error.message);
    }
  }).catch(() => {});
};

</script>

<template>
  <el-button link @click="handleDelete">
    <el-icon>
      <Delete />
    </el-icon>
  </el-button>
</template>

<style lang="scss">
.my-custom-confirm {
  background-color: #3E8D60 !important;

}
</style>