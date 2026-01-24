<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="toastClasses">
        <span class="toast-icon">
          <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg v-else-if="type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  duration: 3000
});

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const toastClasses = computed(() => [
  'base-toast',
  `toast-${props.type}`
]);

function show() {
  visible.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = false;
  }, props.duration);
}

function hide() {
  visible.value = false;
  if (timer) clearTimeout(timer);
}

onMounted(() => {
  show();
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

defineExpose({
  show,
  hide
});
</script>

<style scoped>
.base-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 360px;
  z-index: 10000;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-base);
}

/* 过渡动画 */
.toast-enter-active {
  animation: slideInDown var(--transition-base) ease-out;
}

.toast-leave-active {
  animation: fadeOut var(--transition-base) ease-in;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
