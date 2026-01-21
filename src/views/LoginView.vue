<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Right } from '@element-plus/icons-vue'

// 初始化
const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

// 表單資料模型
const loginForm = reactive({
    username: '',
    password: ''
})

// 驗證規則
const rules = reactive({
    username: [
        { required: true, message: '請輸入管理員帳號', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '請輸入管理員密碼', trigger: 'blur' },
    ]
})

/**
 * 處理登入邏輯
 */
const handleLogin = async (formEl) => {
    if (!formEl) return

    await formEl.validate((valid) => {
        if (valid) {
            loading.value = true

            // 模擬 API 請求
            setTimeout(() => {
                // --- 設定假帳號密碼 ---
                const dummyUser = 'admin'
                const dummyPass = '123456'

                if (loginForm.username === dummyUser && loginForm.password === dummyPass) {
                    // 登入成功
                    ElMessage({
                        message: '登入成功，正在導向管理後台...',
                        type: 'success',
                        duration: 1500
                    })

                    loading.value = false
                    router.push('/admin/members')
                } else {
                    // 登入失敗
                    loading.value = false
                    ElMessage.error('帳號或密碼錯誤，請再試一次')
                }
            }, 1000)

        } else {
            ElMessage.warning('請填寫正確的登入資訊')
        }
    })
}
</script>
<template>
    <div class="login-wrapper">
        <div class="login-card">
            <!-- 左邊書本 -->
            <div class="login-hero">
                <div class="hero-content">
                    <img src="/src/assets/images/Recimo-logo-black.svg" alt="recimo-logo">
                </div>
            </div>

            <!-- 右邊登入 -->
            <div class="login-form-area">
                <div class="form-wrapper">
                    <h2 class="form-title">管理員登入</h2>

                    <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-position="top"
                        @keyup.enter="handleLogin(loginFormRef)">
                        <el-form-item label="帳號" prop="username">
                            <el-input v-model="loginForm.username" placeholder="請輸入管理員帳號" clearable />
                        </el-form-item>

                        <el-form-item label="密碼" prop="password">
                            <el-input v-model="loginForm.password" type="password" placeholder="請輸入管理員密碼"
                                show-password />
                        </el-form-item>

                        <el-button type="primary" class="login-submit" :loading="loading"
                            @click="handleLogin(loginFormRef)">
                            {{ loading ? '登入中...' : '登入' }}
                        </el-button>
                    </el-form>
                </div>
            </div>
        </div>
    </div>

</template>


<style lang="scss" scoped>
//中性色
$neutral-color-black: #000;
$neutral-color-800: #555555;
$neutral-color-700: #868686;
$neutral-color-400: #ABABAB;
$neutral-color-100: #F5F5F5;
$neutral-color-white: #fff;

// 網站主色
$primary-color-800: #2E6F4A;
$primary-color-700: #3E8D60;
$primary-color-400: #74D09C;
$primary-color-100: #F1F6EF;

//強調色
$accent-color-800: #ED8A00;
$accent-color-700: #FFA527;
$accent-color-400: #FFCB82;
$accent-color-100: #FFF1DE;

.login-wrapper {
    background-color: $accent-color-100;
    display: flex;
    align-items: center; // 垂直置中
    justify-content: center; // 水平置中
    min-height: 100vh; // 關鍵：確保容器跟螢幕一樣高
    width: 100%;
}

.login-card {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $neutral-color-white;
    border: 13px solid $primary-color-700; // 模擬圖片外框
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.login-hero {
    background-image: url(/src/assets/images/bg.png);
    background-size: cover;
    background-position: center;
    width: 410px;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-right: 1px solid $neutral-color-100;
}

.hero-content img {
    width: 200px;
}

.login-form-area {
    width: 410px;
    min-height: 500px;
    padding: 60px;
    background-color: $neutral-color-white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;

    .form-title {
        font-size: 28px;
        text-align: center;
        letter-spacing: 6px;
        margin-bottom: 45px;
        color: black;
        font-weight: 500;
    }
}

/* 修改 Element Plus 組件樣式 */
:deep(.el-form-item__label) {
    color: $neutral-color-700;
}

:deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    border-radius: 6px;

    &:hover {
        box-shadow: 0 0 0 1px $primary-color-700 inset;
    }
}

.login-submit {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    width: 244px;
    height: 40px;
    background-color: $primary-color-700;
    border-color: $primary-color-700;
    margin-top: 50px;
    font-size: 16px;
    letter-spacing: 2px;
    border-radius: 10px;

    &:hover {
        background-color: $accent-color-700;
        border-color: $accent-color-800;
    }
}
</style>