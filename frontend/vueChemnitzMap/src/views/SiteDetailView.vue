<template>
  <div class="site-detail-container" v-loading="loading">
    <el-card v-if="site" class="site-card">
      <template #header>
        <div class="card-header">
          <h2 :style="{ color: site.color }">{{ site.name }}</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAuthenticated"
              :icon="favoritesStore.isFavorited(site.id) ? 'Star' : 'StarFilled'"
              :type="favoritesStore.isFavorited(site.id) ? 'warning' : 'default'"
              @click="handleFavorite"
            >
              {{ favoritesStore.isFavorited(site.id) ? $t('site.favorited') : $t('site.favorite') }}
            </el-button>
            <el-button @click="$router.back()">{{ $t('common.back') }}</el-button>
          </div>
        </div>
      </template>

      <div class="site-content">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <div class="info-section">
              <h3>{{ $t('site.basicInfo') }}</h3>
              <div class="info-item">
                <span class="label">{{ $t('site.category') }}:</span>
                <el-tag :color="site.color" effect="dark">{{ site.category }}</el-tag>
              </div>
              <div class="info-item" v-if="site.address">
                <span class="label">{{ $t('site.address') }}:</span>
                <span>{{ site.address }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ $t('site.coordinates') }}:</span>
                <span>{{ site.lat.toFixed(6) }}, {{ site.lon.toFixed(6) }}</span>
              </div>
              <div class="info-item" v-if="site.osm_id">
                <span class="label">{{ $t('site.osmId') }}:</span>
                <span>{{ site.osm_id }}</span>
              </div>
            </div>

            <div class="description-section">
              <h3>{{ $t('site.description') }}</h3>
              <p>{{ site.description || $t('site.noDescription') }}</p>
              
              <!-- 根据类别显示不同的额外信息 -->
              <div class="category-info" v-if="site.category === 'Theatre'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🎭</span>
                  <div>
                    <h4>{{ $t('site.theatreInfo') }}</h4>
                    <p>{{ $t('site.theatreDesc') }}</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Museum'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🏛️</span>
                  <div>
                    <h4>{{ $t('site.museumInfo') }}</h4>
                    <p>{{ $t('site.museumDesc') }}</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Public Art'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🎨</span>
                  <div>
                    <h4>{{ $t('site.publicArtInfo') }}</h4>
                    <p>{{ $t('site.publicArtDesc') }}</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Restaurant'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🍽️</span>
                  <div>
                    <h4>{{ $t('site.restaurantInfo') }}</h4>
                    <p>{{ $t('site.restaurantDesc') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 评论部分 -->
            <div class="comment-section">
              <h3>{{ $t('comment.title') }}</h3>
              
              <!-- 评分概览 -->
              <div class="rating-overview">
                <div class="rating-summary">
                  <span class="avg-rating">{{ avgRating.toFixed(1) }}</span>
                  <el-rate 
                    v-model="avgRating" 
                    disabled 
                    show-score 
                    text-color="#ff9900"
                  />
                  <span class="rating-count">{{ $t('comment.ratingCount', { count: ratingCount }) }}</span>
                </div>
                
                <el-button 
                  v-if="authStore.isAuthenticated && !hasCommented"
                  type="primary" 
                  @click="showCommentDialog = true"
                >
                  {{ $t('comment.writeReview') }}
                </el-button>
                <el-button 
                  v-else-if="!authStore.isAuthenticated"
                  @click="$router.push('/login')"
                >
                  {{ $t('comment.loginToReview') }}
                </el-button>
                <div v-else-if="hasCommented" class="commented-tip">
                  {{ $t('comment.alreadyReviewed') }}
                </div>
              </div>

              <!-- 评论列表 -->
              <div class="comment-list" v-if="comments.length > 0">
                <div 
                  v-for="comment in displayedComments" 
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-header">
                    <span class="comment-user">{{ comment.username }}</span>
                    <el-rate 
                      :model-value="comment.rating" 
                      disabled 
                      size="small"
                    />
                    <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                    <!-- 添加删除按钮 -->
                    <el-button
                      v-if="canDeleteComment(comment)"
                      type="danger"
                      size="small"
                      text
                      @click="handleDeleteComment(comment.id)"
                    >
                      {{ $t('common.delete') }}
                    </el-button>
                  </div>
                  <div class="comment-text">{{ comment.text }}</div>
                </div>
                
                <div v-if="comments.length > 5 && !showAllComments" class="view-more">
                  <el-button text @click="showAllComments = true">
                    {{ $t('comment.viewAll', { count: comments.length }) }}
                  </el-button>
                </div>
              </div>
              
              <el-empty v-else :description="$t('comment.noReviews')" />
            </div>

            <!-- 写评论对话框 -->
            <el-dialog 
              v-model="showCommentDialog" 
              :title="$t('comment.writeReview')" 
              width="500px"
            >
              <el-form @submit.prevent="submitComment">
                <el-form-item :label="$t('comment.rating')">
                  <el-rate 
                    v-model="newComment.rating" 
                    :texts="ratingTexts"
                    show-text
                  />
                </el-form-item>
                
                <el-form-item :label="$t('comment.reviewContent')">
                  <el-input 
                    v-model="newComment.text" 
                    type="textarea" 
                    :rows="4"
                    :placeholder="$t('comment.shareExperience')"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
              </el-form>
              
              <template #footer>
                <el-button @click="showCommentDialog = false">{{ $t('common.cancel') }}</el-button>
                <el-button 
                  type="primary" 
                  @click="submitComment"
                  :loading="submitting"
                >
                  {{ $t('comment.submitReview') }}
                </el-button>
              </template>
            </el-dialog>
          </el-col>

          <el-col :xs="24" :md="12">
            <div class="map-section">
              <h3>{{ $t('site.location') }}</h3>
              <div id="detail-map" style="height: 400px;"></div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-empty v-else-if="!loading" :description="$t('site.doesNotExist')" />
  </div>
</template>

<script setup>
import { fetchSiteComments, addComment, deleteComment } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { http } from '@/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
// 评分文本
const ratingTexts = computed(() => t('comment.ratingTexts'));

// 判断是否可以删除评论
const canDeleteComment = (comment) => {
  if (!authStore.isAuthenticated) return false;
  // 管理员或评论作者可以删除
  return authStore.isAdmin || comment.user_id === authStore.userId;
};

// 删除评论
const handleDeleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm(t('comment.deleteConfirm'), t('common.delete'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    });

    await deleteComment(commentId);
    ElMessage.success(t('comment.deleteSuccess'));
    
    await fetchComments();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('comment.deleteError'));
    }
  }
};

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const route = useRoute();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

const loading = ref(true);
const site = ref(null);
let detailMap = null;

const comments = ref([]);
const avgRating = ref(0);
const ratingCount = ref(0);
const showCommentDialog = ref(false);
const showAllComments = ref(false);
const submitting = ref(false);
const hasCommented = ref(false);

const newComment = ref({
  rating: 5,
  text: ''
});

// 计算属性：显示的评论
const displayedComments = computed(() => {
  return showAllComments.value ? comments.value : comments.value.slice(0, 5);
});

// 获取评论列表
const fetchComments = async () => {
  try {
    const data = await fetchSiteComments(route.params.id, { limit: 100 });
    comments.value = data.comments;
    avgRating.value = parseFloat(data.avgRating) || 0;
    ratingCount.value = data.ratingCount;
    
    // 检查当前用户是否已评论
    if (authStore.isAuthenticated) {
      hasCommented.value = comments.value.some(c => c.user_id === authStore.userId);
    }
  } catch (error) {
    console.error('获取评论失败:', error);
  }
};

// 提交评论
const submitComment = async () => {
  if (!newComment.value.rating) {
    ElMessage.warning(t('comment.ratingRequired'));
    return;
  }
  
  if (!newComment.value.text.trim()) {
    ElMessage.warning(t('comment.contentRequired'));
    return;
  }
  
  submitting.value = true;
  try {
    await addComment(route.params.id, {
      rating: newComment.value.rating,
      text: newComment.value.text.trim()
    });
    
    ElMessage.success(t('comment.submitSuccess'));
    showCommentDialog.value = false;
    
    newComment.value = { rating: 5, text: '' };
    
    await fetchComments();
  } catch (error) {
    const message = error.response?.data?.error || t('comment.submitError');
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const locale = t('locale') === 'zh' ? 'zh-CN' : t('locale') === 'de' ? 'de-DE' : 'en-US';
  return new Date(dateString).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 在获取地点详情后也获取评论
const fetchSiteDetail = async () => {
  try {
    const response = await http.get(`/sites/${route.params.id}`);
    site.value = response.data;
    
    // 获取评论
    await fetchComments();
    
    // 等待DOM更新后初始化地图
    await nextTick();
    setTimeout(() => {
      initMap();
    }, 100);
  } catch (error) {
    console.error('获取地点详情失败:', error);
  } finally {
    loading.value = false;
  }
};


// 初始化地图
const initMap = () => {
  if (!site.value) return;
  
  // 确保容器存在
  const mapContainer = document.getElementById('detail-map');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  // 如果地图已存在，先移除
  if (detailMap) {
    detailMap.remove();
  }

  try {
    detailMap = L.map('detail-map').setView([site.value.lat, site.value.lon], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(detailMap);

    // 添加标记
    L.marker([site.value.lat, site.value.lon])
      .addTo(detailMap)
      .bindPopup(site.value.name)
      .openPopup();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

// 处理收藏
const handleFavorite = async () => {
  const result = await favoritesStore.toggleFavorite(site.value.id);
  if (result.needLogin) {
    $router.push('/login');
  }
};

onMounted(() => {
  fetchSiteDetail();
});

onUnmounted(() => {
  if (detailMap) {
    detailMap.remove();
  }
});
</script>

<style scoped>
.site-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.site-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.site-content {
  padding: 20px 0;
}

.info-section,
.description-section,
.map-section {
  margin-bottom: 30px;
}

.info-section h3,
.description-section h3,
.map-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 1.2rem;
}

.info-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
}

.description-section p {
  line-height: 1.6;
  color: #606266;
}

.category-info {
  margin-top: 20px;
}

.icon-info {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.icon-info .icon {
  font-size: 3rem;
}

.icon-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.icon-info p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

#detail-map {
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.comment-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #e4e4e4;
}

.rating-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avg-rating {
  font-size: 2rem;
  font-weight: bold;
  color: #ff9900;
}

.rating-count {
  color: #909399;
  font-size: 14px;
}

.commented-tip {
  color: #909399;
  font-size: 14px;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
}

.view-more {
  text-align: center;
  margin-top: 20px;
}
</style>