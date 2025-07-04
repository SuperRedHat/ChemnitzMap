<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">{{ $t('auth.loginTitle') }}</h2>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item :label="$t('auth.username') + ' ' + $t('common.or') + ' ' + $t('auth.email')" prop="emailOrUsername">
          <el-input 
            v-model="loginForm.emailOrUsername" 
            :placeholder="$t('auth.enterUsernameOrEmail')"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item :label="$t('auth.password')" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            :placeholder="$t('auth.enterPassword')"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            {{ $t('auth.login') }}
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <span>{{ $t('auth.noAccount') }}</span>
          <router-link to="/register" class="link">{{ $t('auth.register') }}</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();
const authStore = useAuthStore();
const loginFormRef = ref();
const loading = ref(false);

const loginForm = reactive({
  emailOrUsername: '',
  password: ''
});

const rules = {
  emailOrUsername: [
    { required: true, message: t('validation.usernameOrEmailRequired'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  const valid = await loginFormRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const result = await authStore.login(loginForm);
    if (result.success) {
      // 登录成功，跳转到首页或之前的页面
      const redirect = router.currentRoute.value.query.redirect || '/';
      router.push(redirect);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.el-button--primary {
  background: rgba(20, 30, 48, 0.9) !important;
  border-color: rgba(20, 30, 48, 0.9) !important;
  color: white !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-button--primary:hover {
  background: rgba(30, 40, 60, 1) !important;
  border-color: rgba(30, 40, 60, 1) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(20, 30, 48, 0.4);
}

.el-button--primary:active {
  transform: translateY(0);
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('@/assets/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 20px;
  position: relative;
}



.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  /* 确保卡片在遮罩层之上 */
  position: relative;
  z-index: 2;
  /* 可选：给卡片添加一点透明度，让背景若隐若现 */
  background: rgba(255, 255, 255, 0.95);
}

.login-title {
  text-align: center;
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}

.link {
  color: rgba(20, 30, 48, 0.9);
  text-decoration: none;
  margin-left: 5px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    max-width: 100%;
  }
  
  .login-title {
    font-size: 20px;
  }
}
</style>