<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

/**
 * 修正後的選單邏輯：
 * 由於路由已扁平化，我們直接篩選出所有具有 meta.title 的路由。
 * 同時排除掉重定向 (redirect) 的根路徑。
 */
const adminMenuItems = computed(() => {
  return router.options.routes.filter(
    (r) => r.meta && r.meta.title && r.path !== '/'
  );
});

/**
 * 判斷是否為目前選中的頁面
 * 扁平化後，路徑直接對比即可
 */
const isActive = (path) => {
  return route.path === path;
};
</script>

<template>
  <div class="admin">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__logo">
        <h2>Recimo 後台</h2>
      </div>
      <nav class="admin-sidebar__nav">
        <router-link
          v-for="item in adminMenuItems"
          :key="item.path"
          :to="item.path"
          class="admin-sidebar__link"
          :class="{ 'admin-sidebar__link--active': isActive(item.path) }"
        >
          {{ item.meta.title }}
        </router-link>
      </nav>
    </aside>

    <div class="main-container">
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 建議確保 admin-layout.scss 內有 .admin { display: flex; } */
@import '@/assets/scss/layouts/admin-layout';
</style>
