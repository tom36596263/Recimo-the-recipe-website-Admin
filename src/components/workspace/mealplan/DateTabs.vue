<script setup>
/**
 * DateTabs.vue (後台模板專用版)
 * 目的：提供橫向滾動的天數頁籤，並允許新增/減少天數。
 */

import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  tabs: {
    type: Array,
    default: () => []
  },
  // 後台模式旗標 (雖然現在主要邏輯都改了，但保留這個 prop 可以兼容舊邏輯)
  isTemplateMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'add-day', 'remove-day']);

// 切換頁籤
const selectTab = (id) => {
  emit('update:modelValue', id);
};

// 增加天數
const handleAddDay = () => {
  emit('add-day');
};

// 減少天數
const handleRemoveDay = () => {
  emit('remove-day');
};

// ------ 滑鼠滾輪轉水平捲動邏輯 ------
const scrollContainer = ref(null);
const onWheel = (e) => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY;
  }
};

// ------ 自動捲動 (Scroll to Active) ------
const scrollToActive = async () => {
  await nextTick();
  if (!scrollContainer.value) return;
  const activeEl = scrollContainer.value.querySelector('.is-active');
  if (activeEl) {
    activeEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
};

watch(() => props.modelValue, scrollToActive, { immediate: true });
</script>

<template>
  <div class="tab-wrapper">
    <div class="date-tabs" ref="scrollContainer" @wheel.prevent="onWheel">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ 'is-active': modelValue === tab.id }"
        @click="selectTab(tab.id)"
      >
        <span class="tab-item__day p-p1">{{ tab.day }}</span>
        <span class="tab-item__date">{{ tab.date }}</span>
      </div>
    </div>

    <div class="actions-area">
      <button class="action-btn add" title="增加一天" @click="handleAddDay">
        <i-material-symbols-add-rounded />
      </button>
      <button
        class="action-btn remove"
        title="減少一天"
        @click="handleRemoveDay"
        :disabled="tabs.length <= 1"
      >
        <i-material-symbols-remove-rounded />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tab-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.date-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex-grow: 1; /* 佔據剩餘空間 */
  margin-right: 10px;

  /* 隱藏捲動軸 */
  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 90px;
  border-radius: 25px;
  background-color: $neutral-color-100;
  color: $neutral-color-400;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &__day {
    margin-bottom: 6px;
    font-size: 0.8rem;
  }

  &__date {
    font-size: 1.1rem;
    font-weight: bold;
    background-color: $neutral-color-white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.is-active {
    background-color: $primary-color-400;
    color: $primary-color-800;
  }

  &:hover {
    background-color: $accent-color-100;
    color: $accent-color-800;
    border: 1px solid $accent-color-800;
  }
}

/* 操作按鈕區 */
.actions-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  background: $neutral-color-100;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $primary-color-800;
  transition: 0.2s;

  &:hover:not(:disabled) {
    background-color: $accent-color-100;
    color: $accent-color-800;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.add svg {
    font-size: 20px;
  }
  &.remove svg {
    font-size: 20px;
  }
}
</style>
