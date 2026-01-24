<template>
  <div :class="wrapperClasses">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-wrapper">
      <span v-if="prefixIcon" class="input-prefix">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <span v-if="suffixIcon" class="input-suffix">
        <svg v-if="suffixIcon === 'close'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <svg v-else-if="suffixIcon === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <button
        v-if="clearable && modelValue"
        type="button"
        class="input-clear"
        @click="handleClear"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <p v-if="error" class="input-error">{{ error }}</p>
    <p v-else-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string | number;
  type?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  error?: string;
  hint?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  required?: boolean;
  maxlength?: number;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
  clearable: false,
  required: false,
  size: 'md'
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const wrapperClasses = computed(() => [
  'base-input',
  {
    'is-disabled': props.disabled,
    'has-error': !!props.error
  }
]);

const inputClasses = computed(() => [
  'base-input-field',
  `input-${props.size}`
]);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function handleBlur(event: FocusEvent) {
  emit('blur', event);
}

function handleFocus(event: FocusEvent) {
  emit('focus', event);
}

function handleClear() {
  emit('update:modelValue', '');
}
</script>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.input-required {
  color: var(--color-error);
  margin-left: 2px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.base-input-field {
  width: 100%;
  height: var(--input-height);
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.base-input-field::placeholder {
  color: var(--text-tertiary);
}

.base-input-field:hover:not(:disabled):not(:read-only) {
  border-color: var(--border-color-focus);
}

.base-input-field:focus:not(:disabled):not(:read-only) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.base-input-field:disabled {
  background-color: var(--bg-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.base-input-field:read-only {
  background-color: var(--bg-secondary);
  cursor: default;
}

/* 尺寸变体 */
.input-sm {
  height: 28px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.input-lg {
  height: 40px;
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-md);
}

/* 前缀和后缀图标 */
.input-prefix,
.input-suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 100%;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.input-prefix svg,
.input-suffix svg {
  width: 16px;
  height: 16px;
}

.input-prefix {
  border-right: 1px solid var(--border-color);
}

.input-suffix {
  border-left: 1px solid var(--border-color);
}

.base-input-field.has-input-prefix {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.base-input-field.has-input-suffix {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

/* 清除按钮 */
.input-clear {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.input-clear:hover {
  color: var(--text-primary);
}

.input-clear svg {
  width: 14px;
  height: 14px;
}

/* 错误状态 */
.has-error .base-input-field {
  border-color: var(--color-error);
}

.has-error .base-input-field:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.input-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.input-hint {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
</style>
