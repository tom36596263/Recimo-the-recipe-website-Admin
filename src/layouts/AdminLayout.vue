<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Sidebar from '@/components/site/Sidebar.vue'
import { Header } from 'element-plus/es/components/table-v2/src/components/index.mjs';
import Headerbar from '@/components/site/Headerbar.vue';

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
  <div class="common-layout admin">
    <el-container>
      <el-aside width="0px">
        <Sidebar/>
      </el-aside>
      <el-container>
        <el-header height="75px">
          <Headerbar/>
        </el-header>
        <el-main class="main-container">
          <main class="page-content">
            <router-view />
          </main>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
/* 建議確保 admin-layout.scss 內有 .admin { display: flex; } */
@import '@/assets/scss/layouts/admin-layout';
.el-header{
  border-bottom: 1px $neutral-color-100 solid;
  position: fixed;
  width: 100vw;
  top: 0;
  left: 0;
  background-color: $neutral-color-white;
  z-index: 100;
}
</style>
