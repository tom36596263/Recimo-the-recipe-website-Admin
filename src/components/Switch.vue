<template>
  <div class="switch-wrapper">
    <div 
      class="custom-switch" 
      :class="{ 'is-active': modelValue }" 
      @click="toggle"
    >
      <span class="status-label">
        {{ modelValue ? '啟用' : '停用' }}
      </span>
      
      <div class="switch-dot"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
  // 觸發事件更新狀態
  emit('update:modelValue', !props.modelValue);
};
</script>

<style scoped>
.switch-wrapper {
  display: inline-block;
  vertical-align: middle;
}

.custom-switch {
  /* 嚴格按照圖片尺寸 70x24 */
  width: 70px;
  height: 24px;
  background-color: #939393; /* 停用時的灰色 */
  border-radius: 100px; /* 膠囊形狀 */
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 流暢的過渡曲線 */
  user-select: none;
  overflow: hidden;
}

/* 啟用時的背景色變化 */
.custom-switch.is-active {
  background-color: #438b5e; /* 圖片中的綠色 */
}

/* 點擊時的輕微縮放回饋感 */
.custom-switch:active {
  transform: scale(0.96);
}

/* 文字樣式與過渡 */
.status-label {
  color: white;
  font-size: 12px;
  font-weight: 500;
  position: absolute;
  width: 100%;
  text-align: center;
  transition: all 0.3s ease;
  /* 根據狀態微調文字位置，避免被圓點擋住 */
  padding-left: v-bind('modelValue ? "0px" : "18px"');
  padding-right: v-bind('modelValue ? "18px" : "0px"');
}

/* 白色圓點樣式 */
.switch-dot {
  width: 18px;
  height: 18px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  left: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  /* 讓移動有平滑感 */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 啟用時，圓點向右滑動 */
/* 計算方式：總寬70 - 圓點18 - 左邊距3 - 右邊距3 = 46px */
.custom-switch.is-active .switch-dot {
  transform: translateX(46px);
}

/* 懸停時加亮（可選，增加互動感） */
.custom-switch:hover {
  filter: brightness(1.05);
}
</style>