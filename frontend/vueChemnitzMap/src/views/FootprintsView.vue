<template>
  <div class="footprints-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>{{ $t('footprints.title') }}</h2>
          <span class="subtitle">{{ $t('footprints.subtitle') }}</span>
        </div>
      </template>

      <!-- 总进度 -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-title">{{ $t('footprints.progress', { 
            current: stats.total, 
            total: stats.totalSites, 
            percentage: stats.percentage 
          }) }}</span>
        </div>
        <el-progress 
          :percentage="Number(stats.percentage)" 
          :stroke-width="20"
          :color="progressColors"
        />
      </div>

      <!-- 勋章和里程碑 -->
      <div class="medals-section">
        <div class="medals-display">
          <span v-for="i in stats.medals" :key="i" class="medal">🏅</span>
          <span class="medal-count">{{ $t('footprints.medals', { count: stats.medals }) }}</span>
        </div>
        <div class="next-milestone">
          <span>{{ $t('footprints.nextMilestone', { current: stats.nextMilestoneProgress }) }}</span>
          <el-progress 
            :percentage="(stats.nextMilestoneProgress / 5) * 100" 
            :show-text="false"
            :stroke-width="10"
            style="width: 200px; margin-left: 10px;"
          />
        </div>
      </div>

      <!-- 成就墙 -->
      <div class="achievements-section">
        <h3>{{ $t('footprints.achievements') }}</h3>
        <div class="achievement-grid">
          <!-- 类别成就 -->
          <div 
            v-for="cat in categoryAchievements" 
            :key="cat.name"
            class="achievement-card"
            :class="{ achieved: cat.achieved }"
          >
            <div class="achievement-icon">{{ cat.icon }}</div>
            <div class="achievement-name">{{ cat.title }}</div>
            <div class="achievement-progress">{{ cat.current }}/5</div>
            <el-progress 
              :percentage="(cat.current / 5) * 100" 
              :show-text="false"
              :stroke-width="4"
            />
          </div>
          
          <!-- 特殊成就 -->
          <div 
            v-for="achievement in specialAchievements" 
            :key="achievement.name"
            class="achievement-card special"
            :class="{ achieved: achievement.achieved }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 切换视图 -->
      <div class="view-tabs">
        <el-radio-group v-model="viewMode" size="large">
          <el-radio-button label="card">{{ $t('footprints.cardView') }}</el-radio-button>
          <el-radio-button label="map">{{ $t('footprints.mapView') }}</el-radio-button>
          <el-radio-button label="timeline">{{ $t('footprints.timeline') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 内容区域 -->
      <div v-loading="footprintsStore.loading" class="content-area">
        <!-- 卡片视图 -->
        <div v-show="viewMode === 'card'" class="card-view-wrapper" >
          <div class="footprints-grid">
            <el-empty v-show="footprintsStore.footprints.length === 0" :description="$t('footprints.startExploring')" />
            
            <el-card 
              v-for="footprint in footprintsStore.footprints" 
              :key="footprint.id"
              class="footprint-card"
              shadow="hover"
            >
              <div class="footprint-header">
                <h3 :style="{ color: footprint.color }">{{ footprint.name }}</h3>
                <el-tag :color="footprint.color" effect="dark" size="small">
                  {{ footprint.category }}
                </el-tag>
              </div>

              <div class="footprint-info">
                <p v-if="footprint.address" class="address">
                  <el-icon><Location /></el-icon>
                  {{ footprint.address }}
                </p>
                <p class="time">
                  <el-icon><Clock /></el-icon>
                  {{ $t('footprints.collectedAt') }} {{ formatDate(footprint.collected_at) }}
                </p>
                <p class="distance" v-if="footprint.distance">
                  <el-icon><Position /></el-icon>
                  {{ $t('footprints.collectionDistance') }}：{{ $t('footprints.meters', { distance: footprint.distance }) }}
                </p>
              </div>

              <div class="footprint-actions">
                <el-button 
                  size="small" 
                  @click="viewOnMap(footprint)"
                >
                  {{ $t('footprints.viewOnMap') }}
                </el-button>
                <el-button 
                  size="small" 
                  @click="viewDetails(footprint.site_id)"
                >
                  {{ $t('footprints.viewDetails') }}
                </el-button>
                <el-button 
                  v-if="isDevelopment"
                  size="small" 
                  type="danger" 
                  plain
                  @click="removeFootprint(footprint.site_id)"
                >
                  {{ $t('footprints.deleteTest') }}
                </el-button>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 地图视图 -->
        <div v-show="viewMode === 'map'" class="map-container">
          <div id="footprints-map" style="height: 600px;"></div>
        </div>

        <!-- 时间线视图 -->
        <div v-show="viewMode === 'timeline'" class="timeline-container">
          <el-timeline>
            <el-timeline-item
              v-for="footprint in sortedFootprints"
              :key="footprint.id"
              :timestamp="formatDate(footprint.collected_at)"
              placement="top"
              :color="footprint.color"
            >
              <el-card>
                <h4 :style="{ color: footprint.color }">{{ footprint.name }}</h4>
                <p>{{ footprint.category }} · {{ $t('footprints.meters', { distance: footprint.distance }) }}</p>
                <p v-if="footprint.address">{{ footprint.address }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useFootprintsStore } from '@/stores/footprintsStore';
import { useDataStore } from '@/stores/dataStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();
const footprintsStore = useFootprintsStore();
const dataStore = useDataStore();

const viewMode = ref('card');
const stats = computed(() => footprintsStore.stats);
const isDevelopment = process.env.NODE_ENV === 'development';

let footprintsMap = null;

// 进度条颜色
const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
];

// 类别成就计算
const categoryAchievements = computed(() => {
  const achievements = [
    { name: 'Museum', icon: '🏛️', title: t('footprints.museumLover') },
    { name: 'Theatre', icon: '🎭', title: t('footprints.theaterFan') },
    { name: 'Public Art', icon: '🎨', title: t('footprints.artCollector') },
    { name: 'Restaurant', icon: '🍽️', title: t('footprints.foodExplorer') }
  ];

  return achievements.map(achievement => {
    const stat = stats.value.categoryStats.find(s => s.category === achievement.name) || { count: 0 };
    return {
      ...achievement,
      current: stat.count,
      achieved: stat.count >= 5
    };
  });
});

// 特殊成就
const specialAchievements = computed(() => {
  const total = stats.value.total;
  return [
    { 
      icon: '🌟', 
      name: t('footprints.firstExplore'), 
      desc: t('footprints.firstExploreDesc'),
      achieved: total >= 1 
    },
    { 
      icon: '🚀', 
      name: t('footprints.cityWanderer'), 
      desc: t('footprints.cityWandererDesc'),
      achieved: total >= 25 
    },
    { 
      icon: '👑', 
      name: t('footprints.culturalAmbassador'), 
      desc: t('footprints.culturalAmbassadorDesc'),
      achieved: total >= 100 
    }
  ];
});

// 按时间排序的足迹
const sortedFootprints = computed(() => {
  return [...footprintsStore.footprints].sort((a, b) => 
    new Date(b.collected_at) - new Date(a.collected_at)
  );
});

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


// 在地图上查看
const viewOnMap = (footprint) => {
  dataStore.filter.category = '';
  dataStore.filter.q = footprint.name;
  router.push('/');
};

// 查看详情
const viewDetails = (siteId) => {
  router.push(`/site/${siteId}`);
};

// 删除足迹
const removeFootprint = async (siteId) => {
  await footprintsStore.removeFootprint(siteId);
};

// 创建彩色图标
const createColoredIcon = (hexColor) => {
  const colorMap = {
    '#FF5733': 'red',
    '#33A1FF': 'blue',
    '#33FF57': 'green',
    '#FF33A1': 'violet'
  };
  
  const leafletColor = colorMap[hexColor] || 'blue';
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${leafletColor}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${leafletColor}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// 初始化地图
const initMap = async () => {
  await nextTick();
  
  const mapContainer = document.getElementById('footprints-map');
  if (!mapContainer || footprintsMap) return;

  footprintsMap = L.map('footprints-map').setView([50.83, 12.92], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(footprintsMap);

  // 添加足迹标记
  footprintsStore.footprints.forEach(footprint => {
    const icon = createColoredIcon(footprint.color);
    const marker = L.marker([footprint.lat, footprint.lon], { icon });
    
    marker.bindPopup(`
      <div style="padding: 5px;">
        <h4 style="margin: 0 0 8px 0; color: ${footprint.color}">${footprint.name}</h4>
        <p style="margin: 4px 0;">${t('footprints.collectedAt')}：${formatDate(footprint.collected_at)}</p>
        <p style="margin: 4px 0;">${t('footprints.collectionDistance')}：${t('footprints.meters', { distance: footprint.distance })}</p>
      </div>
    `);
    
    marker.addTo(footprintsMap);
  });
};

// 监听视图模式变化
watch(viewMode, async (newMode) => {
  if (newMode === 'map') {
    await nextTick();
    setTimeout(initMap, 100);
  }
});

onMounted(async () => {
  footprintsStore.fetchFootprints();
  footprintsStore.fetchStats();
  
  // 如果使用 v-show，在组件挂载时就初始化地图
  if (viewMode.value === 'map') {
    await nextTick();
    setTimeout(initMap, 100);
  }
});

onUnmounted(() => {
  if (footprintsMap) {
    footprintsMap.remove();
    footprintsMap = null;
  }
});

// 刷新地图
const refreshMap = () => {
  if (footprintsMap) {
    setTimeout(() => {
      // 先设置地图容器高度
      const mapContainer = document.getElementById('footprints-map');
      if (mapContainer) {
        mapContainer.style.height = '500px'; // 与 content-area 高度一致
      }
      
      footprintsMap.invalidateSize();
      
      // 如果有足迹，调整视图以包含所有标记
      if (footprintsStore.footprints.length > 0) {
        const bounds = L.latLngBounds(
          footprintsStore.footprints.map(f => [f.lat, f.lon])
        );
        footprintsMap.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 100);
  }
};

// 修改 watch
watch(viewMode, async (newMode) => {
  if (newMode === 'map') {
    await nextTick();
    if (!footprintsMap) {
      setTimeout(initMap, 100);
    } else {
      refreshMap();
    }
  }
});
</script>

<style scoped>
/* 美化所有滚动条 */
.footprints-grid::-webkit-scrollbar,
.timeline-container::-webkit-scrollbar {
  width: 8px;
}

.footprints-grid::-webkit-scrollbar-track,
.timeline-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.footprints-grid::-webkit-scrollbar-thumb,
.timeline-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.footprints-grid::-webkit-scrollbar-thumb:hover,
.timeline-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 内容区域 */
.content-area {
  height: 500px;
  position: relative;
}
.card-view-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 卡片视图 */
.footprints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  padding: 0 10px 20px 0; /* 右侧留出滚动条空间 */
  padding-bottom: 20px; /* 添加底部内边距 */
}

/* 地图容器 - 确保地图视图也有合适的高度 */
.map-container {
  height: 100%;
  min-height: 400px;
  max-height: calc(100vh - 500px);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

/* 时间线容器 */
.timeline-container {
  padding: 20px;
  max-height: calc(100vh - 500px);
  overflow-y: auto;
}

/* 主容器调整 */
.footprints-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 100px); /* 调整整体高度 */
  display: flex;
  flex-direction: column;
}

/* el-card 调整 */
.footprints-container .el-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* el-card__body 调整 */
.footprints-container .el-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}

.footprints-container {
  padding: 20px;
  max-width: 1400px;
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

.subtitle {
  color: #909399;
  font-size: 14px;
}

/* 进度条部分 */
.progress-section {
  margin-bottom: 30px;
}

.progress-header {
  margin-bottom: 10px;
}

.progress-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 勋章部分 */
.medals-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.medals-display {
  display: flex;
  align-items: center;
  gap: 5px;
}

.medal {
  font-size: 2rem;
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.medal-count {
  margin-left: 10px;
  font-size: 18px;
  font-weight: 500;
}

.next-milestone {
  display: flex;
  align-items: center;
}

/* 成就墙 */
.achievements-section {
  margin-bottom: 30px;
}

.achievements-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.achievement-card {
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
  opacity: 0.6;
}

.achievement-card.achieved {
  background: #f0f9ff;
  border-color: #409eff;
  opacity: 1;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.achievement-card.special {
  background: #fef0f0;
  border-color: #fbc4c4;
}

.achievement-card.special.achieved {
  background: #fef0f0;
  border-color: #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.achievement-icon {
  font-size: 2.5rem;
  margin-bottom: 5px;
}

.achievement-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.achievement-progress {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

.achievement-desc {
  color: #909399;
  font-size: 12px;
}

/* 视图切换 */
.view-tabs {
  margin-bottom: 20px;
  text-align: center;
}


.footprint-card {
  transition: transform 0.2s;
}

.footprint-card:hover {
  transform: translateY(-2px);
}

.footprint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.footprint-header h3 {
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
  margin-right: 10px;
}

.footprint-info {
  margin-bottom: 15px;
}

.footprint-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.footprint-info .el-icon {
  color: #909399;
}

.footprint-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 地图容器 */
.map-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

/* 时间线容器 */
.timeline-container {
  padding: 20px;
}

@media (max-width: 768px) {
  .footprints-grid {
    grid-template-columns: 1fr;
  }
  
  .medals-section {
    flex-direction: column;
    gap: 20px;
  }
  
  .achievement-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .footprint-actions {
    flex-direction: column;
  }
  
  .footprint-actions .el-button {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>