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

    await formEl.validate(async (valid) => {
        if (valid) {
            loading.value = true

            try {
                const response = await fetch('/data/others/admins.json')
                if (!response.ok) throw new Error('無法讀取管理員資料庫')
                const adminData = await response.json()
                // 模擬 API 請求
                setTimeout(() => {
                    // 比對帳號密碼
                    const user = adminData.find(u =>
                        u.admin_account === loginForm.username &&
                        u.admin_password === loginForm.password
                    )
                    if (user) {
                        if (user.admin_level == 0) {
                            ElMessage.error('沒有權限，請聯絡主要管理員')
                            loading.value = false
                            return // 強制中斷，不執行下面的登入邏輯
                        }
                        // 登入成功
                        // 3. 將使用者資訊存入 localStorage，方便後台顯示姓名
                        localStorage.setItem('admin_user', JSON.stringify({
                            name: user.admin_name,
                            level: user.admin_level,
                            account: user.admin_account
                        }))

                        ElMessage({
                            message: `${user.admin_name}歡迎回來~正在導向管理後台...`,
                            type: 'success',
                            duration: 1500
                        })
                        setTimeout(() => {
                            loading.value = false
                            router.push('/admin/members')
                        }, 1000)
                    } else {
                        // 登入失敗
                        loading.value = false
                        ElMessage.error('登入失敗(可用測試用帳號：admin / 密碼：123456)')
                    }
                }, 1000)

            } catch (error) {
                // 處理 fetch 失敗或 JSON 解析失敗
                loading.value = false
                console.error('Login Error:', error)
                ElMessage.error('系統錯誤：無法載入管理員資料')
            }
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
    min-height: 100vh; // 確保容器跟螢幕一樣高
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