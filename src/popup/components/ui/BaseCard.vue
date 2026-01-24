<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
        <div class="card-actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  bordered?: boolean;
  hoverable?: boolean;
  padding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true,
  hoverable: false,
  padding: true
});

const cardClasses = computed(() => [
  'base-card',
  {
    'card-bordered': props.bordered,
    'card-hoverable': props.hoverable,
    'card-no-padding': !props.padding
  }
]);
</script>

<style scoped>
.base-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-bordered {
  border: 1px solid var(--border-color);
}

.card-hoverable {
  transition: all var(--transition-fast);
  cursor: pointer;
}

.card-hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--card-padding);
  border-bottom: 1px solid var(--border-color-light);
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-body {
  padding: var(--card-padding);
}

.card-no-padding .card-body {
  padding: 0;
}

.card-footer {
  padding: var(--card-padding);
  border-top: 1px solid var(--border-color-light);
  background-color: var(--bg-secondary);
}
</style>
