// frontend/vueChemnitzMap/src/stores/authStore.js
import { defineStore } from 'pinia';
import { http } from '@/api';
import { ElMessage } from 'element-plus';
import i18n from '@/locales';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    username: (state) => state.user?.username || '',
    userId: (state) => state.user?.id || null
  },

  actions: {
    // 设置认证信息
    setAuth(user, token) {
      this.user = user;
      this.token = token;
      this.isAuthenticated = true;
      localStorage.setItem('token', token);
      // 设置 axios 默认 header
      http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // 用户注册
    async register(userData) {
      try {
        const response = await http.post('/users/register', userData);
        const { user, token } = response.data;
        this.setAuth(user, token);
        ElMessage.success(i18n.global.t('messages.registerSuccess'));
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || i18n.global.t('messages.registerFailed');
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 用户登录
    async login(credentials) {
      try {
        const response = await http.post('/users/login', credentials);
        const { user, token } = response.data;
        this.setAuth(user, token);
        ElMessage.success(i18n.global.t('messages.loginSuccess'));
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || i18n.global.t('messages.loginFailed');
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 获取当前用户信息
    async fetchCurrentUser() {
      if (!this.token) return;

      try {
        http.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        const response = await http.get('/users/me');
        this.user = response.data;
        this.isAuthenticated = true;
      } catch (error) {
        // Token 无效或过期
        this.logout();
      }
    },

    // 更新用户信息
    async updateProfile(data) {
      try {
        const response = await http.put('/users/me', data);
        this.user = response.data.user;
        ElMessage.success(i18n.global.t('messages.updateSuccess'));
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || i18n.global.t('messages.updateFailed');
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 退出登录
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete http.defaults.headers.common['Authorization'];
      ElMessage.success(i18n.global.t('messages.logoutSuccess'));
    }
  }
});