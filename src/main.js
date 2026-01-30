import { createApp } from 'vue';
import { createPinia } from 'pinia'; // 引入 Pinia
import ElementPlus from 'element-plus'; // 引入 Element-plus
import 'element-plus/dist/index.css'; // 引入 Element-plus 的 CSS 樣式
import App from './App.vue';
import router from './router'; // 引入路由設定
import '@/assets/scss/base/_reset.scss'; //引入全域css reset
import '@/assets/scss/main.scss'; // 引入全域樣式
import '@fortawesome/fontawesome-free/css/all.css'; // 引入fontawesome
import { parsePublicFile } from '@/utils/parseFile'; // 引入路徑處理工具

// 全局組件
import BaseBtn from '@/components/common/BaseBtn.vue';
import BaseTag from '@/components/common/BaseTag.vue';

const app = createApp(App); // 建立 Vue 應用程式實體
const pinia = createPinia(); // 建立 Pinia 全域狀態管理實體

app.use(pinia); // 插件：啟用 Pinia 狀態管理
app.use(router); // 插件：啟用 Vue Router 路由導覽
app.use(ElementPlus);

// 註冊全局組件
app.component('BaseBtn', BaseBtn);
app.component('BaseTag', BaseTag);

app.config.globalProperties.$parsePublicFile = parsePublicFile; // 已改用 $parseFile，不再註冊 $parsePublicFile
// app.config.globalProperties.$parseFile = parseFile; //註冊全域屬性，在 Template 裡可以使用 $parseFile
app.mount('#app'); // 將應用程式掛載至 index.html 的 #app 容器，正式啟動渲染
