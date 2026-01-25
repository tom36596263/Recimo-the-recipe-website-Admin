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
// 建議把父路徑定義出來，方便拼接
const ADMIN_BASE = '/admin';

const adminMenuItems = computed(() => {
  // 取得父層路由物件（假設是陣列中的第 2 個）
  const adminRoute = router.options.routes.find(r => r.path === '/admin');
  
  if (!adminRoute || !adminRoute.children) return [];

  return adminRoute.children
    .filter((r) => r.meta && r.meta.title)
    .map(r => ({
      ...r,
      // 關鍵點：拼接出完整的路徑
      fullPath: `${ADMIN_BASE}/${r.path}`.replace(/\/+/g, '/') // 避免出現 // 的情況
    }));
});


// const adminMenuItems = computed(() => {
//   return router.options.routes[1].children.filter(
//     (r) => r.meta && r.meta.title && r.path !== '/'
//   );
// });

/**
 * 判斷是否選中
 */
// const isActive = (fullPath) => {
//   // 使用 startsWith 是因為有些頁面可能有子分頁（如 /admin/orders/1）
//   // 這樣父選單才能保持高亮
//   return route.path.startsWith(fullPath);
// };



/**
 * 判斷是否為目前選中的頁面
 * 扁平化後，路徑直接對比即可
 */
// const isActive = (path) => {
//   return route.path === path;
// };
</script>

<template>
    <div class="admin-sidebar">
        <div class="admin-sidebar__title">
            <h2 class="zh-h3-bold">後台管理系統</h2>
        </div>
        <nav class="admin-sidebar__nav">
        <router-link
            v-for="item in adminMenuItems"
            :key="item.path"
            :to="item.fullPath"
            class="admin-sidebar__link p-p1"
            active-class="admin-sidebar__link--active"
        >
            {{ item.meta.title }}
        </router-link>
        </nav>
        <div class="admin-sidebar__logo">
            <img src="@/assets/images/Recimo-logo-black.svg" alt="">
        </div>
    </div>
    
</template>

<style scoped>

</style>