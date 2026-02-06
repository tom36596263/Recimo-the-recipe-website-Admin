<script setup>
import { computed, watch } from 'vue';
import AdaptRecipeCard from '@/components/workspace/modifyrecipe/AdaptRecipeCard.vue';
import { useRouter, useRoute } from 'vue-router';
import TagModal from '@/components/workspace/editrecipe/modals/TagModal.vue';
import { ref } from 'vue'; // 確保有匯入 ref

const router = useRouter();
const route = useRoute();

const props = defineProps({
  modelValue: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
  isAdaptMode: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'open-tag-modal']);

// 跳轉邏輯
const goToOriginal = () => {
  const targetId =
    props.modelValue.parent_recipe_id || props.modelValue.recipe_id;
  if (targetId) {
    router.push(`/workspace/recipe-detail/${targetId}`);
  } else {
    alert('找不到原始食譜編號');
  }
};

const updateField = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const setDifficulty = (val) => {
  if (props.isEditing) updateField('difficulty', val);
};

// 自動計算步驟總時間
const autoTotalTime = computed(() => {
  if (!props.modelValue.steps) return 0;
  return props.modelValue.steps.reduce(
    (sum, step) => sum + (Number(step.time) || 0),
    0
  );
});

const displayTime = computed(() => {
  const manualTime = Number(props.modelValue.totalTime);
  return manualTime > 0 ? manualTime : autoTotalTime.value;
});

// EditorHeader.vue 內的 adaptRecipeData
const adaptRecipeData = computed(() => {
  return {
    ...props.modelValue,
    title: props.modelValue.adapt_title || '',
    description: props.modelValue.adapt_description || '',
    recipe_id: props.modelValue.parent_recipe_id || props.modelValue.recipe_id,
    coverImg: props.modelValue.coverImg
  };
});

watch(
  () => props.modelValue.steps,
  (newSteps) => {
    const newSum =
      newSteps?.reduce((sum, s) => sum + (Number(s.time) || 0), 0) || 0;
    if (!props.modelValue.totalTime || props.modelValue.totalTime == 0) {
      updateField('totalTime', newSum);
    }
  },
  { deep: true }
);

const handleCoverUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  emit('update:modelValue', { ...props.modelValue, coverImg: file });
  const reader = new FileReader();
  reader.onload = (evt) => updateField('coverImg', evt.target.result);
  reader.readAsDataURL(file);
};

// 2. 控制燈箱顯示的狀態
const isTagModalOpen = ref(false);

// 3. 實作標籤操作邏輯
const removeTag = (tagId) => {
  const newTags = props.modelValue.tags.filter((t) => t.tag_id !== tagId);
  updateField('tags', newTags);
};

const handleTagsSelected = (newSelectedTags) => {
  // 取得原本已有的標籤
  const currentTags = props.modelValue.tags || [];
  // 合併舊標籤與新選的標籤
  const updatedTags = [...currentTags, ...newSelectedTags];

  updateField('tags', updatedTags);
  isTagModalOpen.value = false; // 關閉燈箱
};
</script>

<template>
  <section class="recipe-card-container">
    <input
      ref="fileInput"
      type="file"
      class="hidden-input"
      accept="image/*"
      @change="handleCoverUpload"
    />

    <template v-if="isAdaptMode">
      <div class="adapt-card-section">
        <div
          class="adapt-card-wrapper"
          @click="isEditing && $refs.fileInput.click()"
          :style="{ cursor: isEditing ? 'pointer' : 'default' }"
        >
          <AdaptRecipeCard :recipe="adaptRecipeData" />
        </div>
        <BaseBtn
          title="查看原始食譜詳情"
          variant="outline"
          :width="320"
          @click="goToOriginal"
          class="back-original-btn"
        />
      </div>
    </template>

    <template v-else>
      <div
        class="cover-section"
        :class="{ 'has-image': modelValue.coverImg }"
        :style="{
          backgroundImage: modelValue.coverImg
            ? `url(${modelValue.coverImg})`
            : ''
        }"
        @click="isEditing && $refs.fileInput.click()"
      >
        <div v-if="!modelValue.coverImg" class="upload-placeholder">
          <div class="placeholder-content">
            <span class="plus-icon">+</span>
            <p class="label p-p2">新增成品照</p>
          </div>
        </div>
        <div v-if="modelValue.coverImg && isEditing" class="change-hint">
          <span class="p-p2">更換成品照</span>
        </div>
      </div>
    </template>

    <div class="info-section">
      <div class="row-title">
        <template v-if="isAdaptMode">
          <div class="title-with-tag">
            <h2 class="title-display zh-h2-bold">
              {{
                modelValue.original_title || modelValue.title || '未命名食譜'
              }}
            </h2>
            <span class="adapt-tag p-p3">改編自此食譜</span>
          </div>
        </template>
        <template v-else>
          <input
            v-if="isEditing"
            :value="modelValue.title"
            @input="updateField('title', $event.target.value)"
            class="title-input zh-h3"
            placeholder="請輸入標題..."
            maxlength="30"
          />
          <h2 v-else class="title-display zh-h2-bold">
            {{ modelValue.title || '未命名食譜' }}
          </h2>
        </template>
      </div>

      <div v-if="isAdaptMode && isEditing" class="row-adapt-inputs">
        <div class="input-container full-width">
          <input
            :value="modelValue.adapt_title"
            @input="updateField('adapt_title', $event.target.value)"
            class="form-input p-p1"
            :class="{ 'is-success': modelValue.adapt_title }"
            placeholder="請輸入改編版本標題 (例：低脂版)"
          />
        </div>
        <div class="input-container full-width">
          <input
            :value="modelValue.adapt_description"
            @input="updateField('adapt_description', $event.target.value)"
            class="form-input p-p1"
            :class="{ 'is-success': modelValue.adapt_description }"
            placeholder="說明改編了什麼？"
          />
        </div>
      </div>

      <div class="row-meta p-p2">
        <div class="meta-item">
          <span class="label">製作時間：</span>
          <template v-if="isEditing">
            <input
              type="number"
              class="inline-input"
              :value="modelValue.totalTime"
              @input="updateField('totalTime', $event.target.value)"
              :placeholder="autoTotalTime"
            />
            <span class="unit">分鐘</span>
          </template>
          <span v-else class="value">{{ displayTime }} 分鐘</span>
        </div>

        <div class="meta-item">
          <span class="label">難易度：</span>
          <div class="stars-group" :class="{ 'is-editing': isEditing }">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ active: n <= modelValue.difficulty }"
              @click="setDifficulty(n)"
            >
              {{ n <= modelValue.difficulty ? '★' : '☆' }}
            </span>
          </div>
        </div>
        <div class="meta-item">
          <span class="label">份量：</span>
          <template v-if="isEditing">
            <input
              type="number"
              class="inline-input servings-input"
              :value="modelValue.servings"
              @input="updateField('servings', Number($event.target.value))"
              placeholder="2"
              min="1"
              max="20"
            />
            <span class="unit">人份</span>
          </template>
          <span v-else class="value">{{ modelValue.servings || 0 }} 人份</span>
        </div>
      </div>
      <div class="row-tags">
          <div class="tags-wrapper">
            <div
              class="tag-item"
              v-for="tag in modelValue.tags"
              :key="tag.tag_id"
            >
              <span class="tag-text p-p3"># {{ tag.tag_name }}</span>
              <button
                v-if="isEditing"
                class="tag-delete-btn"
                @click="removeTag(tag.tag_id)"
              >
                <span>×</span>
              </button>
            </div>
            <button
              v-if="isEditing"
              class="add-tag-btn p-p3"
              @click="isTagModalOpen = true"
            >
              <i class="bi bi-plus-lg"></i>
              <span>新增標籤</span>
            </button>
            <span
              v-if="
                !isEditing && (!modelValue.tags || modelValue.tags.length === 0)
              "
              class="no-tag-hint p-p3"
            >
              尚未設定標籤
            </span>
          </div>
        </div>
        <div
          class="row-description"
          :class="{ 'editing-border': isEditing, 'is-adapt': isAdaptMode }"
        >
          <textarea
            v-if="isEditing"
            :value="modelValue.description"
            @input="updateField('description', $event.target.value)"
            class="desc-textarea p-p2"
            placeholder="請輸入說明..."
            maxlength="200"
          ></textarea>
          <p v-else class="desc-display p-p2">
            {{ modelValue.description || '暫無簡介' }}
          </p>
      </div>
    </div>
    <TagModal
      v-model="isTagModalOpen"
      :selected-list="modelValue.tags || []"
      @add-multiple="handleTagsSelected"
    />
  </section>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/abstracts/_color.scss';
.row-tags {
  padding: 0 16px;
  margin: 4px 0 8px 0;
  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .tag-item {
    display: flex;
    align-items: center;
    background-color: $primary-color-100;
    color: $primary-color-800;
    padding: 4px 10px;
    border-radius: 100px;

    .tag-delete-btn {
      appearance: none;
      background: transparent !important;
      border: none;
      padding: 0;
      margin: 0 0 0 6px;
      outline: none;
      box-shadow: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: #ff8e8e;
      cursor: pointer;
      font-size: 18px;
      font-weight: 200;
      line-height: 1;
      transition:
        color 0.2s,
        transform 0.2s;

      &:hover {
        color: red;
        background: transparent !important;
      }

      &:active {
        transform: scale(0.9);
      }
    }
  }
}
.add-tag-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: $primary-color-700;
  border: 1px dashed $primary-color-400;
  padding: 4px 12px;
  border-radius: 100px;
  cursor: pointer;

  &:hover {
    background: $primary-color-100;
  }
}

.no-tag-hint {
  color: $neutral-color-400;
  font-style: italic;
}

.adapt-card-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 100%; // 手機版撐滿

  @media (min-width: 768px) {
    width: 320px; // 電腦版維持寬度
  }
}

.back-original-btn {
  width: 100%; // 手機版預設寬度
  margin-top: 16px; // 手機版間距小一點

  @media (min-width: 768px) {
    width: 320px;
    margin-top: 60px; // 桌機版恢復 60px 間距
  }
}

.recipe-card-container {
  display: flex;
  flex-direction: column;
  background: $neutral-color-white;
  border: 1px solid $primary-color-400;
  border-radius: 12px;
  padding: 24px;
  gap: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.title-with-tag {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;

  .adapt-tag {
    background: $primary-color-100;
    color: $primary-color-700;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid $primary-color-100;
    white-space: nowrap;
  }
}

.hidden-input {
  display: none;
}

.row-adapt-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background-color: $neutral-color-100;
  border-radius: 12px;
  border: 1px solid $neutral-color-100;

  .input-container.full-width {
    width: 100%;

    .form-input {
      width: 100%;
      border-color: $neutral-color-400;
    }
  }
}

.form-input {
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid $neutral-color-400;
  outline: none;
  transition: all 0.2s;
  background-color: $neutral-color-white;

  &.is-success {
    border-color: $primary-color-400;
  }

  &:focus {
    border-color: $primary-color-700;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.adapt-card-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;

  &.readonly-overlay {
    pointer-events: auto;
    user-select: none;
    cursor: default;
  }
}

.cover-section {
  position: relative;
  border: 2px dashed $neutral-color-400;
  width: 100%;
  height: 220px;
  background: $neutral-color-100;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.has-image {
    border-style: solid;
  }

  .upload-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: $neutral-color-400;

      .plus-icon {
        font-size: 48px;
        line-height: 1;
        margin-bottom: 4px;
        display: block;
      }

      .label {
        margin: 0;
      }
    }
  }

  .change-hint {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    color: $neutral-color-white;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 6px;
  }

  &:hover .change-hint {
    opacity: 1;
  }

  @media (min-width: 768px) {
    width: 320px;
  }
}

.row-title .title-input {
  width: 100%;
  border: none;
  outline: none;
  border-bottom: 1px solid $neutral-color-100;
  background: transparent;
}

.row-title .title-display {
  color: $primary-color-800;
  margin: 0;
}

.row-meta {
  display: flex;
  gap: 30px;
  align-items: center;
  color: $neutral-color-800;
  padding: 0 16px;
  margin-top: 4px;

  .inline-input {
    border: none;
    border-bottom: 1px solid $neutral-color-400;
    width: 60px;
    text-align: center;
    outline: none;
  }

  .stars-group {
    display: flex;
    gap: 4px;

    .star {
      font-size: 20px;
      color: $neutral-color-400;
    }

    &.is-editing .star {
      cursor: pointer;
    }

    .star.active {
      color: $secondary-color-warning-700;
    }
  }
}

.row-description {
  position: relative;
  min-height: 100px;
  padding: 12px;
  background: $neutral-color-100;
  border-radius: 10px;

  &.editing-border {
    border: 1px dashed $primary-color-700;
    background: $neutral-color-white;
  }

  &.is-adapt {
    min-height: 140px;

    .desc-textarea {
      height: 110px;
    }
  }

  .desc-textarea {
    width: 100%;
    height: 70px;
    border: none;
    resize: none;
    outline: none;
    background: transparent;
  }
}

.row-meta {
  display: flex;
  flex-wrap: wrap; // 讓欄位多時能自動換行
  gap: 24px;
  align-items: center;
  color: $neutral-color-800;
  padding: 0 16px;
  margin-top: 4px;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .inline-input {
    border: none;
    border-bottom: 1px solid $neutral-color-400;
    width: 50px; // 時間預設寬度
    text-align: center;
    outline: none;
    background: transparent;

    // ✨ 份量專用寬度微調
    &.servings-input {
      width: 40px;
    }
  }
  
  .value {
    color: $primary-color-800;
    font-weight: 500;
  }

  // ...星星相關樣式保持不變...
}
</style>


