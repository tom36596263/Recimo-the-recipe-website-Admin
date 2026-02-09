<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi, phpApi } from '@/utils/publicApi';
import DayColumn from '@/components/workspace/mealplan/DayColumn.vue';
import ColumnTitle from '@/components/workspace/mealplan/ColumnTitle.vue';
import PlanPanel from '@/components/workspace/mealplan/PlanPanel.vue';
import RecipePicker from '@/components/workspace/mealplan/RecipePicker.vue';
// 移除 authStore，後台不需要檢查用戶ID
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

// 後台編輯的是 template_id，不是 plan_id
const templateId = computed(() => Number(route.params.id));

// --- 資料狀態 ---
const planData = ref({
  title: '',
  total_days: 7, // 預設值
  description: ''
});
const mealPlanItems = ref([]);
const allRecipes = ref([]);
const coverTemplates = ref([]);
const dailyTargets = ref([]); // 模板通常不設定每日目標，可保留或移除

// --- UI 控制 ---
const showPanel = ref(false);
const selectedDayIndex = ref(null); // 改用 "第幾天" (1, 2, 3...) 而不是 Date 物件

// --- API 請求函數 ---
// PlansDetail.vue

const fetchData = async () => {
  try {
    // 1. 發送請求
    const [planRes, itemsRes, recipesRes, coverTemplatesRes] =
      await Promise.all([
        phpApi.get(
          `mealplans/admin_get_template_details.php?template_id=${templateId.value}`
        ),
        phpApi.get(
          `mealplans/admin_get_template_items.php?template_id=${templateId.value}`
        ),
        phpApi.get('mealplans/get_all_recipes.php'),
        phpApi.get('mealplans/get_cover_templates.php')
      ]);

    // 2. 處理計畫詳情 (Plan Details)
    console.log('API 回傳:', planRes.data); // 🐛 除錯用：看看後端到底回傳什麼

    if (planRes.data && planRes.data.status === 'success') {
      // 確保 data 存在，否則給予預設值，避免畫面炸開
      planData.value = planRes.data.data || { title: '未命名', total_days: 7 };
    } else {
      ElMessage.error(planRes.data?.message || '載入模板失敗');
      // 如果失敗，給個預設值讓畫面至少能顯示
      planData.value = { title: '載入失敗', total_days: 7 };
    }

    // 3. 處理計畫項目 (Items)
    // 相容兩種常見格式：直接回傳陣列，或是包在 { data: [...] } 裡
    const rawItems = itemsRes.data.data || itemsRes.data;
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];

    mealPlanItems.value = itemsArray.map((item) => ({
      ...item,
      day: Number(item.day),
      meal_type: Number(item.meal_type)
    }));

    // 4. 其他靜態資料
    allRecipes.value = recipesRes.data || []; // 確保不為 null
    coverTemplates.value = coverTemplatesRes.data || [];
  } catch (err) {
    console.error('資料讀取失敗：', err);
    ElMessage.error('網路錯誤或資料異常');
  }
};

onMounted(fetchData);

// --- 計算屬性：產生 Day 1, Day 2 列表 ---
const dayList = computed(() => {
  // 確保 total_days 是數字，若無則預設 7
  const days = Number(planData.value.total_days) || 7;
  return Array.from({ length: days }, (_, i) => i + 1); // [1, 2, 3, 4, 5, 6, 7]
});

// 以 "第幾天" 抓取當天的食譜
const getItemsByDay = (day) => {
  return mealPlanItems.value
    .filter((item) => Number(item.day) === day)
    .map((item) => {
      const recipeDetail =
        item.detail ||
        allRecipes.value.find((r) => r.recipe_id === item.recipe_id);
      return { ...item, detail: recipeDetail };
    });
};

// --- 操作邏輯 ---

// 新增食譜到模板
const handleAddRecipe = async (payload) => {
  try {
    // payload 來自 RecipePicker，原本是 date，現在我們要把它當 day 用
    // 假設 RecipePicker 回傳的 payload.date 在後台模式下就是 "第幾天" 的數字
    const res = await phpApi.post('mealplans/admin_add_template_item.php', {
      template_id: templateId.value,
      recipe_id: payload.recipe_id,
      day: payload.date, // 這裡的 date 其實是 day index
      meal_type: payload.meal_type
    });

    if (res.data.success) {
      // 重新撈取 items
      const itemsRes = await phpApi.get(
        `mealplans/admin_get_template_items.php?template_id=${templateId.value}`
      );

      // 確保資料正確
      const itemsData = itemsRes.data.data || itemsRes.data || [];

      mealPlanItems.value = itemsData.map((item) => ({
        ...item,
        day: Number(item.day),
        meal_type: Number(item.meal_type)
      }));

      ElMessage.success('新增成功');
    }
  } catch (err) {
    console.error('新增食譜失敗：', err.message);
  }
};

// 移除食譜
const handleRemoveRecipe = async (itemId) => {
  try {
    const res = await phpApi.post('mealplans/admin_remove_template_item.php', {
      template_item_id: itemId // 注意欄位名稱可能不同
    });

    if (res.data.success) {
      const index = mealPlanItems.value.findIndex(
        (item) => item.item_id === itemId
      );
      if (index !== -1) mealPlanItems.value.splice(index, 1);
      ElMessage.success('移除成功');
    }
  } catch (err) {
    console.error('刪除失敗：', err.message);
  }
};

// 更新計畫基本資訊 (標題、天數)
const handleUpdatePlanInfo = async (newInfo) => {
  console.log('準備更新資訊:', newInfo);

  try {
    // 準備要傳給後端的 payload
    const payload = {
      template_id: templateId.value, // 確保有 template_id
      // 如果 newInfo 裡面有 title 就用新的，沒有就用舊的
      title: newInfo.title !== undefined ? newInfo.title : planData.value.title,
      // 如果 newInfo 裡面有 total_days 就用新的，沒有就用舊的
      total_days:
        newInfo.total_days !== undefined
          ? newInfo.total_days
          : planData.value.total_days,
      description: planData.value.description || ''
    };

    // 呼叫後端 API (你需要確認有沒有這支 API)
    // 假設你有一支類似 admin_update_template_info.php
    const res = await phpApi.post(
      'mealplans/admin_update_template_info.php',
      payload
    );

    if (res.data.status === 'success') {
      // ✅ 更新成功後，同步更新前端畫面
      planData.value = {
        ...planData.value,
        ...newInfo // 把新的天數或標題寫入本地資料，這樣 computed 就會重算，頁籤就會變多/變少
      };
      ElMessage.success('更新成功');
    } else {
      ElMessage.error(res.data.message || '更新失敗');
    }
  } catch (err) {
    console.error('更新請求錯誤:', err);
    ElMessage.error('網路錯誤');
  }
};

// UI 控制
// 這裡將 selectedDate 改名為 selectedDayIndex 以避免混淆，因為它存的是數字
const handleDaySelect = (day) => {
  selectedDayIndex.value = day;
};
const closeDetail = () => {
  selectedDayIndex.value = null;
};
const openPanel = () => {
  showPanel.value = true;
};
const closePanel = () => {
  showPanel.value = false;
};
</script>

<template>
  <main class="container">
    <div class="row">
      <div class="btn-bar col-12">
        <div class="btn-bar__left">
          <button
            class="back-btn"
            @click="router.push('/admin/plans')"
            title="返回列表"
          >
            <i-material-symbols-arrow-back-ios-new-rounded />
          </button>
          <h2 class="plan-title">
            {{ planData.title || '讀取中...' }} (官方模板編輯)
          </h2>
        </div>

        <div class="btn-bar__info-btn" @click="openPanel">
          <i-material-symbols-info-i />
        </div>
      </div>

      <Transition name="fade-scale" mode="out-in">
        <div
          v-if="!selectedDayIndex"
          key="week"
          class="meal-plan-container col-12"
        >
          <ColumnTitle />
          <div class="meal-plan-container__columns">
            <DayColumn
              v-for="day in dayList"
              :key="day"
              :current-date="day"
              :items="getItemsByDay(day)"
              :is-template-mode="true"
              @click="handleDaySelect(day)"
            />
          </div>
        </div>

        <div v-else key="picker" class="meal-detail-view col-12">
          <RecipePicker
            :date="selectedDayIndex"
            :current-items="getItemsByDay(selectedDayIndex)"
            :all-recipes="allRecipes"
            :target-calories="2000"
            :is-template-mode="true"
            :total-days="Number(planData.total_days) || 7"
            @change-date="(newDay) => (selectedDayIndex = newDay)"
            @back="closeDetail"
            @add="handleAddRecipe"
            @remove="handleRemoveRecipe"
          />
        </div>
      </Transition>
    </div>

    <Transition name="slide-fade">
      <PlanPanel
        v-if="showPanel"
        :plan-data="planData"
        :meal-plan-items="mealPlanItems"
        :all-recipes="allRecipes"
        :cover-templates="coverTemplates"
        :is-template-mode="true"
        :initial-day="selectedDayIndex || 1"
        @update-plan-info="handleUpdatePlanInfo"
        @close="closePanel"
      />
    </Transition>

    <Transition name="fade">
      <div v-if="showPanel" class="panel-overlay" @click="closePanel"></div>
    </Transition>
  </main>
</template>

<style lang="scss" scoped>
/* 直接沿用原本的 CSS 即可，因為排版結構沒變 */
.container {
  overflow: hidden;
  padding-bottom: 20px;
}
.btn-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  &__left {
    display: flex;
    align-items: center;
    gap: 15px;
    .back-btn {
      background: #f5f5f5;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: #333;
      &:hover {
        background: #e0e0e0;
      }
    }
    .plan-title {
      font-size: 1.25rem;
      font-weight: bold;
      margin: 0;
    }
  }
  &__info-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e8f5e9;
    color: #2e7d32;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
      background-color: #c8e6c9;
    }
  }
}
.meal-plan-container {
  display: flex;
  gap: 10px;
  min-width: 0;
  &__columns {
    flex-grow: 1;
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 10px;
    &::-webkit-scrollbar {
      height: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ccc;
      border-radius: 5px;
    }
  }
}
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 998;
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    transform 0.4s ease,
    opacity 0.4s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
.meal-detail-view {
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
