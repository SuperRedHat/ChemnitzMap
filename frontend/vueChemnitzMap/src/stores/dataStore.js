// frontend/src/stores/dataStore.js
import { defineStore } from 'pinia';
import { fetchCategories, fetchSites } from '@/api';

export const useDataStore = defineStore('data', {
  state: () => ({
    categories: [],    // { id, name, color }
    sites: [],         // 全量或过滤后的地标列表
    loading: false,
    error: null,
    filter: {
      category: '',    // 当前选中的类别 name
      q: ''            // 搜索关键字
    }
  }),
  actions: {
    async loadCategories() {
      try {
        this.categories = await fetchCategories();
      } catch (err) {
        this.error = '加载分类失败';
      }
    },
    async loadSites() {
      this.loading = true;
      this.error = null;
      try {
        this.sites = await fetchSites(this.filter);
      } catch (err) {
        this.error = '加载地标失败';
      } finally {
        this.loading = false;
      }
    },
    setCategory(cat) {
      this.filter.category = cat;
      this.loadSites();
    },
    setQuery(q) {
      this.filter.q = q;
      this.loadSites();
    }
  }
});
