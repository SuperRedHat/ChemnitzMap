<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">登录 Chemnitz Cultural Map</h2>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item :label="$t('auth.username') + $t('common.or') + $t('auth.email')" prop="emailOrUsername">
          <el-input 
            v-model="loginForm.emailOrUsername" 
            placeholder="请输入用户名或邮箱"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
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
            登录
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
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
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
  color: #409EFF;
  text-decoration: none;
  margin-left: 5px;
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