<template>
  <div class="admin-container">
    <div class="admin-nav">
      <el-menu 
        :default-active="'/admin'" 
        mode="horizontal"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/admin">
          <el-icon><User /></el-icon>
          <span>{{ $t('admin.userManagement') }}</span>
        </el-menu-item>
        <el-menu-item index="/admin/comments">
          <el-icon><ChatLineSquare /></el-icon>
          <span>{{ $t('admin.commentManagement') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <el-card>
      <template #header>
        <h2>{{ $t('admin.userManagement') }}</h2>
      </template>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic :title="$t('admin.statistics.totalUsers')" :value="users.length" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic :title="$t('admin.statistics.activeUsers')" :value="activeUserCount" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic :title="$t('admin.statistics.adminCount')" :value="adminCount" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-statistic :title="$t('admin.statistics.deletedUsers')" :value="deletedUserCount" />
        </el-col>
      </el-row>

      <!-- 用户列表 -->
      <el-table 
        :data="users" 
        v-loading="loading"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="id" :label="$t('admin.table.id')" width="80" />
        <el-table-column prop="username" :label="$t('admin.table.username')" />
        <el-table-column prop="email" :label="$t('admin.table.email')" />
        <el-table-column prop="role" :label="$t('admin.table.role')" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'">
              {{ scope.row.role === 'admin' ? $t('admin.admin') : $t('admin.user') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deleted" :label="$t('admin.status')" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.deleted ? 'danger' : 'success'">
              {{ scope.row.deleted ? $t('admin.deleted') : $t('admin.normal') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.table.location')" width="100">
          <template #default="scope">
            <span v-if="scope.row.current_lat && scope.row.current_lon" :title="$t('admin.located')">
              📍 {{ $t('admin.located') }}
            </span>
            <span v-else style="color: #909399;">
              {{ $t('admin.notLocated') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('admin.table.registeredAt')" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.operations')" width="150" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!scope.row.deleted && scope.row.id !== authStore.userId"
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              {{ $t('admin.delete') }}
            </el-button>
            <span v-else-if="scope.row.id === authStore.userId" class="self-tag">
              {{ $t('admin.self') }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref, computed, onMounted } from 'vue';
import { http } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const users = ref([]);
const loading = ref(false);
const router = useRouter();

// 处理菜单选择
const handleMenuSelect = (index) => {
  router.push(index);
};

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
  const locale = t('locale') === 'zh' ? 'zh-CN' : t('locale') === 'de' ? 'de-DE' : 'en-US';
  return new Date(dateString).toLocaleString(locale);
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await http.get('/users');
    users.value = response.data;
  } catch (error) {
    ElMessage.error(t('admin.fetchError'));
  } finally {
    loading.value = false;
  }
};

// 删除用户
const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      t('admin.deleteConfirm', { username: user.username }),
      t('admin.deleteConfirmTitle'),
      {
        confirmButtonText: t('admin.confirmButtonText'),
        cancelButtonText: t('admin.cancelButtonText'),
        type: 'warning',
      }
    );

    await http.delete(`/users/${user.id}`);
    ElMessage.success(t('admin.deleteSuccess'));
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
.admin-nav {
  margin-bottom: 20px;
}

.admin-container {
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