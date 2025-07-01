<template>
  <div class="admin-container">
    <el-card>
      <template #header>
        <h2>用户管理</h2>
      </template>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic title="总用户数" :value="users.length" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic title="活跃用户" :value="activeUserCount" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic title="管理员数" :value="adminCount" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic title="已删除用户" :value="deletedUserCount" />
        </el-col>
      </el-row>

      <!-- 用户列表 -->
      <el-table 
        :data="users" 
        v-loading="loading"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deleted" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.deleted ? 'danger' : 'success'">
              {{ scope.row.deleted ? '已删除' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" width="100">
          <template #default="scope">
            <span v-if="scope.row.current_lat && scope.row.current_lon" title="已设置位置">
              📍 已定位
            </span>
            <span v-else style="color: #909399;">
              未定位
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!scope.row.deleted && scope.row.id !== authStore.userId"
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <span v-else-if="scope.row.id === authStore.userId" class="self-tag">
              本人
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { http } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { ElMessage, ElMessageBox } from 'element-plus';

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(false);

// 计算统计数据
const activeUserCount = computed(() => 
  users.value.filter(u => !u.deleted).length
);

const adminCount = computed(() => 
  users.value.filter(u => u.role === 'admin' && !u.deleted).length
);

const deletedUserCount = computed(() => 
  users.value.filter(u => u.deleted).length
);

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN');
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await http.get('/users');
    users.value = response.data;
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 删除用户
const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作为软删除，用户将无法登录。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await http.delete(`/users/${user.id}`);
    ElMessage.success('删除成功');
    fetchUsers(); // 重新获取用户列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-row {
  margin-bottom: 30px;
}

.self-tag {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .el-table {
    font-size: 12px;
  }
}
</style>