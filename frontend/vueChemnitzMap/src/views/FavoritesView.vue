<template>
  <div class="favorites-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>{{ $t('favorites.title') }}</h2>
          <span class="count">{{ $t('favorites.count', { count: favoritesStore.favoriteCount }) }}</span>
        </div>
      </template>

      <div v-loading="favoritesStore.loading">
        <el-empty v-if="favoritesStore.favorites.length === 0" :description="$t('favorites.empty')" />
        
        <div v-else class="favorites-grid">
          <el-card 
            v-for="site in favoritesStore.favorites" 
            :key="site.id"
            class="favorite-card"
            shadow="hover"
          >
            <div class="favorite-header">
              <h3 :style="{ color: site.color }">{{ site.name }}</h3>
              <el-tag :color="site.color" effect="dark" size="small">
                {{ site.category }}
              </el-tag>
            </div>

            <div class="favorite-info">
              <p v-if="site.address" class="address">
                <el-icon><Location /></el-icon>
                {{ site.address }}
              </p>
              <p class="time">
                <el-icon><Clock /></el-icon>
                {{ $t('favorites.addedAt') }} {{ formatDate(site.favorited_at) }}
              </p>
            </div>

            <div class="favorite-actions">
              <el-button 
                size="small" 
                @click="viewOnMap(site)"
              >
                {{ $t('favorites.viewOnMap') }}
              </el-button>
              <el-button 
                size="small" 
                @click="viewDetails(site.id)"
              >
                {{ $t('favorites.viewDetails') }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                plain
                @click="removeFavorite(site.id)"
              >
                {{ $t('favorites.remove') }}
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useDataStore } from '@/stores/dataStore';

const router = useRouter();
const favoritesStore = useFavoritesStore();
const dataStore = useDataStore();

import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const viewOnMap = (site) => {
  // 设置地图过滤条件并跳转
  dataStore.filter.category = '';
  dataStore.filter.q = site.name;
  router.push('/');
};

const viewDetails = (siteId) => {
  router.push(`/site/${siteId}`);
};

const removeFavorite = async (siteId) => {
  await favoritesStore.removeFavorite(siteId);
};

onMounted(() => {
  favoritesStore.fetchFavorites();
});
</script>

<style scoped>
.favorites-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.favorites-container .el-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 使卡片内容可滚动 */
.favorites-container .el-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

/* 优化滚动条样式 */
.favorites-container ::-webkit-scrollbar {
  width: 8px;
}

.favorites-container ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.favorites-container ::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.favorites-container ::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.favorites-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.count {
  color: #909399;
  font-size: 14px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.favorite-card {
  transition: transform 0.2s;
}

.favorite-card:hover {
  transform: translateY(-2px);
}

.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.favorite-header h3 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
  margin-right: 10px;
}

.favorite-info {
  margin-bottom: 15px;
}

.favorite-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.favorite-info .el-icon {
  color: #909399;
}

.favorite-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: 1fr;
  }
  
  .favorite-actions {
    flex-direction: column;
  }
  
  .favorite-actions .el-button {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>