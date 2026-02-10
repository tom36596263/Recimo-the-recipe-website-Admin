<script setup>
import BaseTag from '@/components/common/BaseTag.vue';
// 🟢 建議：明確引入圖片解析工具，避免依賴全域變數設定
import { parsePublicFile } from '@/utils/parseFile.js';

/**
 * PlanRecipeCard.vue
 * 目的：在 RecipePicker 的搜尋清單中呈現與 RecipeCardSm 風格一致的食譜資訊。
 */
const props = defineProps({
  recipe: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

// 點擊卡片或按鈕時觸發新增邏輯
const handleAdd = () => {
  emit('click', props.recipe);
};
</script>

<template>
  <div class="recipe-card-lg" @click="handleAdd">
    <header class="card-header">
      <img
        :src="parsePublicFile(recipe.recipe_image_url)"
        :alt="recipe.recipe_title"
      />
    </header>

    <div class="card-body">
      <div class="title">
        <h4 class="zh-h4">{{ recipe.recipe_title }}</h4>
      </div>

      <div class="tag-group p-p1">
        <div class="tag p-p1">
          {{ Math.round(recipe.recipe_kcal_per_100g) }}kcal
        </div>
        <div class="tag p-p1">{{ recipe.recipe_protein_per_100g }}P</div>
        <div class="tag p-p1">難度：{{ recipe.recipe_difficulty }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recipe-card-lg {
  border: 1px solid $neutral-color-400;
  border-radius: $radius-base;
  overflow: hidden;
  background-color: $neutral-color-white;
  cursor: pointer;
  transition: 0.3s ease;
  width: auto;
  margin: 10px auto;
  flex-shrink: 0;
  &:hover {
    box-shadow: 0 4px 12px rgba($neutral-color-black, 0.1);
    transform: translateY(-2px);
  }

  .card-header {
    overflow: hidden;
    height: 150px;
    width: 100%;

    img {
      object-fit: cover;
      display: block;
      width: 100%;
      height: 100%;
      transition: 0.3s ease;

      &:hover {
        scale: 1.1; // 圖片縮放效果
      }
    }
  }

  .card-body {
    padding: 16px;

    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      color: $primary-color-700;

      h4 {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
      }
    }

    .tag-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .tag {
        background-color: $neutral-color-100;
        color: $neutral-color-800;
        padding: 0px 4px;
        border-radius: 5px;
        font-size: 12px;
      }
    }
  }
}
</style>
