<template>
  <div class="admin-container">
    <div class="admin-nav">
      <el-menu 
        :default-active="'/admin/comments'" 
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
        <h2>{{ $t('admin.commentManagement') }}</h2>
      </template>

      <!-- 批量操作栏 -->
      <div class="batch-actions" v-if="selectedComments.length > 0">
        <el-button type="danger" @click="handleBatchDelete">
          {{ $t('admin.batchDelete', { count: selectedComments.length }) }}
        </el-button>
        <el-button @click="clearSelection">{{ $t('admin.clearSelection') }}</el-button>
      </div>

      <!-- 评论表格 -->
      <el-table
        :data="comments"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" :label="$t('admin.commenter')" width="120" />
        <el-table-column prop="site_name" :label="$t('admin.site')" min-width="150">
          <template #default="scope">
            <el-link 
              type="primary" 
              @click="$router.push(`/site/${scope.row.site_id}`)"
            >
              {{ scope.row.site_name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="rating" :label="$t('admin.rating')" width="150">
          <template #default="scope">
            <el-rate 
              :model-value="scope.row.rating" 
              disabled 
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="text" :label="$t('admin.content')" min-width="200">
          <template #default="scope">
            <el-text line-clamp="2">{{ scope.row.text }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('admin.commentTime')" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.operations')" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.id)"
            >
              {{ $t('admin.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        :layout="`total, sizes, prev, pager, next, jumper`"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchAllComments, deleteComment, batchDeleteComments } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const comments = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedComments = ref([]);

// 处理菜单选择
const handleMenuSelect = (index) => {
  router.push(index);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const locale = t('locale') === 'zh' ? 'zh-CN' : t('locale') === 'de' ? 'de-DE' : 'en-US';
  return new Date(dateString).toLocaleString(locale);
};

// 获取评论列表
const fetchComments = async () => {
  loading.value = true;
  try {
    const data = await fetchAllComments({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    comments.value = data.comments;
    total.value = data.total;
  } catch (error) {
    ElMessage.error(t('admin.fetchCommentsError'));
  } finally {
    loading.value = false;
  }
};

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedComments.value = selection.map(item => item.id);
};

// 清除选择
const clearSelection = () => {
  selectedComments.value = [];
};

// 删除单个评论
const handleDelete = async (commentId) => {
  try {
    await ElMessageBox.confirm(t('comment.deleteConfirm'), t('admin.deleteConfirmTitle'), {
      confirmButtonText: t('admin.confirmButtonText'),
      cancelButtonText: t('admin.cancelButtonText'),
      type: 'warning',
    });

    await deleteComment(commentId);
    ElMessage.success(t('comment.deleteSuccess'));
    fetchComments();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('admin.deleteError'));
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('admin.batchDeleteConfirm', { count: selectedComments.value.length }),
      t('admin.batchDeleteConfirmTitle'),
      {
        confirmButtonText: t('admin.confirmButtonText'),
        cancelButtonText: t('admin.cancelButtonText'),
        type: 'warning',
      }
    );

    await batchDeleteComments(selectedComments.value);
    ElMessage.success(t('admin.batchDeleteSuccess'));
    clearSelection();
    fetchComments();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('admin.batchDeleteError'));
    }
  }
};

// 分页大小改变
const handleSizeChange = () => {
  currentPage.value = 1;
  fetchComments();
};

// 当前页改变
const handleCurrentChange = () => {
  fetchComments();
};

onMounted(() => {
  fetchComments();
});
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-nav {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>