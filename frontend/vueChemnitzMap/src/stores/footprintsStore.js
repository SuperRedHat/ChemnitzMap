import { defineStore } from 'pinia';
import { http } from '@/api';
import { ElMessage, ElNotification } from 'element-plus';
import { useAuthStore } from './authStore';
import i18n from '@/locales';

export const useFootprintsStore = defineStore('footprints', {
  state: () => ({
    footprints: [],
    footprintSiteIds: new Set(),
    stats: {
      total: 0,
      totalSites: 0,
      percentage: 0,
      medals: 0,
      nextMilestoneProgress: 0,
      categoryStats: [],
      achievements: []
    },
    loading: false
  }),

  getters: {
    isCollected: (state) => (siteId) => state.footprintSiteIds.has(siteId),
    footprintCount: (state) => state.footprints.length,
    
    // 获取下一个里程碑进度
    nextMilestonePercentage: (state) => {
      return (state.stats.nextMilestoneProgress / 5) * 100;
    },
    
    // 获取整体进度
    overallProgress: (state) => {
      return parseFloat(state.stats.percentage) || 0;
    }
  },

  actions: {
    // 获取足迹列表
    async fetchFootprints() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;

      this.loading = true;
      try {
        const response = await http.get('/footprints');
        this.footprints = response.data;
        this.footprintSiteIds = new Set(response.data.map(f => f.site_id));
      } catch (error) {
        console.error('Failed to fetch footprints:', error);
      } finally {
        this.loading = false;
      }
    },

    // 获取统计信息
    async fetchStats() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;

      try {
        const response = await http.get('/footprints/stats');
        this.stats = response.data;
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    },

    // 收集地点
    async collectSite(siteId, siteName, userLocation) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        ElMessage.warning(i18n.global.t('messages.loginFirst'));
        return { success: false, needLogin: true };
      }

      if (!userLocation) {
        ElMessage.error(i18n.global.t('messages.locationError'));
        return { success: false, error: i18n.global.t('messages.locationError') };
      }

      try {
        const response = await http.post(`/footprints/${siteId}`, {
          lat: userLocation[0],
          lon: userLocation[1]
        });

        this.footprintSiteIds.add(siteId);
        
        // 显示成功消息
        ElMessage.success({
          message: i18n.global.t('messages.collectSuccess', { name: siteName }),
          duration: 3000,
          showClose: true
        });

        // 更新统计信息
        this.stats = response.data.stats;

        // 检查是否达成新的里程碑
        if (this.stats.total % 5 === 0) {
          ElNotification({
            title: i18n.global.t('messages.milestoneTitle'),
            message: i18n.global.t('messages.milestoneMessage', { count: this.stats.medals }),
            type: 'success',
            duration: 5000,
            position: 'top-right'
          });
        }

        // 重新获取足迹列表
        this.fetchFootprints();
        
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || i18n.global.t('messages.collectFailed');
        const distance = error.response?.data?.distance;
        
        if (distance) {
          ElMessage.error(i18n.global.t('messages.tooFarMessage', { distance }));
        } else {
          ElMessage.error(message);
        }
        
        return { success: false, error: message };
      }
    },

    // 检查地点是否已收集
    async checkCollectionStatus(siteId) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return null;

      try {
        const response = await http.get(`/footprints/check/${siteId}`);
        if (response.data.isCollected) {
          this.footprintSiteIds.add(siteId);
        } else {
          this.footprintSiteIds.delete(siteId);
        }
        return response.data;
      } catch (error) {
        console.error('Failed to check collection status:', error);
        return null;
      }
    },

    // 删除足迹（测试用）
    async removeFootprint(siteId) {
      try {
        await http.delete(`/footprints/${siteId}`);
        this.footprintSiteIds.delete(siteId);
        this.footprints = this.footprints.filter(f => f.site_id !== siteId);
        ElMessage.success(i18n.global.t('messages.footprintDeleted'));
        
        // 重新获取统计信息
        this.fetchStats();
        
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || i18n.global.t('messages.deleteFailed');
        ElMessage.error(message);
        return { success: false, error: message };
      }
    },

    // 清空足迹（退出登录时调用）
    clearFootprints() {
      this.footprints = [];
      this.footprintSiteIds.clear();
      this.stats = {
        total: 0,
        totalSites: 0,
        percentage: 0,
        medals: 0,
        nextMilestoneProgress: 0,
        categoryStats: [],
        achievements: []
      };
    }
  }
});