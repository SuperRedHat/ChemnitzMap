// frontend/src/api.js
import axios from 'axios';
import config from './config';

// 创建 axios 实例
export const http = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 5000
});

// 延迟设置拦截器的函数，避免循环依赖
export const setupInterceptors = () => {
  // 动态导入 i18n
  import('@/locales').then(({ default: i18n }) => {
    // 请求拦截器
    http.interceptors.request.use(config => {
      // 从 localStorage 获取 token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 添加语言头
      config.headers['Accept-Language'] = i18n.global.locale.value;
      
      return config;
    });

    // 响应拦截器（可选，用于统一错误处理）
    http.interceptors.response.use(
      response => response,
      error => {
        // 这里可以添加统一的错误处理
        return Promise.reject(error);
      }
    );
  });
};

// 获取所有分类
export function fetchCategories() {
  return http.get('/categories').then(res => res.data);
}

// 获取地标列表，可按 category 和 q 过滤
export function fetchSites({ category, q } = {}) {
  const params = {};
  if (category) params.category = category;
  if (q)         params.q = q;
  return http.get('/sites', { params }).then(res => res.data);
}

// 获取单个地标详情
export function fetchSiteDetail(id) {
  return http.get(`/sites/${id}`).then(res => res.data);
}

// 获取地点评论
export function fetchSiteComments(siteId, params = {}) {
  return http.get(`/comments/site/${siteId}`, { params }).then(res => res.data);
}

// 添加评论
export function addComment(siteId, data) {
  return http.post(`/comments/site/${siteId}`, data).then(res => res.data);
}

// 获取用户评论
export function fetchUserComments(userId) {
  return http.get(`/comments/user/${userId}`).then(res => res.data);
}

// 删除评论
export function deleteComment(commentId) {
  return http.delete(`/comments/${commentId}`).then(res => res.data);
}

// 获取所有评论（管理员）
export function fetchAllComments(params = {}) {
  return http.get('/comments/all/list', { params }).then(res => res.data);
}

// 批量删除评论（管理员）
export function batchDeleteComments(commentIds) {
  return http.post('/comments/batch-delete', { commentIds }).then(res => res.data);
}

// 足迹相关API
export function collectSite(siteId, data) {
  return http.post(`/footprints/${siteId}`, data).then(res => res.data);
}

export function fetchFootprints() {
  return http.get('/footprints').then(res => res.data);
}

export function fetchFootprintStats() {
  return http.get('/footprints/stats').then(res => res.data);
}

export function checkFootprintStatus(siteId) {
  return http.get(`/footprints/check/${siteId}`).then(res => res.data);
}

export function deleteFootprint(siteId) {
  return http.delete(`/footprints/${siteId}`).then(res => res.data);
}