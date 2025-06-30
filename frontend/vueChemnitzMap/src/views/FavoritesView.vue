<template>
  <div class="favorites-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>我的收藏</h2>
          <span class="count">共 {{ favoritesStore.favoriteCount }} 个收藏</span>
        </div>
      </template>

      <div v-loading="favoritesStore.loading">
        <el-empty v-if="favoritesStore.favorites.length === 0" description="暂无收藏" />
        
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
                收藏于 {{ formatDate(site.favorited_at) }}
              </p>
            </div>

            <div class="favorite-actions">
              <el-button 
                size="small" 
                @click="viewOnMap(site)"
              >
                在地图查看
              </el-button>
              <el-button 
                size="small" 
                @click="viewDetails(site.id)"
              >
                查看详情
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                plain
                @click="removeFavorite(site.id)"
              >
                取消收藏
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN', {
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