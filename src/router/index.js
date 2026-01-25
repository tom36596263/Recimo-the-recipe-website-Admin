import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ElMessage } from 'element-plus';
/**
 * 純後台管理系統路由配置
 * 所有的路徑現在直接掛在根目錄下，或者保留 /admin 前綴。
 * 建議保留一個根路徑 '/' 重定向到 'members'。
 */
const routes = [
  // 1. 根路徑重定向 (確保只在剛進網站時觸發)
  {
    path: '/',
    name: 'Root',
    redirect: '/login'
  },

  // 2. 登入頁面：必須放在 AdminLayout 的「外面」
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },

  // 3. 後台管理主體
  {
    path: '/admin',
    component: AdminLayout,
    // 注意：這裡的 redirect 只會在你訪問 "http://.../admin" 時觸發
    redirect: '/admin/members',
    meta: { requiresAuth: true }, //進入 /admin 及其子路由都需要登入
    children: [
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
        children: [
          {
            path: '',
            name: 'AdminRecipes',
            component: () => import('@/views/Recipe/RecipeAdmin.vue')
          },
          {
            path: 'ingredient',
            name: 'RecipesIngredient',
            component: () => import('@/views/Recipe/RecipeIncrease.vue')
          },
          {
            path: ':id',
            name: 'RecipesDetail',
            component: () => import('@/views/Recipe/RecipeDetail.vue'),
            props: true // 將 URL 的 id 直接傳入組件作為 props
          }
        ]
      },

      //-----------------------檢舉管理---------------
      {
        path: 'reports',
        meta: { title: '檢舉管理' },
        children: [
          {
            path: '',
            name: 'AdminReports',
            component: () => import('@/views/Report/ReportAdmin.vue')
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
          }
        ]
      },

      //-----------------------商品管理---------------
      {
        path: 'products',
        meta: { title: '商品管理' },
        children: [
          {
            path: '',
            name: 'AdminProducts',
            component: () => import('@/views/Product/ProductAdmin.vue')
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
        children: [
          {
            path: '', // 詳情頁：/orders/1
            name: 'AdminOrders',
            component: () => import('@/views/Order/OrderAdmin.vue')
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
        children: [
          {
            path: '', // 詳情頁：/notifications/1
            name: 'AdminNotifications',
            component: () =>
              import('@/views/Notification/NotificationAdmin.vue')
          },
          {
            path: ':id', // 詳情頁：/notifications/1
            name: 'NotificationDetail',
            component: () =>
              import('@/views/Notification/NotificationDetail.vue'),
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
        children: [
          {
            path: '',
            name: 'AdminFaqs',
            component: () => import('@/views/Faq/FaqAdmin.vue')
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
        children: [
          {
            path: '', // 詳情頁：/plans/1
            name: 'AdminPlans',
            component: () => import('@/views/Plan/PlansAdmin.vue')
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
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// // 全域路由守衛：動態切換網頁標題
// router.beforeEach((to, from, next) => {
//   // 1. 檢查目標路由是否需要登入驗證
//   const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

//   // 2. 從 localStorage 檢查是否有登入資訊
//   const isLoggedIn = !!localStorage.getItem('admin_user');

//   if (requiresAuth && !isLoggedIn) {
//     // 情況 A: 需要登入但沒登入 -> 強制導向登入頁
//     next('/login');
//   } else if (to.path === '/login' && isLoggedIn) {
//     // 情況 B: 已經登入了卻還想去登入頁 -> 自動導向後台首頁
//     next('/admin/members');
//   } else {
//     // 情況 C: 正常通行
//     next();
//   }
// });

// // 全域路由守衛
// router.beforeEach(async ((to, from, next) => {
//   // 1. 取得原始字串
//   const userDataStr = localStorage.getItem('admin_user');

//   // 2. 預先定義變數
//   let user = null;
//   if (userDataStr) {
//     try {
//       user = JSON.parse(userDataStr);
//     } catch (e) {
//       console.error('解析登入資料出錯');
//     }
//   }

//   // 3. 【最優先檢查】：如果已經登入，但等級是 0
//   if (user && user.level == 0) {
//     localStorage.removeItem('admin_user'); // 強制清除
//     alert('您的帳號已被停權或無權限進入，請聯絡主要管理員');
//     return next('/login'); // 直接踢回登入頁，並結束這一次守衛
//   }

//   // 4. 檢查目標路由是否需要登入驗證
//   const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
//   const isLoggedIn = !!user;

//   if (requiresAuth && !isLoggedIn) {
//     // 情況 A: 需要登入但沒登入 -> 強制導向登入頁
//     next('/login');
//   } else if (to.path === '/login' && isLoggedIn) {
//     // 情況 B: 已經登入了卻還想去登入頁 -> 自動導向後台首頁
//     next('/admin/members');
//   } else {
//     // 情況 C: 正常通行
//     next();
//   }

// });

// 全域路由守衛
router.beforeEach(async (to, from, next) => {
  // 1. 取得 localStorage 資料
  const userDataStr = localStorage.getItem('admin_user');
  let user = null;
  if (userDataStr) {
    try {
      user = JSON.parse(userDataStr);
    } catch (e) {
      console.error('解析登入資料出錯');
    }
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isLoggedIn = !!user;

  // 2. 如果是需要登入的頁面，且目前是登入狀態
  if (requiresAuth && isLoggedIn) {
    try {
      // 即時權限檢查
      const response = await fetch('/data/others/admins.json?t=' + Date.now());
      const adminData = await response.json();

      // 在 JSON 裡找出目前登入的這名管理員
      const latestInfo = adminData.find(
        (u) => u.admin_account === user.account
      );

      // 偵錯用：看看現在抓到的 latestInfo 等級到底是多少
      console.log('當前權限狀態：', latestInfo?.admin_level);

      // 如果找不到這個人，或是他的等級變成了 0
      if (!latestInfo || latestInfo.admin_level == 0) {
        localStorage.removeItem('admin_user');
        ElMessage('您的帳號已被停權或無權限進入，請聯絡主要管理員');
        return next('/login');
      }
      // ---------------------------------
    } catch (error) {
      console.error('即時權限檢查失敗', error);
    }
  }

  if (requiresAuth && !isLoggedIn) {
    // 需要登入但沒登入 -> 強制導向登入頁
    next('/login');
  } else if (to.path === '/login' && isLoggedIn) {
    // 已經登入了卻還想去登入頁 -> 自動導向後台首頁
    next('/admin/members');
  } else {
    // 正常通行
    next();
  }
});

export default router;
