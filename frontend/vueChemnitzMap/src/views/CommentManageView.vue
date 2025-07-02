<template>
  <div class="comment-manage-container">
    <el-card>
      <template #header>
        <h2>评论管理</h2>
      </template>

      <!-- 批量操作栏 -->
      <div class="batch-actions" v-if="selectedComments.length > 0">
        <el-button type="danger" @click="handleBatchDelete">
          批量删除 ({{ selectedComments.length }})
        </el-button>
        <el-button @click="clearSelection">清除选择</el-button>
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
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="site_name" label="地点" min-width="150">
          <template #default="scope">
            <el-link 
              type="primary" 
              @click="$router.push(`/site/${scope.row.site_id}`)"
            >
              {{ scope.row.site_name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="150">
          <template #default="scope">
            <el-rate 
              :model-value="scope.row.rating" 
              disabled 
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="text" label="评论内容" min-width="200">
          <template #default="scope">
            <el-text line-clamp="2">{{ scope.row.text }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="评论时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.id)"
            >
              删除
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
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px"
      />
    </el-card>
  </div>
</template>

<script setup>
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref, onMounted } from 'vue';
import { fetchAllComments, deleteComment, batchDeleteComments } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const comments = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedComments = ref([]);

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN');
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
    ElMessage.error('获取评论列表失败');
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
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await deleteComment(commentId);
    ElMessage.success('删除成功');
    fetchComments();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedComments.value.length} 条评论吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await batchDeleteComments(selectedComments.value);
    ElMessage.success('批量删除成功');
    clearSelection();
    fetchComments();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
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
.batch-actions {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>