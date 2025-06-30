// frontend/vueChemnitzMap/src/stores/favoritesStore.js
import { defineStore } from 'pinia';
import { http } from '@/api';
import { ElMessage } from 'element-plus';
import { useAuthStore } from './authStore';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [],
    favoriteSiteIds: new Set(),
    loading: false
  }),

  getters: {
    isFavorited: (state) => (siteId) => state.favoriteSiteIds.has(siteId),
    favoriteCount: (state) => state.favorites.length
  },

  actions: {
    // 获取收藏列表
    async fetchFavorites() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;

      this.loading = true;
      try {
        const response = await http.get('/favorites');
        this.favorites = response.data;
        this.favoriteSiteIds = new Set(response.data.map(f => f.id));
      } catch (error) {
        console.error('获取收藏列表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // 添加收藏
    async addFavorite(siteId) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        ElMessage.warning('请先登录');
        return { success: false, needLogin: true };
      }

      try {
        await http.post(`/favorites/${siteId}`);
        this.favoriteSiteIds.add(siteId);
        ElMessage.success('收藏成功');
        // 重新获取收藏列表
        this.fetchFavorites();
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || '收藏失败';
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 取消收藏
    async removeFavorite(siteId) {
      try {
        await http.delete(`/favorites/${siteId}`);
        this.favoriteSiteIds.delete(siteId);
        this.favorites = this.favorites.filter(f => f.id !== siteId);
        ElMessage.success('已取消收藏');
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || '取消收藏失败';
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 切换收藏状态
    async toggleFavorite(siteId) {
      if (this.isFavorited(siteId)) {
        return this.removeFavorite(siteId);
      } else {
        return this.addFavorite(siteId);
      }
    },

    // 检查某个地点是否已收藏
    async checkFavoriteStatus(siteId) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return false;

      try {
        const response = await http.get(`/favorites/check/${siteId}`);
        const isFavorited = response.data.isFavorited;
        if (isFavorited) {
          this.favoriteSiteIds.add(siteId);
        } else {
          this.favoriteSiteIds.delete(siteId);
        }
        return isFavorited;
      } catch (error) {
        console.error('检查收藏状态失败:', error);
        return false;
      }
    },

    // 清空收藏（退出登录时调用）
    clearFavorites() {
      this.favorites = [];
      this.favoriteSiteIds.clear();
    }
  }
});