<template>
  <div :class="['loading-container', { 'loading-overlay': overlay }]">
    <div class="loading-spinner">
      <svg viewBox="0 0 50 50" class="spinner">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="4"
          class="spinner-path"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="4"
          class="spinner-progress"
          :style="{ strokeDashoffset: strokeDashoffset }"
        />
      </svg>
    </div>
    <div v-if="text" class="loading-text">{{ text }}</div>
    <div v-if="$slots.default" class="loading-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  overlay: false,
  progress: 0
});

const strokeDashoffset = computed(() => {
  if (props.progress > 0) {
    const circumference = 2 * Math.PI * 20; // radius = 20
    return circumference - (props.progress / 100) * circumference;
  }
  return 0;
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-primary);
  z-index: 10;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: rotate 2s linear infinite;
}

.spinner-path {
  stroke: var(--bg-tertiary);
  stroke-linecap: round;
}

.spinner-progress {
  stroke: var(--color-primary);
  stroke-linecap: round;
  stroke-dasharray: 125.6;
  stroke-dashoffset: 125.6;
  transition: stroke-dashoffset 0.3s ease;
}

.loading-spinner.sm .spinner {
  width: 24px;
  height: 24px;
}

.loading-spinner.md .spinner {
  width: 40px;
  height: 40px;
}

.loading-spinner.lg .spinner {
  width: 56px;
  height: 56px;
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
}

.loading-content {
  margin-top: var(--spacing-sm);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 骨架屏变体 */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 脉冲点 */
.loading-dots {
  display: flex;
  gap: var(--spacing-xs);
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
  animation: dot-pulse 1.4s ease-in-out infinite both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes dot-pulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
