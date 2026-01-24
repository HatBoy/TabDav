<template>
  <span :class="tagClasses" :style="colorStyle">
    <slot />
    <button
      v-if="closable"
      type="button"
      class="tag-close"
      @click.stop="handleClose"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  round?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: false,
  round: true
});

const emit = defineEmits<{
  close: [];
}>();

const tagClasses = computed(() => [
  'base-tag',
  `tag-${props.size}`,
  {
    'tag-round': props.round,
    'tag-closable': props.closable
  }
]);

const colorStyle = computed(() => {
  if (props.color) {
    return {
      '--tag-bg': `${props.color}20`,
      '--tag-color': props.color,
      '--tag-border': `${props.color}40`
    };
  }
  return {};
});

function handleClose() {
  emit('close');
}
</script>

<style scoped>
.base-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--tag-color, var(--text-secondary));
  background-color: var(--tag-bg, var(--bg-tertiary));
  border: 1px solid var(--tag-border, transparent);
  transition: all var(--transition-fast);
}

.tag-round {
  border-radius: var(--radius-full);
}

.tag-sm {
  padding: 2px 6px;
  font-size: 10px;
}

.tag-lg {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}

.tag-closable {
  padding-right: 6px;
}

.tag-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.tag-close:hover {
  opacity: 1;
}

.tag-close svg {
  width: 10px;
  height: 10px;
}
</style>
