<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <h2>{{ $t('profile.title') }}</h2>
      </template>

      <el-form 
        ref="profileFormRef"
        :model="profileForm" 
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="$t('auth.username')" prop="username">
          <el-input v-model="profileForm.username" />
        </el-form-item>

        <el-form-item :label="$t('auth.email')" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>

        <el-form-item label="角色">
          <el-tag :type="authStore.isAdmin ? 'danger' : 'success'">
            {{ authStore.isAdmin ? $t('auth.admin') : $t('auth.user') }}
          </el-tag>
        </el-form-item>

        <el-form-item :label="$t('auth.registeredAt')">
          <span>{{ formatDate(authStore.user?.created_at) }}</span>
        </el-form-item>

        <el-form-item :label="$t('auth.currentLocation')">
          <span v-if="authStore.user?.current_lat && authStore.user?.current_lon">
            📍 {{ $t('auth.latitude') }}: {{ authStore.user.current_lat.toFixed(6) }}, 
            {{ $t('auth.longitude') }}: {{ authStore.user.current_lon.toFixed(6) }}
          </span>
          <span v-else>{{ $t('auth.notSet') }}</span>
        </el-form-item>

        <el-divider>{{ $t('profile.changePassword') }}</el-divider>

        <el-form-item :label="$t('auth.currentPassword')" prop="currentPassword">
          <el-input 
            v-model="profileForm.currentPassword" 
            type="password"
            :placeholder="$t('profile.passwordPlaceholder')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('auth.newPassword')" prop="newPassword">
          <el-input 
            v-model="profileForm.newPassword" 
            type="password"
            :placeholder="$t('profile.newPasswordPlaceholder')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('auth.confirmPassword')" prop="confirmPassword">
          <el-input 
            v-model="profileForm.confirmPassword" 
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleUpdate" :loading="loading">
            {{ $t('profile.saveChanges') }}
          </el-button>
          <el-button @click="resetForm">{{ $t('profile.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const profileFormRef = ref();
const loading = ref(false);
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const profileForm = reactive({
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validatePassword = (rule, value, callback) => {
  if (value && value !== profileForm.newPassword) {
    callback(new Error(t('validation.passwordMismatch')));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: t('validation.usernameRequired'), trigger: 'blur' },
    { min: 3, max: 20, message: t('validation.usernameLength'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('validation.emailFormat'), trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePassword, trigger: 'blur' }
  ]
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const locale = t('locale') === 'zh' ? 'zh-CN' : t('locale') === 'de' ? 'de-DE' : 'en-US';
  return new Date(dateString).toLocaleString(locale);
};

const resetForm = () => {
  if (authStore.user) {
    profileForm.username = authStore.user.username;
    profileForm.email = authStore.user.email;
    profileForm.currentPassword = '';
    profileForm.newPassword = '';
    profileForm.confirmPassword = '';
  }
};

const handleUpdate = async () => {
  const valid = await profileFormRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const updateData = {
      username: profileForm.username,
      email: profileForm.email
    };

    // 如果填写了新密码，则包含密码修改
    if (profileForm.newPassword) {
      updateData.currentPassword = profileForm.currentPassword;
      updateData.newPassword = profileForm.newPassword;
    }

    await authStore.updateProfile(updateData);
    // 清空密码字段
    profileForm.currentPassword = '';
    profileForm.newPassword = '';
    profileForm.confirmPassword = '';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.profile-card h2 {
  margin: 0;
  color: #303133;
}
</style>