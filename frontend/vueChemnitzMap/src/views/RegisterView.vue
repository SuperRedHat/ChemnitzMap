<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2 class="register-title">{{ $t('auth.registerTitle') }}</h2>
      </template>
      
      <el-form 
        ref="registerFormRef"
        :model="registerForm" 
        :rules="rules"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item :label="$t('auth.username')" prop="username">
          <el-input 
            v-model="registerForm.username" 
            :placeholder="$t('auth.enterUsername')"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item :label="$t('auth.email')" prop="email">
          <el-input 
            v-model="registerForm.email" 
            :placeholder="$t('auth.enterEmail')"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item :label="$t('auth.password')" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            :placeholder="$t('auth.enterPasswordHint')"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('auth.confirmPassword')" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            :placeholder="$t('auth.confirmPasswordPlaceholder')"
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
            @click="handleRegister"
            style="width: 100%"
          >
            {{ $t('auth.register') }}
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span>{{ $t('auth.hasAccount') }}</span>
          <router-link to="/login" class="link">{{ $t('auth.login') }}</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const registerFormRef = ref();
const loading = ref(false);

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.confirmPasswordRequired')));
  } else if (value !== registerForm.password) {
    callback(new Error(t('validation.passwordMismatch')));
  } else {
    callback();
  }
};

const rules = computed(() => ({
  username: [
    { required: true, message: t('validation.usernameRequired'), trigger: 'blur' },
    { min: 3, max: 20, message: t('validation.usernameLength'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('validation.emailFormat'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ]
}));

const handleRegister = async () => {
  const valid = await registerFormRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const { confirmPassword, ...userData } = registerForm;
    const result = await authStore.register(userData);
    if (result.success) {
      // 注册成功，跳转到首页
      router.push('/');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
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

.register-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  /* 确保卡片在遮罩层之上 */
  position: relative;
  z-index: 2;
  /* 可选：给卡片添加一点透明度 */
  background: rgba(255, 255, 255, 0.95);
}

.register-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}

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
  .register-card {
    max-width: 100%;
  }
  
  .register-title {
    font-size: 20px;
  }
}
</style>