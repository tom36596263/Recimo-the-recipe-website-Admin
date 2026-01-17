<script setup>
// 1. 只保留後台 Layout，刪除 Default 與 Workspace
import AdminLayout from '@/layouts/AdminLayout.vue';
</script>

<template>
  <!-- <AdminLayout> -->
    <router-view />
  <!-- </AdminLayout> -->
</template>

<style lang="scss">
/* 這裡放後台共用的基礎 CSS，例如重置 body 背景色 */
body {
  margin: 0;
  background-color: #f9f9f9;
}
</style>
