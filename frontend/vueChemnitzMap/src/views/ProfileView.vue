<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <h2>个人资料</h2>
      </template>

      <el-form 
        ref="profileFormRef"
        :model="profileForm" 
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>

        <el-form-item label="角色">
          <el-tag :type="authStore.isAdmin ? 'danger' : 'success'">
            {{ authStore.isAdmin ? '管理员' : '普通用户' }}
          </el-tag>
        </el-form-item>

        <el-form-item label="注册时间">
          <span>{{ formatDate(authStore.user?.created_at) }}</span>
        </el-form-item>

        <el-form-item label="当前位置">
          <span v-if="authStore.user?.current_lat && authStore.user?.current_lon">
            📍 纬度: {{ authStore.user.current_lat.toFixed(6) }}, 
            经度: {{ authStore.user.current_lon.toFixed(6) }}
          </span>
          <span v-else>未设置位置</span>
        </el-form-item>

        <el-divider>修改密码</el-divider>

        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="profileForm.currentPassword" 
            type="password"
            placeholder="如不修改密码请留空"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="profileForm.newPassword" 
            type="password"
            placeholder="至少6位"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="profileForm.confirmPassword" 
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleUpdate" :loading="loading">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
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

const profileForm = reactive({
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validatePassword = (rule, value, callback) => {
  if (value && value !== profileForm.newPassword) {
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  newPassword: [
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePassword, trigger: 'blur' }
  ]
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN');
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