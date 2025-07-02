// frontend/src/api.js
import axios from 'axios';
import config from './config';

// 默认 baseURL 指向后端
// 使用配置中的基础URL
export const http = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 5000
});

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

// 获取单个地标详情（后面用到）
// export function fetchSiteDetail(id) {
//   return http.get(`/sites/${id}`).then(res => res.data);
// }

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