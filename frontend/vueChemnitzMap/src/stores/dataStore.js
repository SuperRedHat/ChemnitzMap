// frontend/src/stores/dataStore.js
import { defineStore } from 'pinia'
import { fetchCategories, fetchSites } from '@/api'   // fetchSites() 返回站点数组

export const useDataStore = defineStore('data', {
  state: () => ({
    categories: [],    // { id, name, color }
    allSites: [],      // 后端一次性给的全量站点
    sites: [],         // 前端在 allSites 上根据 filter 过滤后的结果
    loading: false,
    error: null,
    filter: {
      category: '',    // 当前选中的类别 name
      q: '',            // 搜索关键字
      nearbyMode: false,      // 新增：是否开启附近模式
      nearbyRadius: 1000,     // 新增：附近模式的半径（米）
      userLocation: null      // 新增：用户位置 [lat, lon]
    }
  }),
  actions: {
    /** 拉分类 **/
    async loadCategories() {
      try {
        this.categories = await fetchCategories()
      } catch (err) {
        this.error = '加载分类失败'
        console.error(err)
      }
    },

    /** 只调用一次，拿到全量站点，然后应用一次 filter **/
    async loadAllSites() {
      console.log('💡 loadAllSites(), 当前 filter:', this.filter)
      this.loading = true
      this.error = null
      try {
        // 不带任何参数，一次性取回所有站点
        this.allSites = await fetchSites()  
        console.log('💡 拉到的 allSites 共', this.allSites.length, '条')
        // 第一次也要跑一次过滤（此时 filter 可能是 {category:'', q:''}）
        this.applyFilter()
      } catch (err) {
        this.error = '拉取站点失败'
        console.error(err)
        this.allSites = []
        this.sites = []
      } finally {
        this.loading = false
      }
    },

    /** 设置分类并重新过滤 **/
    setCategory(cat) {
      this.filter.category = cat
      this.applyFilter()
    },

    /** 设置搜索关键字并重新过滤 **/
    setQuery(q) {
      this.filter.q = q
      this.applyFilter()
    },

    /** 计算两点间距离（米） */
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // 地球半径（米）
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    },

    /** 核心：根据 filter，把 allSites 过滤出 sites */
    applyFilter() {
      console.log('💡 applyFilter(), allSites length:', this.allSites.length);
      let result = this.allSites;

      // 如果是附近模式，先按距离过滤
      if (this.filter.nearbyMode && this.filter.userLocation) {
        const [userLat, userLon] = this.filter.userLocation;
        result = result.filter(site => {
          const distance = this.calculateDistance(
            userLat, userLon, 
            site.lat, site.lon
          );
          return distance <= this.filter.nearbyRadius;
        });
        
        // 在附近模式下，如果还选择了分类，继续过滤
        if (this.filter.category) {
          result = result.filter(
            site => site.category === this.filter.category
          );
        }
      } 
      // 否则按原有逻辑过滤
      else {
        // 按类别过滤
        if (this.filter.category) {
          result = result.filter(
            site => site.category === this.filter.category
          );
        }

        // 按关键字过滤
        if (this.filter.q) {
          const qLower = this.filter.q.toLowerCase();
          result = result.filter(
            site =>
              (site.name && site.name.toLowerCase().includes(qLower)) ||
              (site.address && site.address.toLowerCase().includes(qLower))
          );
        }
      }

      this.sites = result;
      console.log('💡 applyFilter() 后，sites length:', this.sites.length);
    },

    /** 设置附近模式 */
    setNearbyMode(enabled, location = null) {
      this.filter.nearbyMode = enabled;
      if (location) {
        this.filter.userLocation = location;
      }
      if (enabled) {
        // 开启附近模式时，只清空搜索关键字，保留分类
        this.filter.q = '';
      } else {
        // 关闭附近模式时，清空分类
        this.filter.category = '';
      }
      this.applyFilter();
    },

    /** 设置附近模式半径 */
    setNearbyRadius(radius) {
      this.filter.nearbyRadius = radius;
      if (this.filter.nearbyMode) {
        this.applyFilter();
      }
    },

    /** 更新用户位置 */
    updateUserLocation(location) {
      this.filter.userLocation = location;
      if (this.filter.nearbyMode) {
        this.applyFilter();
      }
    }
  }
})
