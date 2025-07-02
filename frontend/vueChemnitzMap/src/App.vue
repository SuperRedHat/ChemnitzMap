<script setup>
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useFootprintsStore } from '@/stores/footprintsStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const footprintsStore = useFootprintsStore();
const router = useRouter();

// 初始化时检查用户登录状态
onMounted(async () => {
  await authStore.fetchCurrentUser();
  if (authStore.isAuthenticated) {
    await favoritesStore.fetchFavorites();
  }
});

// 处理用户菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'favorites':
      router.push('/favorites');
      break;
    case 'admin':
      router.push('/admin');
      break;
    case 'logout':
      authStore.logout();
      favoritesStore.clearFavorites();
      router.push('/');
      break;
  }
};
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>Chemnitz Cultural Map</h1>
      <nav>
        <router-link to="/">地图</router-link>
        <router-link to="/about">关于</router-link>
        
        <!-- 用户菜单 -->
        <div class="user-menu">
          <template v-if="authStore.isAuthenticated">
            <el-dropdown @command="handleCommand" trigger="click">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ authStore.username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile" icon="User">
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="favorites" icon="Star">
                    我的收藏
                  </el-dropdown-item>
                  <el-dropdown-item 
                    v-if="authStore.isAdmin" 
                    command="admin" 
                    icon="Setting"
                    divided
                  >
                    管理后台
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" icon="SwitchButton" divided>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          
          <template v-else>
            <router-link to="/login" class="auth-link">登录</router-link>
            <router-link to="/register" class="auth-link">注册</router-link>
          </template>
        </div>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #42b883;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.app-header a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.app-header a:hover,
.app-header a.router-link-active {
  background: rgba(255,255,255,0.2);
}

.user-menu {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: 1rem;
}

.user-info {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-info:hover {
  background: rgba(255,255,255,0.2);
}

.auth-link {
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem !important;
}

.auth-link:hover {
  background: rgba(255,255,255,0.3) !important;
}

.app-main {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .app-header h1 {
    font-size: 1.2rem;
  }
  
  .app-header nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>