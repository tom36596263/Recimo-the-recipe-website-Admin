import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue'
/**
 * 純後台管理系統路由配置
 * 所有的路徑現在直接掛在根目錄下，或者保留 /admin 前綴。
 * 建議保留一個根路徑 '/' 重定向到 'members'。
 */
const routes = [
  {
    path: '/',
    redirect: '/admin/members' // 進入首頁自動導向會員管理
  },
  {
    path: '/admin',
    component: AdminLayout,
    children:[
      {
        path: '',
        // name: 'Admin',
        redirect: '/admin/members' // 進入首頁自動導向會員管理
      },



//-----------------------會員管理---------------
      {
        path: 'members',
        name: 'AdminMembers',
        component: () => import('@/views/MemberAdmin.vue'),
        meta: { title: '會員管理' }
      },



//-----------------------食材管理---------------
      {
        path: 'ingredients',
        name: 'AdminIngredients',
        component: () => import('@/views/IngredientAdmin.vue'),
        meta: { title: '食材管理' }
      },


//-----------------------食譜管理---------------
      {
        path: 'recipes',
        meta: { title: '食譜管理' },
        children:[
          {
            path: '', 
            name: 'AdminRecipes',
            component: () => import('@/views/Recipe/RecipeAdmin.vue'),
          },
          {
            path: 'ingredient', 
            name: 'RecipesIngredient',
            component: () => import('@/views/Recipe/RecipeIncrease.vue'),
          },
          {
            path: ':id', 
            name: 'RecipesDetail',
            component: () => import('@/views/Recipe/RecipeDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          
        ]
      },


//-----------------------檢舉管理---------------
      {
        path: 'reports',
        meta: { title: '檢舉管理' },
        children:[
          {
            path: '', 
            name: 'AdminReports',
            component: () => import('@/views/Report/ReportAdmin.vue'),
          },
          {
            path: 'message/:id', 
            name: 'MessageReports',
            component: () => import('@/views/Report/MessageReports.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          {
            path: 'image/:id', 
            name: 'ImageReports',
            component: () => import('@/views/Report/ImageReports.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          {
            path: 'recipe/:id', 
            name: 'RecipeReports',
            component: () => import('@/views/Report/RecipeReports.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
        ]
      },



//-----------------------商品管理---------------
      {
        path: 'products',
        meta: { title: '商品管理' },
        children:[
          {
            path: '', 
            name: 'AdminProducts',
            component: () => import('@/views/Product/ProductAdmin.vue'),
          },
          {
            path: 'add', 
            name: 'ProductAdd',
            component: () => import('@/views/Product/ProductAdd.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          {
            path: ':id', 
            name: 'ProductDetail',
            component: () => import('@/views/Product/ProductDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          }
        ]
      },



//-----------------------訂單管理---------------
      {
        path: 'orders',
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


//-----------------------通知管理---------------
      {
        path: 'notifications',
        meta: { title: '通知管理' },
        children:[
          {
            path: '', // 詳情頁：/notifications/1
            name: 'AdminNotifications',
            component: () => import('@/views/Notification/NotificationAdmin.vue'),
          },
          {
            path: ':id', // 詳情頁：/notifications/1
            name: 'NotificationDetail',
            component: () => import('@/views/Notification/NotificationDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          {
            path: 'add', // 詳情頁：/notifications/1
            name: 'NotificationAdd',
            component: () => import('@/views/Notification/NotificationAdd.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          }
        ]
      },



//-----------------------常見問題管理---------------
      {
        path: 'faqs',
        meta: { title: '常見問題管理' },
        children:[
          { 
            path: '', 
            name: 'AdminFaqs',
            component: () => import('@/views/Faq/FaqAdmin.vue'),
          },
          { 
            path: 'add', 
            name: 'FaqsAdd',
            component: () => import('@/views/Faq/FaqAdd.vue'),
            props: true 
          },
          {
            path: ':id', 
            name: 'FaqDetail',
            component: () => import('@/views/Faq/FaqDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          }
        ]
      },



//-----------------------備餐計畫管理---------------
      {
        path: 'plans',
        meta: { title: '備餐計畫管理' },
        children:[
          {
            path: '', // 詳情頁：/plans/1
            name: 'AdminPlans',
            component: () => import('@/views/Plan/PlansAdmin.vue'),
          },
          {
            path: 'add', // 詳情頁：/plans/1
            name: 'PlansAdd',
            component: () => import('@/views/Plan/PlansAdd.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          },
          {
            path: ':id', // 詳情頁：/plans/1
            name: 'PlansDetail',
            component: () => import('@/views/Plan/PlansDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          }
        ]
      },



//-----------------------後台人員管理---------------
      {
        path: 'staff',
        name: 'AdminStaff',
        component: () => import('@/views/StaffAdmin.vue'),
        meta: { title: '後台人員管理' }
      }
        ]
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
