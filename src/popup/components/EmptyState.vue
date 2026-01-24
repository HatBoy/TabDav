<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </slot>
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据'
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: var(--text-tertiary);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.empty-description {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  max-width: 280px;
}

.empty-action {
  display: flex;
  gap: var(--spacing-sm);
}

/* 搜索空状态 */
.empty-state.search {
  padding: var(--spacing-xl);
}

.empty-state.search .empty-icon {
  width: 48px;
  height: 48px;
}

.empty-state.search .empty-description {
  color: var(--text-tertiary);
}

/* 网络错误空状态 */
.empty-state.error .empty-icon {
  color: var(--color-warning);
}

/* 暗色模式 */
[data-theme="dark"] .empty-state.search .empty-icon {
  color: var(--text-tertiary);
}
</style>
