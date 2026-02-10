<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { publicApi } from '@/utils/publicApi';
import PlanRecipeCard from '@/components/workspace/mealplan/PlanRecipeCard.vue';

const props = defineProps({
  date: { type: [Date, Number], required: true },
  currentItems: { type: Array, default: () => [] },
  allRecipes: { type: Array, default: () => [] },
  targetCalories: { type: Number, default: 0 },
  isTemplateMode: { type: Boolean, default: false },
  totalDays: { type: Number, default: 7 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
});

const emit = defineEmits([
  'back',
  'add',
  'remove',
  'update-target',
  'change-date'
]);

// --- 顯示標題邏輯 ---
const displayDate = computed(() => {
  // 🟢 模板模式：直接顯示 Day X
  if (props.isTemplateMode) {
    return `Day ${props.date}`;
  }
  // 前台模式：顯示日期與星期
  if (props.date instanceof Date) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${props.date.getMonth() + 1}/${props.date.getDate()} 星期${weekDays[props.date.getDay()]}`;
  }
  return '';
});

// --- 切換日期 (天數) 邏輯 ---
const changeDate = (value) => {
  // 🟢 模板模式
  if (props.isTemplateMode) {
    const newDay = Number(props.date) + value;
    if (newDay < 1) return; // 最小 Day 1
    emit('change-date', newDay);
    return;
  }

  // 前台模式 (保留原本邊界檢查)
  const currentDateStr = props.date.toISOString().split('T')[0];
  if (
    (value === -1 && currentDateStr === props.startDate) ||
    (value === 1 && currentDateStr === props.endDate)
  )
    return;

  const newDate = new Date(props.date);
  newDate.setDate(newDate.getDate() + value);
  emit('change-date', newDate);
};

// 判斷是否禁用前後按鈕
const isPrevDisabled = computed(() => {
  if (props.isTemplateMode) return props.date <= 1;
  const d =
    props.date instanceof Date ? props.date.toISOString().split('T')[0] : '';
  return d === props.startDate;
});

const isNextDisabled = computed(() => {
  if (props.isTemplateMode) return props.date >= props.totalDays;
  const d =
    props.date instanceof Date ? props.date.toISOString().split('T')[0] : '';
  return d === props.endDate;
});

// --- 響應式狀態 ---
const recipes = ref([]);
const searchQuery = ref('');
const selectedMealType = ref(1); // 0:早餐, 1:午餐, 2:晚餐

// --- 計算熱量 ---
const currentTotalKcal = computed(() => {
  return Math.round(
    props.currentItems.reduce((sum, item) => {
      const recipe = item.detail || {};

      // 🟢 取得食譜總熱量，並轉型為浮點數
      const totalKcal = parseFloat(recipe.recipe_kcal_per_100g) || 0;

      // 🟢 取得食譜份數，並轉型為整數
      let servings = parseInt(recipe.recipe_servings, 10);

      // 🟢 防呆：如果沒值或 <= 0，預設為 1 (避免除以 0 或 NaN)
      if (isNaN(servings) || servings <= 0) servings = 1;

      // 累加：(總熱量 / 份數) = 單人份熱量
      return sum + totalKcal / servings;
    }, 0)
  );
});

// --- 搜尋過濾 ---
const filteredRecipes = computed(() => {
  if (!searchQuery.value.trim()) return recipes.value;
  return recipes.value.filter((recipe) =>
    recipe.recipe_title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// --- 方法 ---
const getItemsByType = (type) =>
  props.currentItems.filter((item) => Number(item.meal_type) === type);

const selectRecipe = (recipe) => {
  // 🟢 根據模式回傳不同格式的 date
  const datePayload = props.isTemplateMode
    ? props.date // 後台回傳數字
    : props.date.toISOString().split('T')[0]; // 前台回傳 YYYY-MM-DD

  emit('add', {
    date: datePayload,
    recipe_id: recipe.recipe_id,
    meal_type: selectedMealType.value
  });
};

const removeRecipe = (item_id) => {
  emit('remove', item_id);
};

// 初始化資料
onMounted(async () => {
  if (props.allRecipes && props.allRecipes.length > 0) {
    recipes.value = props.allRecipes;
  } else {
    try {
      const res = await publicApi.get('data/recipe/recipes.json');
      recipes.value = res.data;
    } catch (e) {
      console.error('無法載入食譜');
    }
  }
});

// --- 熱量目標相關 (保留手動輸入功能，移除彈窗) ---
const localTarget = ref(props.targetCalories);

watch(localTarget, (newVal) => {
  if (newVal < 0) localTarget.value = 0;
  emit('update-target', Number(localTarget.value));
});

watch(
  () => props.targetCalories,
  (newVal) => {
    if (newVal !== localTarget.value) localTarget.value = newVal;
  }
);
</script>

<template>
  <div class="recipe-picker container">
    <header class="recipe-picker__header row">
      <div class="header-left">
        <button class="back-btn" @click="emit('back')" title="返回列表">
          <i-material-symbols-arrow-back-ios-new />
          {{ isTemplateMode ? '返回總覽' : '返回週計畫' }}
        </button>

        <div
          class="previous-date"
          :class="{ 'is-disabled': isPrevDisabled }"
          @click="changeDate(-1)"
        >
          <i-material-symbols-arrow-left />
        </div>

        <h2 class="date-title">
          {{ displayDate }}
        </h2>

        <div
          class="next-date"
          :class="{ 'is-disabled': isNextDisabled }"
          @click="changeDate(1)"
        >
          <i-material-symbols-arrow-right />
        </div>
      </div>

      <div class="header-right">
        <div class="kcal-status-box">
          <div class="kcal-item">
            當日總熱量：<span class="value p-p1">{{ currentTotalKcal }}</span>
            kcal
          </div>
        </div>
      </div>
    </header>

    <section class="recipe-picker__overview row">
      <div
        v-for="(label, type) in { 0: '早餐', 1: '午餐', 2: '晚餐' }"
        :key="type"
        class="meal-slot col-4"
        :class="{ 'is-active': selectedMealType === Number(type) }"
        @click="selectedMealType = Number(type)"
      >
        <div class="meal-slot__header">
          <span class="label">{{ label }}</span>
          <span class="count"
            >{{ getItemsByType(Number(type)).length }} 道菜</span
          >
        </div>

        <div class="meal-slot__content">
          <div v-if="getItemsByType(Number(type)).length > 0" class="mini-list">
            <div
              v-for="item in getItemsByType(Number(type))"
              :key="item.item_id"
              class="mini-item"
              :title="item.detail?.recipe_title"
            >
              <span class="item-title">
                {{
                  item.detail?.recipe_title || item.recipe_title || '載入中...'
                }}
              </span>
              <button
                class="delete-btn"
                @click.stop="removeRecipe(item.item_id)"
                title="移除此食譜"
              >
                <i-material-symbols-delete-outline-rounded />
              </button>
            </div>
          </div>
          <div v-else class="empty-hint">點選下方卡片加入{{ label }}</div>
        </div>
      </div>
    </section>

    <section class="recipe-picker__browser-header row">
      <div class="search-bar col-10">
        <i-material-symbols-search />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋食譜名稱..."
        />
      </div>
    </section>

    <section class="recipe-picker__browser-scroll-area row">
      <div
        class="col-3 col-xl-4 col-lg-6"
        v-for="recipe in filteredRecipes"
        :key="recipe.recipe_id"
        @click="selectRecipe(recipe)"
      >
        <PlanRecipeCard :recipe="recipe" />
      </div>

      <div
        v-if="filteredRecipes.length === 0"
        class="no-results col-12 col-lg-6 col-md-12"
      >
        沒有找到符合「{{ searchQuery }}」的食譜。
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.recipe-picker {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  gap: 16px;
  animation: fadeIn 0.3s ease;

  &__header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: $neutral-color-100;
        padding: 8px 16px;
        border-radius: 8px;
        color: $primary-color-800;
        cursor: pointer;
        border: 1px solid transparent;
        border-radius: 10px;

        &:hover {
          background: $accent-color-100;
          color: $accent-color-800;
          border: 1px solid $accent-color-800;
        }
      }

      .date-title {
        font-size: 1.4rem;
        color: $primary-color-800;
        margin: -25px;
      }

      .previous-date,
      .next-date {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.4rem;
        color: $primary-color-800;
        cursor: pointer;

        &:hover {
          color: $accent-color-700;
        }
        &.is-disabled {
          color: $primary-color-400;
          cursor: default;
        }
      }
    }

    .header-right {
      .kcal-status-box {
        display: flex;
        gap: 24px;
        align-items: center;

        .kcal-item {
          font-size: 1rem;
          color: $neutral-color-800;
          .value {
            color: $primary-color-800;
            font-weight: bold;
            font-size: 1.2rem;
          }
        }
      }
    }
  }

  &__overview {
    flex-shrink: 0;
    display: flex;
    gap: 12px;

    .meal-slot {
      flex: 1;
      background: $neutral-color-100;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      border: 1px solid transparent;

      &.is-active {
        background: $primary-color-100;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba($neutral-color-black, 0.1);

        .meal-slot__header .label {
          color: $primary-color-800;
        }
        .meal-slot__header .count {
          color: $primary-color-400;
          font-size: 0.75rem;
        }
        .mini-list .mini-item {
          color: $primary-color-800;
        }
      }

      &:hover {
        background: $accent-color-100;
        border: 1px solid $accent-color-800;
        .meal-slot__header .label {
          color: $accent-color-700;
        }
        .meal-slot__header .count {
          color: $accent-color-400;
          font-size: 0.75rem;
        }
        .meal-slot__content {
          border-color: $accent-color-400;
        }
        .mini-list .mini-item {
          color: $accent-color-400;
        }
        .empty-hint {
          color: $accent-color-400;
        }
      }

      &__header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        .label {
          font-weight: bold;
          color: $neutral-color-700;
        }
        .count {
          font-size: 0.75rem;
          color: $neutral-color-400;
        }
      }

      &__content {
        height: 64px;
        border: 1px dashed $neutral-color-400;
        border-radius: 8px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        overflow-y: auto;
        scrollbar-width: none;
        height: 100px;
        &::-webkit-scrollbar {
          display: none;
        }

        .mini-list {
          width: 100%;
          padding: 8px 6px;
          .mini-item {
            font-size: 16px;
            font-weight: bold;
            color: $neutral-color-700;
            background: $neutral-color-white;
            padding: 4px 10px;
            margin-bottom: 4px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .mini-item:last-child {
            margin-bottom: 0;
          }

          .item-title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
          }

          .delete-btn {
            display: none;
            background: none;
            border: none;
            color: $neutral-color-400;
            cursor: pointer;
            padding: 0;
            margin-left: 8px;
            display: flex;
            align-items: center;
            opacity: 0;
            &:hover {
              color: $secondary-color-danger-700;
            }
            svg {
              width: 18px;
              height: 18px;
            }
          }
          &:hover .delete-btn {
            display: flex;
            opacity: 1;
          }
        }

        .empty-hint {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: $neutral-color-400;
        }
      }
    }
  }

  &__browser-header {
    display: flex;
    gap: 20px;
    .search-bar {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: $neutral-color-100;
      padding: 10px 20px;
      border-radius: 30px;
      input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 1rem;
      }
    }
  }

  &__browser-scroll-area {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    overflow-y: auto;
    // gap: 2px;
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: $neutral-color-100;
      border-radius: 10px;
    }
    .no-results {
      text-align: center;
      padding: 80px 0;
      color: $neutral-color-400;
      font-size: 1.1rem;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
