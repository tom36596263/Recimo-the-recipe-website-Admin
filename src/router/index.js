import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ElMessage } from 'element-plus';
import { phpApi } from '@/utils/publicApi.js';
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
            path: 'increase',
            name: 'RecipesIncrease',
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

// 全域路由守衛
router.beforeEach(async (to, from, next) => {
  router.afterEach((to) => {
    const baseTitle = 'Recimo 後台管理系統'; // 你的系統預設名稱
    const pageTitle = to.meta.title;

    if (pageTitle) {
      document.title = `${pageTitle} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  });

  // 1. 取得 localStorage 資料
  const userDataStr = localStorage.getItem('admin_user');
  let user = null;
  if (userDataStr) {
    try {
      user = JSON.parse(userDataStr);
    } catch (e) {
      // console.error('解析登入資料出錯');
    }
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isLoggedIn = !!user;

  // 2. 如果是需要登入的頁面，且目前是登入狀態
  if (requiresAuth && isLoggedIn) {
    try {
      // 改用 phpApi 取得管理員資料
      const { data } = await phpApi.get('others/admin_get.php?t=' + Date.now());
      const adminData = Array.isArray(data) ? data : data?.data || [];
      const latestInfo = adminData.find(
        (u) => String(u.admin_account) === String(user.account)
      );
      const level = latestInfo ? Number(latestInfo.admin_level) : undefined;
      // console.log('當前權限狀態：', level);
      // 將抓到的最新等級存起來，方便全站組件（如彈窗）使用
      if (level !== undefined) {
        localStorage.setItem('admin_level', level);
      }
      // 主要管理員頁面權限判斷
      if (to.name === 'AdminStaff' && level !== 2) {
        ElMessage('只有主要管理員可進入後台人員管理');
        return next('/admin/members');
      }
      if (!latestInfo || isNaN(level) || level === 0) {
        localStorage.removeItem('admin_user');
        ElMessage('您的帳號已被停權或無權限進入，請聯絡主要管理員');
        return next('/login');
      }
    } catch (error) {
      // console.error('即時權限檢查失敗', error);
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
