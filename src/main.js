import { createApp } from 'vue'
import { createPinia } from 'pinia' // 引入 Pinia
import ElementPlus from 'element-plus'   // 引入 Element-plus
import 'element-plus/dist/index.css'   // 引入 Element-plus 的 CSS 樣式
import App from './App.vue'
import router from './router' // 引入路由設定
import '@/assets/scss/base/_reset.scss' //引入全域css reset
import '@/assets/scss/main.scss' // 引入全域樣式
import '@fortawesome/fontawesome-free/css/all.css' // 引入fontawesome

const app = createApp(App) // 建立 Vue 應用程式實體
const pinia = createPinia() // 建立 Pinia 全域狀態管理實體

app.use(pinia) // 插件：啟用 Pinia 狀態管理
app.use(router) // 插件：啟用 Vue Router 路由導覽
app.use(ElementPlus)
app.mount('#app') // 將應用程式掛載至 index.html 的 #app 容器，正式啟動渲染
