<template>
  <div class="admin-layout">
    <div class="admin-nav">
      <el-menu 
        :default-active="activeMenu" 
        mode="horizontal"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/admin">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/comments">
          <el-icon><ChatLineSquare /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="admin-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 计算当前激活的菜单
const activeMenu = computed(() => {
  return route.path;
});

// 处理菜单选择
const handleMenuSelect = (index) => {
  router.push(index);
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f0f2f5;
}

.admin-nav {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 0 20px;
}

.admin-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>