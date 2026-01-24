<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="31.4 31.4"
        />
      </svg>
    </span>
    <span v-if="icon" class="btn-icon">
      <svg v-if="icon === 'add'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <svg v-else-if="icon === 'delete'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      <svg v-else-if="icon === 'sync'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      <svg v-else-if="icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <svg v-else-if="icon === 'search'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <svg v-else-if="icon === 'close'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <svg v-else-if="icon === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else-if="icon === 'folder'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <svg v-else-if="icon === 'more'" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </span>
    <span class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  block?: boolean;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
  rounded: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => [
  'base-button',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  {
    'btn-block': props.block,
    'btn-rounded': props.rounded,
    'btn-loading': props.loading
  }
]);

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
}

.base-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 变体样式 */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-primary:active:not(:disabled) {
  background-color: var(--color-primary-active);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-hover);
}

.btn-danger {
  background-color: var(--color-error);
  color: var(--text-inverse);
}

.btn-danger:hover:not(:disabled) {
  background-color: #E53935;
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-primary);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--bg-hover);
}

.btn-text {
  background-color: transparent;
  color: var(--color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.btn-text:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

/* 尺寸样式 */
.btn-sm {
  height: var(--button-height-sm);
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.btn-md {
  height: var(--button-height-md);
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-base);
  border-radius: var(--radius-md);
}

.btn-lg {
  height: var(--button-height-lg);
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-md);
  border-radius: var(--radius-lg);
}

/* 块级按钮 */
.btn-block {
  width: 100%;
}

/* 圆角按钮 */
.btn-rounded {
  border-radius: var(--radius-full);
}

/* 加载状态 */
.btn-loading {
  cursor: wait;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.btn-spinner svg {
  width: 100%;
  height: 100%;
}

/* 图标样式 */
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon svg {
  width: var(--icon-size-md);
  height: var(--icon-size-md);
}

/* 禁用状态 */
.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
