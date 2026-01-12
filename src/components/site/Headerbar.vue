<script setup>
import { ref, computed, onMounted } from 'vue';

</script>

<template>
  <div class="headerbar">
    <h3 class="zh-h3">主要管理員</h3>
    <div style="width: 80px">
        <button class="btn h-40 btn-solid">登出</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
    .headerbar{
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: end;
        gap: 30px;
        padding-right: 20px;
    }

</style>