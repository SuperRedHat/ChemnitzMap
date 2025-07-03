<template>
  <div class="about-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="hero-title">{{ $t('about.title') }}</h1>
      <p class="hero-subtitle">{{ $t('about.subtitle') }}</p>
    </div>

    <!-- Main Content -->
    <el-container class="content-wrapper">
      <el-main>
        <!-- 项目介绍 -->
        <section class="intro-section">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon :size="24"><InfoFilled /></el-icon>
                <h2>{{ $t('about.intro.title') }}</h2>
              </div>
            </template>
            <p class="intro-text">{{ $t('about.intro.content') }}</p>
            <div class="stats-row">
              <el-statistic 
                :title="$t('about.stats.sites')" 
                :value="siteCount" 
                class="stat-item"
              >
                <template #prefix>
                  <el-icon><Location /></el-icon>
                </template>
              </el-statistic>
              <el-statistic 
                :title="$t('about.stats.categories')" 
                value="4" 
                class="stat-item"
              >
                <template #prefix>
                  <el-icon><Grid /></el-icon>
                </template>
              </el-statistic>
              <el-statistic 
                :title="$t('about.stats.users')" 
                :value="userCount" 
                class="stat-item"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-statistic>
            </div>
          </el-card>
        </section>

        <!-- 功能指南 -->
        <section class="features-section">
          <h2 class="section-title">{{ $t('about.features.title') }}</h2>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="6" v-for="feature in features" :key="feature.key">
              <el-card class="feature-card" shadow="hover">
                <div class="feature-icon">
                  <el-icon :size="40" :color="feature.color">
                    <component :is="feature.icon" />
                  </el-icon>
                </div>
                <h3>{{ $t(`about.features.${feature.key}.title`) }}</h3>
                <p>{{ $t(`about.features.${feature.key}.desc`) }}</p>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <!-- 使用教程 -->
        <section class="tutorial-section">
          <h2 class="section-title">{{ $t('about.howTo.title') }}</h2>
          <el-timeline>
            <el-timeline-item 
              v-for="(step, index) in 5" 
              :key="index"
              :timestamp="`${$t('common.step')} ${index + 1}`"
              placement="top"
              :color="getStepColor(index)"
            >
              <el-card>
                <p>{{ $t(`about.howTo.step${index + 1}`) }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </section>

        <!-- 特色功能展示 -->
        <section class="special-features">
          <h2 class="section-title">{{ $t('about.features.specialModes.title') }}</h2>
          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-card class="mode-card">
                <div class="mode-header">
                  <el-icon :size="30" color="#FF8C00"><Position /></el-icon>
                  <h3>{{ $t('about.features.specialModes.nearbyMode') }}</h3>
                </div>
                <el-image 
                  src="/nearby-mode-demo.png" 
                  fit="cover"
                  :alt="$t('about.features.specialModes.nearbyMode')"
                >
                  <template #placeholder>
                    <div class="image-placeholder">
                      <el-icon :size="50"><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </el-card>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-card class="mode-card">
                <div class="mode-header">
                  <el-icon :size="30" color="#1E90FF"><Van /></el-icon>
                  <h3>{{ $t('about.features.specialModes.tenMinuteCity') }}</h3>
                </div>
                <el-image 
                  src="/ten-minute-demo.png" 
                  fit="cover"
                  :alt="$t('about.features.specialModes.tenMinuteCity')"
                >
                  <template #placeholder>
                    <div class="image-placeholder">
                      <el-icon :size="50"><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </el-card>
            </el-col>
          </el-row>
        </section>

        <!-- 数据来源 -->
        <section class="data-section">
          <el-card>
            <template #header>
              <div class="card-header">
                <el-icon :size="24"><DataAnalysis /></el-icon>
                <h2>{{ $t('about.data.title') }}</h2>
              </div>
            </template>
            <p>{{ $t('about.data.content') }}</p>
            <div class="data-logos">
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">
                <img src="https://wiki.openstreetmap.org/w/images/7/79/Public-images-osm_logo.svg" 
                     alt="OpenStreetMap" 
                     class="data-logo">
              </a>
            </div>
          </el-card>
        </section>

        <!-- 技术栈 -->
        <section class="tech-section">
          <el-card>
            <template #header>
              <div class="card-header">
                <el-icon :size="24"><Cpu /></el-icon>
                <h2>{{ $t('about.tech.title') }}</h2>
              </div>
            </template>
            <div class="tech-grid">
              <div class="tech-category">
                <h4>{{ $t('about.tech.frontend') }}</h4>
                <el-space wrap>
                  <el-tag v-for="tech in frontendTech" :key="tech" type="success">
                    {{ tech }}
                  </el-tag>
                </el-space>
              </div>
              <div class="tech-category">
                <h4>{{ $t('about.tech.backend') }}</h4>
                <el-space wrap>
                  <el-tag v-for="tech in backendTech" :key="tech" type="warning">
                    {{ tech }}
                  </el-tag>
                </el-space>
              </div>
              <div class="tech-category">
                <h4>{{ $t('about.tech.api') }}</h4>
                <el-space wrap>
                  <el-tag v-for="tech in apiTech" :key="tech" type="info">
                    {{ tech }}
                  </el-tag>
                </el-space>
              </div>
            </div>
          </el-card>
        </section>

        <!-- 联系信息 -->
        <section class="contact-section">
          <el-card>
            <template #header>
              <div class="card-header">
                <el-icon :size="24"><Message /></el-icon>
                <h2>{{ $t('about.contact.title') }}</h2>
              </div>
            </template>
            <p>{{ $t('about.contact.content') }}</p>
            <div class="contact-links">
              <el-button 
                type="primary" 
                :icon="Link"
                @click="openApiDocs"
              >
                API {{ $t('common.documentation') }}
              </el-button>
              <el-button 
                :icon="Github"
                @click="openGithub"
              >
                GitHub
              </el-button>
            </div>
          </el-card>
        </section>

        <!-- FAQ -->
        <section class="faq-section">
          <h2 class="section-title">{{ $t('about.faq.title') }}</h2>
          <el-collapse v-model="activeFaq">
            <el-collapse-item 
              v-for="(faq, index) in 5" 
              :key="index"
              :title="$t(`about.faq.q${index + 1}`)"
              :name="index"
            >
              <p>{{ $t(`about.faq.a${index + 1}`) }}</p>
            </el-collapse-item>
          </el-collapse>
        </section>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  InfoFilled, Location, Grid, User, Position, Van, 
  DataAnalysis, Cpu, Message, Link, Picture
} from '@element-plus/icons-vue';
import config from '@/config';

const { t } = useI18n();

// 数据
const siteCount = ref(0);
const userCount = ref(0);
const activeFaq = ref([]);

// 功能特性
const features = [
  { key: 'mapBrowsing', icon: 'Location', color: '#409EFF' },
  { key: 'searchFilter', icon: 'Search', color: '#67C23A' },
  { key: 'userFeatures', icon: 'User', color: '#E6A23C' },
  { key: 'specialModes', icon: 'Position', color: '#F56C6C' }
];

// 技术栈
const frontendTech = ['Vue 3', 'Leaflet', 'Element Plus', 'Vue Router', 'Pinia'];
const backendTech = ['Node.js', 'Express', 'MySQL', 'JWT'];
const apiTech = ['RESTful', 'Swagger', 'JSON'];

// 获取步骤颜色
const getStepColor = (index) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];
  return colors[index];
};

// 打开API文档
const openApiDocs = () => {
  window.open(config.API_DOCS_URL, '_blank');
};

// 打开GitHub
const openGithub = () => {
  window.open('https://github.com/SuperRedHat/ChemnitzMap/', '_blank');
};

// 模拟获取统计数据
onMounted(() => {
  // 这里可以调用API获取真实数据
  setTimeout(() => {
    siteCount.value = 238;
    userCount.value = 156;
  }, 1000);
});
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 20px;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: fadeInDown 0.8s ease;
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  animation: fadeInUp 0.8s ease;
}

/* Content Wrapper */
.content-wrapper {
  max-width: 1200px;
  margin: -40px auto 0;
  padding: 0 20px 40px;
}

/* Section Styles */
section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 2rem;
  color: #303133;
  margin-bottom: 30px;
  text-align: center;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

/* Intro Section */
.intro-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #606266;
  margin-bottom: 30px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

/* Features Section */
.feature-card {
  text-align: center;
  height: 100%;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  margin-bottom: 20px;
}

.feature-card h3 {
  margin: 15px 0;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}

/* Tutorial Section */
.tutorial-section .el-timeline {
  padding-left: 20px;
}

/* Special Features */
.mode-card {
  height: 100%;
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.mode-header h3 {
  margin: 0;
  color: #303133;
}

.image-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

/* Data Section */
.data-logos {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.data-logo {
  height: 60px;
  transition: opacity 0.3s;
}

.data-logo:hover {
  opacity: 0.8;
}

/* Tech Section */
.tech-grid {
  display: grid;
  gap: 30px;
}

.tech-category h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

/* Contact Section */
.contact-links {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* FAQ Section */
.faq-section {
  margin-bottom: 60px;
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .stats-row {
    flex-direction: column;
  }
}

.about-container {
  min-height: 100vh;
  background: #f5f7fa;
  /* 添加以下样式来确保可以滚动 */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 为了确保内容不会被底部遮挡，添加底部内边距 */
.content-wrapper {
  max-width: 1200px;
  margin: -40px auto 0;
  padding: 0 20px 40px;
  /* 添加最小高度，确保内容可以滚动 */
  min-height: calc(100vh - 100px);
}
</style>