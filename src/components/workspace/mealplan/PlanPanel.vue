<script setup>
import { ref, computed, watch } from 'vue';
import DateTabs from './DateTabs.vue';
import NutritionChart from './NutritionChart.vue';

const props = defineProps({
  planData: { type: Object, required: true },
  mealPlanItems: { type: Array, default: () => [] },
  allRecipes: { type: Array, default: () => [] },
  targetCalories: { type: Number, default: 2000 },
  isTemplateMode: { type: Boolean, default: false },
  initialDay: { type: Number, default: 1 }
});

const emit = defineEmits(['close', 'update-plan-info']);

// ------ 1. 產生頁籤列表 (Day 1, Day 2...) ------
const dateTabsData = computed(() => {
  if (props.isTemplateMode || !props.planData.start_date) {
    const days = Number(props.planData.total_days) || 7;
    const list = [];
    for (let i = 1; i <= days; i++) {
      list.push({ id: i, day: 'Day', date: i });
    }
    return list;
  }
  const start = new Date(props.planData.start_date);
  const end = new Date(props.planData.end_date);
  const list = [];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  let current = new Date(start);
  let idCounter = 1;
  while (current <= end) {
    list.push({
      id: idCounter++,
      day: weekDays[current.getDay()],
      date: current.getDate().toString(),
      fullDate: current.toISOString().split('T')[0]
    });
    current.setDate(current.getDate() + 1);
  }
  return list;
});

const activeTabId = ref(props.initialDay || 1);

watch(
  () => props.initialDay,
  (newVal) => {
    if (newVal) {
      activeTabId.value = newVal;
    }
  }
);

const currentNutritionData = computed(() => {
  const activeTab = dateTabsData.value.find(
    (tab) => tab.id === activeTabId.value
  );
  if (!activeTab)
    return { calories: 0, protein: 0, carbs: 0, starch: 0, fat: 0 };

  const todaysItems = props.mealPlanItems.filter((item) => {
    if (props.isTemplateMode) return Number(item.day) === activeTab.id;
    return item.planned_date && item.planned_date.includes(activeTab.fullDate);
  });

  return todaysItems.reduce(
    (acc, item) => {
      const recipe =
        item.detail ||
        props.allRecipes.find(
          (r) => Number(r.recipe_id) === Number(item.recipe_id)
        );
      if (recipe) {
        acc.calories += Number(recipe.recipe_kcal_per_100g) || 0;
        acc.protein += Number(recipe.recipe_protein_per_100g) || 0;
        acc.carbs += Number(recipe.recipe_carbs_per_100g) || 0;
        acc.fat += Number(recipe.recipe_fat_per_100g) || 0;
        acc.starch += Number(recipe.recipe_carbs_per_100g) * 0.7 || 0;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, starch: 0, fat: 0 }
  );
});

const handleAddDay = () => {
  if (props.planData.total_days < 30) {
    emit('update-plan-info', {
      total_days: Number(props.planData.total_days) + 1
    });
  }
};

const handleRemoveDay = () => {
  if (props.planData.total_days > 1) {
    if (confirm('確定要減少一天嗎？該日的食譜將會被隱藏（如果有的話）。')) {
      emit('update-plan-info', {
        total_days: Number(props.planData.total_days) - 1
      });
    }
  }
};

const closePanel = () => {
  emit('close');
};
</script>

<template>
  <div class="plan-panel">
    <div class="plan-panel__header">
      <div class="plan-panel__title-block">
        <div class="plan-panel__field p-p1">
          <span class="label">名稱：</span>
          <input
            type="text"
            :value="planData.title || '載入中...'"
            @blur="(e) => emit('update-plan-info', { title: e.target.value })"
            class="plan-panel__input title p-p1"
          />
        </div>
      </div>
      <div class="plan-panel__close" @click="closePanel">
        <i-material-symbols-close />
      </div>
    </div>

    <div class="plan-panel__description-block">
      <div class="field-label p-p1">描述：</div>
      <textarea
        class="description-input p-p2"
        :value="planData.description || ''"
        @blur="(e) => emit('update-plan-info', { description: e.target.value })"
        placeholder="請輸入計畫描述..."
      ></textarea>
    </div>

    <div class="plan-panel__tabs">
      <DateTabs
        v-model="activeTabId"
        :tabs="dateTabsData"
        :is-template-mode="isTemplateMode"
        @add-day="handleAddDay"
        @remove-day="handleRemoveDay"
      />
    </div>

    <div class="plan-panel__chart">
      <h3 class="plan-panel__chart-title p-p1">單日營養總計</h3>
      <NutritionChart :data="currentNutritionData" :target="targetCalories" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.plan-panel {
  width: 510px;
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  background-color: $neutral-color-white;
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  z-index: 999;
  box-shadow: -5px 0 15px rgba($neutral-color-black, 0.1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $primary-color-800;
    font-weight: bold;
    width: 100%;

    .label {
      flex-shrink: 0;
    }
  }

  &__input {
    border: 0;
    border-bottom: 1px solid transparent;
    outline: none;
    background-color: transparent;
    padding: 4px 0;
    color: inherit;
    transition: border-bottom 0.3s;
    width: 100%;

    &:focus {
      border-bottom: 1px solid $primary-color-800;
    }

    &.title {
      font-weight: bold;
    }
  }

  /* 🔴 新增：描述區塊樣式 */
  &__description-block {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .field-label {
      color: $primary-color-800;
      font-weight: bold;
    }

    .description-input {
      width: 100%;
      min-height: 80px;
      padding: 10px;
      border: 1px solid $neutral-color-400;
      border-radius: 8px;
      resize: vertical; /* 允許垂直調整大小 */
      outline: none;
      background-color: $neutral-color-100;
      color: $neutral-color-800;
      font-family: inherit;
      line-height: 1.5;

      &:focus {
        border-color: $primary-color-800;
        background-color: $neutral-color-white;
      }

      &::placeholder {
        color: $neutral-color-400;
      }

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  &__close {
    cursor: pointer;
    font-size: 1.5rem;
    color: $neutral-color-400;
    transition: color 0.2s;

    &:hover {
      color: $primary-color-800;
    }
  }

  &__tabs {
    margin-top: 10px;
  }

  &__chart {
    padding-bottom: 40px;
  }

  &__chart-title {
    color: $primary-color-800;
    font-weight: bold;
    margin-bottom: 10px;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
