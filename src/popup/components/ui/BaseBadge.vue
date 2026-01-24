<template>
  <span :class="badgeClasses">
    <slot />
    <span v-if="count !== undefined" class="badge-count">{{ formattedCount }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  max?: number;
  dot?: boolean;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  rounded: false
});

const badgeClasses = computed(() => [
  'base-badge',
  `badge-${props.variant}`,
  `badge-${props.size}`,
  {
    'badge-rounded': props.rounded,
    'badge-dot': props.dot
  }
]);

const formattedCount = computed(() => {
  if (props.max && props.count && props.count > props.max) {
    return `${props.max}+`;
  }
  return props.count;
});
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

/* 变体样式 */
.badge-default {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.badge-primary {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.badge-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge-warning {
  background-color: var(--color-warning-light);
  color: #F57C00;
}

.badge-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.badge-info {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

/* 尺寸样式 */
.badge-sm {
  padding: 2px 6px;
  font-size: 10px;
}

.badge-md {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
}

.badge-lg {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
}

/* 圆角样式 */
.badge-rounded {
  border-radius: var(--radius-full);
}

/* 点状徽章 */
.badge-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: var(--radius-full);
}

.badge-dot .badge-count {
  display: none;
}

/* 计数样式 */
.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 10px;
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
}

.badge-dot .badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 14px;
  height: 14px;
  font-size: 9px;
}
</style>
