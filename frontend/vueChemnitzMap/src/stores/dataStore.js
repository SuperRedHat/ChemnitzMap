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
      q: ''            // 搜索关键字
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

    /** 核心：根据 filter，把 allSites 过滤出 sites **/
    applyFilter() {
      console.log('💡 applyFilter(), allSites length:', this.allSites.length)
      let result = this.allSites

      // 按类别过滤
      if (this.filter.category) {
        result = result.filter(
          site => site.category === this.filter.category
        )
      }

      // 按关键字过滤（名称或地址里包含 q 即匹配）
      if (this.filter.q) {
        const qLower = this.filter.q.toLowerCase()
        result = result.filter(
          site =>
            (site.name && site.name.toLowerCase().includes(qLower)) ||
            (site.address && site.address.toLowerCase().includes(qLower))
        )
      }

      this.sites = result
      console.log('💡 applyFilter() 后，sites length:', this.sites.length)
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
    }
  }
})
