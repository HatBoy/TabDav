<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`, { 'toast-has-icon': toast.icon }]"
      >
        <div v-if="toast.icon" class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button
          v-if="toast.closable"
          class="toast-close"
          @click="removeToast(toast.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div v-if="toast.progress !== undefined" class="toast-progress">
          <div
            class="toast-progress-bar"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  icon?: boolean;
  closable?: boolean;
  progress?: number;
}

const toasts = ref<ToastItem[]>([]);
let toastId = 0;

/**
 * 添加Toast
 */
function addToast(options: Omit<ToastItem, 'id'>): string {
  const id = `toast-${++toastId}`;
  const toast: ToastItem = {
    id,
    icon: true,
    closable: true,
    duration: 3000,
    ...options
  };

  toasts.value.push(toast);

  // 自动移除
  if (toast.duration && toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  return id;
}

/**
 * 移除Toast
 */
function removeToast(id: string): void {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
}

/**
 * 成功提示
 */
function success(message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>): string {
  return addToast({ type: 'success', message, ...options });
}

/**
 * 错误提示
 */
function error(message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>): string {
  return addToast({ type: 'error', message, ...options });
}

/**
 * 警告提示
 */
function warning(message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>): string {
  return addToast({ type: 'warning', message, ...options });
}

/**
 * 信息提示
 */
function info(message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>): string {
  return addToast({ type: 'info', message, ...options });
}

/**
 * 加载提示
 */
function loading(message: string): { update: (message: string) => void; success: (message?: string) => void; error: (message?: string) => void } {
  const id = addToast({
    type: 'info',
    message,
    icon: true,
    closable: false,
    duration: 0
  });

  return {
    update: (message: string) => {
      const toast = toasts.value.find((t) => t.id === id);
      if (toast) {
        toast.message = message;
      }
    },
    success: (message?: string) => {
      removeToast(id);
      if (message) {
        success(message);
      }
    },
    error: (message?: string) => {
      removeToast(id);
      if (message) {
        error(message);
      }
    }
  };
}

// 暴露方法给全局使用
defineExpose({
  success,
  error,
  warning,
  info,
  loading,
  remove: removeToast
});

// 清理所有toast
onUnmounted(() => {
  toasts.value = [];
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 400px;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-success .toast-icon {
  color: var(--color-success);
}

.toast-error .toast-icon {
  color: var(--color-error);
}

.toast-warning .toast-icon {
  color: var(--color-warning);
}

.toast-info .toast-icon {
  color: var(--color-info);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
}

.toast-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.toast-close:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.toast-close svg {
  width: 14px;
  height: 14px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--bg-tertiary);
}

.toast-progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  width: 100%;
  animation-name: progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 过渡动画 */
.toast-enter-active {
  animation: toast-enter var(--transition-base) ease-out;
}

.toast-leave-active {
  animation: toast-leave var(--transition-base) ease-in;
}

.toast-move {
  transition: transform var(--transition-base);
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toast-leave {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}

/* 暗色模式适配 */
[data-theme="dark"] .toast {
  border: 1px solid var(--border-color);
}
</style>
