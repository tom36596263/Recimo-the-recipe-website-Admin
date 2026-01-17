import { createRouter, createWebHistory } from 'vue-router';

/**
 * 純後台管理系統路由配置
 * 所有的路徑現在直接掛在根目錄下，或者保留 /admin 前綴。
 * 建議保留一個根路徑 '/' 重定向到 'members'。
 */
const routes = [
  {
    path: '/',
    redirect: '/members' // 進入首頁自動導向會員管理
  },
  {
    path: '/members',
    name: 'AdminMembers',
    component: () => import('@/views/MemberAdmin.vue'),
    meta: { title: '會員管理' }
  },
  {
    path: '/ingredients',
    name: 'AdminIngredients',
    component: () => import('@/views/IngredientAdmin.vue'),
    meta: { title: '食材管理' }
  },
  {
    path: '/recipes',
    meta: { title: '食譜管理' },
    children:[
        {
        path: '', 
        name: 'AdminRecipes',
        component: () => import('@/views/Recipe/RecipeAdmin.vue'),
      },
      
    ]
  },
  {
    path: '/reports',
    name: 'AdminReports',
    component: () => import('@/views/ReportAdmin.vue'),
    meta: { title: '檢舉管理' }
  },
  {
    path: '/products',
    name: 'AdminProducts',
    component: () => import('@/views/ProductAdmin.vue'),
    meta: { title: '商品管理' }
  },
  {
    path: '/orders',
    meta: { title: '訂單管理' },
    children:[
      {
        path: '', // 詳情頁：/orders/1
        name: 'AdminOrders',
        component: () => import('@/views/Order/OrderAdmin.vue'),
      },
      {
        path: ':id', // 詳情頁：/orders/1
        name: 'OrderDetail',
        component: () => import('@/views/Order/OrderDetail.vue'),
        props: true // 將 URL 的 id 直接傳入組件作為 props
      }
    ]
  },
  {
    path: '/notifications',
    name: 'AdminNotifications',
    component: () => import('@/views/NotificationAdmin.vue'),
    meta: { title: '通知管理' }
  },
  {
    path: '/faqs',
    name: 'AdminFaqs',
    component: () => import('@/views/FaqAdmin.vue'),
    meta: { title: '常見問題管理' }
  },
  {
    path: '/plans',
    name: 'AdminPlans',
    component: () => import('@/views/PlansAdmin.vue'),
    meta: { title: '備餐計畫管理' }
  },
  {
    path: '/staff',
    name: 'AdminStaff',
    component: () => import('@/views/StaffAdmin.vue'),
    meta: { title: '後台人員管理' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守衛：動態切換網頁標題
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `Recimo 後台 - ${to.meta.title}`;
  }
  next();
});

export default router;
