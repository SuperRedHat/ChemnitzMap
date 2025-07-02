import { defineStore } from 'pinia';
import { http } from '@/api';
import { ElMessage, ElNotification } from 'element-plus';
import { useAuthStore } from './authStore';

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
        console.error('获取足迹列表失败:', error);
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
        console.error('获取统计信息失败:', error);
      }
    },

    // 收集地点
    async collectSite(siteId, siteName, userLocation) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        ElMessage.warning('请先登录');
        return { success: false, needLogin: true };
      }

      if (!userLocation) {
        ElMessage.error('无法获取当前位置');
        return { success: false, error: '无法获取当前位置' };
      }

      try {
        const response = await http.post(`/footprints/${siteId}`, {
          lat: userLocation[0],
          lon: userLocation[1]
        });

        this.footprintSiteIds.add(siteId);
        
        // 显示成功消息
        ElMessage.success({
          message: `成功收集 "${siteName}"！`,
          duration: 3000,
          showClose: true
        });

        // 更新统计信息
        this.stats = response.data.stats;

        // 检查是否达成新的里程碑
        if (this.stats.total % 5 === 0) {
          ElNotification({
            title: '🎉 恭喜达成里程碑！',
            message: `您已获得第 ${this.stats.medals} 枚勋章！`,
            type: 'success',
            duration: 5000,
            position: 'top-right'
          });
        }

        // 重新获取足迹列表
        this.fetchFootprints();
        
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || '收集失败';
        const distance = error.response?.data?.distance;
        
        if (distance) {
          ElMessage.error(`${message}（当前距离：${distance}米）`);
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
        console.error('检查收集状态失败:', error);
        return null;
      }
    },

    // 删除足迹（测试用）
    async removeFootprint(siteId) {
      try {
        await http.delete(`/footprints/${siteId}`);
        this.footprintSiteIds.delete(siteId);
        this.footprints = this.footprints.filter(f => f.site_id !== siteId);
        ElMessage.success('已删除足迹');
        
        // 重新获取统计信息
        this.fetchStats();
        
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.error || '删除失败';
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