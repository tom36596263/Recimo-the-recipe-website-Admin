<script setup>
import { ref, provide, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRecipeStore } from '@/stores/recipeEditor';
import { phpApi } from '@/utils/publicApi';
import { parsePublicFile } from '@/utils/parseFile';

import EditorHeader from '@/components/workspace/editrecipe/EditorHeader.vue';
import IngredientEditor from '@/components/workspace/editrecipe/IngredientEditor.vue';
import StepEditor from '@/components/workspace/editrecipe/StepEditor.vue';

const router = useRouter();
const route = useRoute();
const recipeStore = useRecipeStore();

// --- 讀取 Vite 的 Base 路徑 ---
const baseUrl = import.meta.env.BASE_URL;

const isEditing = ref(true);
const isPublished = ref(false);
const isLoading = ref(true);
// 判斷當前是「更新舊食譜」還是「建立新食譜」
const currentMode = computed(() => {
  // 如果有 recipe_id 且不是在改編模式下，就是「更新」
  // (註：改編模式雖然有來源 ID，但那是 parent_recipe_id，最終是存成一筆新的食譜)
  return recipeForm.value.recipe_id ? 'update' : 'create';
});

// --- 1. 食譜表單資料 ---
const recipeForm = ref({
  recipe_id: null,
  parent_recipe_id: null,
  title: '',
  description: '',
  coverImg: null,
  difficulty: 1,
  totalTime: 30,
  ingredients: [],
  steps: [],
  tags: [],
  original_title: '',
  adapt_title: '',
  adapt_description: ''
});

const isAdaptModeActive = computed(() => {
  const hasParentId = !!recipeForm.value.parent_recipe_id;
  const hasAdaptQuery = route.query.action === 'adapt';
  return hasParentId || hasAdaptQuery;
});

const loadRecipeData = async () => {
  const rawId = route.query.editId || route.params.id;
  const editIdFromUrl = rawId ? Number(rawId) : null;
  const isAdapt = route.query.action === 'adapt';

if (recipeStore.rawEditorData) {
    // 使用簡單的展開運算子處理第一層，確保 File 物件不被破壞
    const savedData = recipeStore.rawEditorData;
    recipeForm.value = { 
      ...savedData,
      steps: [...savedData.steps] // 關鍵：展開步驟陣列
    };
    recipeStore.rawEditorData = null; // 清空緩存
    return;
  }

  if (!editIdFromUrl) return;

  try {
    isLoading.value = true; 
    
    // 💡 關鍵：補上 &admin=1，讓 PHP 允許讀取「下架/不公開」的食譜
    const response = await phpApi.get(`recipes/recipe_detail_get.php?recipe_id=${editIdFromUrl}&admin=1`);
    
    if (!response.data.success) {
      // 這裡如果失敗，現在會清楚顯示 PHP 回傳的 message
      console.error('載入失敗:', response.data.message);
      return;
    }

    const apiData = response.data.data;
    const found = apiData.main;

    // 2. 基礎欄位映射
    if (isAdapt) {
      recipeForm.value.recipe_id = null;
      recipeForm.value.parent_recipe_id = editIdFromUrl;
      recipeForm.value.original_title = found.recipe_title;
      recipeForm.value.title = `${found.recipe_title} (改編版)`;
    } else {
      recipeForm.value.recipe_id = editIdFromUrl;
      recipeForm.value.title = found.recipe_title;
    }

    recipeForm.value.servings = Number(found.recipe_servings) || 1;

    recipeForm.value.description = found.recipe_description || '';
    recipeForm.value.difficulty = Number(found.recipe_difficulty) || 1;
    recipeForm.value.tags = apiData.tags ? apiData.tags.map(t => ({
      tag_id: t.tag_id,
      tag_name: t.tag_name
    })) : [];

    // 3. 【關鍵】使用 parsePublicFile 處理封面圖
    // 如果資料庫存的是 'img/recipes/1/cover.jpg'，它會自動補上 fileBase
    recipeForm.value.coverImg = parsePublicFile(found.recipe_image_url);

    // 4. 時間轉換 (將 HH:MM:SS 轉為純分鐘數給 Slider 使用)
    const totalTimeStr = String(found.recipe_total_time || '00:30:00');
    if (totalTimeStr.includes(':')) {
      const parts = totalTimeStr.split(':'); // [HH, MM, SS]
      recipeForm.value.totalTime = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      recipeForm.value.totalTime = parseInt(totalTimeStr, 10) || 30;
    }

    // 5. 映射食材 (API 已完成 JOIN)
    recipeForm.value.ingredients = apiData.ingredients.map(ing => ({
      // id: ing.recipe_ingredient_id,
      id: Number(ing.ingredient_id),
      name: ing.ingredient_name,
      amount: ing.amount,
      unit: ing.unit_name,
      note: ing.remark || '',
      kcal_per_100g: ing.kcal_per_100g || 0
    }));

    // 6. 映射步驟與步驟圖
    recipeForm.value.steps = apiData.steps.map((s, index) => {
      return {
        id: isAdapt ? `adapt-step-${index}` : (s.step_id || `s-${index}`),
        origin_step_id: s.step_id || null,
        title: s.step_title || `步驟 ${index + 1}`,
        content: s.step_content || '',
        // 【關鍵】同樣使用 parsePublicFile 處理步驟圖
        image: parsePublicFile(s.step_image_url),
        time: s.total_seconds ? Math.floor(s.total_seconds / 60) : 0,
        tags: s.step_ingredients || [] // 這些是該步驟關聯的食材 ID 陣列
      };
    });

  } catch (err) {
    console.error('❌ API 讀取異常:', err);
  } finally {
    isLoading.value = false;
  }
};

// 監聽路由變化，當 editId 改變時重新載入數據
watch(
  () => route.query.editId,
  (newId) => {
    if (newId) {
      loadRecipeData();
    }
  }
);

onMounted(() => {
  loadRecipeData();
});

const handlePreview = () => {
  // 1. 使用「淺拷貝」配上「手動處理步驟陣列」，保留原始 File 物件
  const previewForm = {
    ...recipeForm.value,
    // 處理封面圖：如果是檔案，轉成網址供預覽元件顯示
    coverImg: recipeForm.value.coverImg instanceof File 
      ? URL.createObjectURL(recipeForm.value.coverImg) 
      : recipeForm.value.coverImg,
    // 處理步驟圖
    steps: recipeForm.value.steps.map(step => ({
      ...step,
      image: step.image instanceof File 
        ? URL.createObjectURL(step.image) 
        : step.image
    }))
  };

  // 2. 重要：存回 store 的「原始資料」必須是原本的 recipeForm.value (含有原始 File 物件)
  // 這樣回來編輯頁時，檔案才不會變成字串網址或消失
  recipeStore.rawEditorData = { ...recipeForm.value };
  
  // 3. 傳遞給預覽頁面的資料 (包含轉好的 blob 網址)
  recipeStore.setPreviewFromEditor(previewForm);

  const currentId = route.query.editId || route.params.id || 0;
  const query = { mode: 'preview', editId: currentId };
  if (isAdaptModeActive.value) query.action = 'adapt';
  
  router.push({ path: `/admin/recipes/${currentId}`, query });
};

const handleSave = async () => {
  if (!recipeForm.value.title) {
    alert('請輸入食譜標題');
    return;
  }

  // 小技巧：將圖片轉換為 Base64 (如果它是 File 物件)
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
  
  try {
    // 複製一份資料進行處理，避免影響 UI
    const payload = JSON.parse(JSON.stringify(recipeForm.value));
    payload.mode = currentMode.value;
    payload.status = isPublished.value ? 1 : 0; // 根據 checkbox 決定狀態
    payload.tags = recipeForm.value.tags.map(t => t.tag_id);
    payload.ingredients = payload.ingredients.map(ing => ({
        id: Number(ing.id),
        amount: ing.amount,
        unit: ing.unit,    // 確認這裡與資料庫欄位名一致
        note: ing.note        // 確認這裡與資料庫欄位名一致
    }));
    // 處理主圖
    if (recipeForm.value.coverImg instanceof File) {
      payload.coverImg = await toBase64(recipeForm.value.coverImg);
    }

    // 處理步驟圖
    for (let i = 0; i < payload.steps.length; i++) {
      if (recipeForm.value.steps[i].image instanceof File) {
        payload.steps[i].image = await toBase64(recipeForm.value.steps[i].image);
      }
    }

    // 發送請求
    console.log(`正在發送資料 [模式: ${payload.mode}]...`, payload);
    const res = await phpApi.post('recipes/recipe_post.php', payload);

    if (res.data.success) {
      alert('儲存成功！');
      router.push('/admin/recipes'); // 儲存後跳轉，列表頁會觸發 loadDataFromPhp 更新
    } else {
      alert('儲存失敗：' + res.data.message);
    }
  } catch (error) {
    console.error('API 錯誤', error);
  }
};
// const handleSave = async() => {
//   console.log("儲存前的標題:", recipeForm.value.title);
//   try {
//         const formData = new FormData();
        
//         // 1. 基本字串欄位
//         formData.append('recipe_id', recipeForm.value.recipe_id || '');
//         formData.append('parent_recipe_id', recipeForm.value.parent_recipe_id || '');
//         formData.append('title', recipeForm.value.title);
//         formData.append('description', recipeForm.value.description);
//         formData.append('difficulty', recipeForm.value.difficulty);
//         formData.append('totalTime', recipeForm.value.totalTime);
//         formData.append('servings', recipeForm.value.servings || 1);
        

//         // 2. 封面圖片 (如果是 File 物件才傳送)
//         if (recipeForm.value.coverImg instanceof File) {
//             formData.append('coverImg', recipeForm.value.coverImg);
//         }

//         // 3. 陣列資料 (必須轉成 JSON 字串)
//         formData.append('ingredients', JSON.stringify(recipeForm.value.ingredients));
//         formData.append('steps', JSON.stringify(recipeForm.value.steps));

//         const res = await phpApi.post('recipes/recipe_post.php', formData);
        
//         if (res.data.status === 'success') {
//             alert('食譜儲存成功！');
//             router.push('/admin/recipes');
//         } else {
//             alert('儲存失敗：' + res.data.message);
//         }
//     } catch (err) {
//         console.error(err);
//         alert('發生系統錯誤');
//     }
// };

provide('isEditing', isEditing);
</script>

<template>
  <div :class="['recipe-editor-page', { 'is-editing': isEditing }]">
    <main class="editor-main-layout container">
      <div class="header-section">
        <EditorHeader v-model="recipeForm" :is-editing="isEditing" :is-adapt-mode="isAdaptModeActive" />
      </div>

      <div class="recipe-main-content">
        <div class="row custom-row-fit">
          <aside class="ingredient-sidebar col-5 col-md-12">
            <IngredientEditor v-model:ingredients="recipeForm.ingredients" :is-editing="isEditing" />
          </aside>
          <section class="step-content col-7 col-md-12">
            <StepEditor v-model:steps="recipeForm.steps" :ingredients="recipeForm.ingredients" :is-editing="isEditing" />
          </section>
        </div>
      </div>

      <footer class="editor-footer">
        <div class="footer-center-group">
          <BaseBtn title="預覽" variant="outline" :width="100" @click="handlePreview" class="preview-btn" />
          <BaseBtn title="確認發布" :width="200" @click="handleSave" class="save-btn" />
          
        </div>
      </footer>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/abstracts/_color.scss';

.recipe-editor-page {
  min-height: 100vh;
  padding: 40px 0 80px;
  background-color: $neutral-color-white;
}

.recipe-main-content {
  width: 100%;
  margin-top: 20px;
  border: 1px solid $primary-color-400;
  border-radius: 12px;
  background: $neutral-color-white;
  box-sizing: border-box;
  overflow: hidden;

  .custom-row-fit {
    margin: 0;

    >[class*="col-"] {
      padding: 32px 24px;
    }
  }
}

.editor-footer {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 60px;

  .footer-center-group {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
    max-width: 600px;

    @media screen and (max-width: 1024px) {
      gap: 12px;
      transform: scale(0.9);
    }
  }

  .publish-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    input {
      width: 18px;
      height: 18px;
      accent-color: $primary-color-800;
      cursor: pointer;
    }

    label {
      cursor: pointer;
      color: $neutral-color-700;
    }
  }
}

.preview-btn,
.save-btn {
  height: 48px !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
}

.preview-btn {
  width: 100px !important;
  min-width: 100px !important;
  border: 1px solid $primary-color-400 !important;
  color: $primary-color-400 !important;

  &:hover {
    background-color: $primary-color-100 !important;
  }
}

.save-btn {
  width: 200px !important;
}
</style>