<template>
  <div ref="containerRef" class="view-selector">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      class="view-selector-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <span class="trigger-icon">
        <component :is="currentViewConfig.icon" />
      </span>
      <span class="trigger-label">{{ currentViewConfig.label }}</span>
      <span class="trigger-chevron" :class="{ 'is-rotated': isOpen }">
        <ChevronDownIcon />
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="view-selector-dropdown" :style="dropdownStyle">
        <div class="dropdown-content">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            class="dropdown-item"
            :class="{ 'is-selected': modelValue === option.value }"
            @click="selectView(option.value)"
          >
            <span class="item-icon">
              <component :is="option.icon" />
            </span>
            <span class="item-label">{{ option.label }}</span>
            <span v-if="modelValue === option.value" class="item-checkmark">
              <CheckIcon />
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ViewType } from '../../common/types/group';
import { t, localeState } from '../../common/i18n';

// Icons
import InboxIcon from './icons/InboxIcon.vue';
import ListIcon from './icons/ListIcon.vue';
import HistoryIcon from './icons/HistoryIcon.vue';
import ChevronDownIcon from './icons/ChevronDownIcon.vue';
import CheckIcon from './icons/CheckIcon.vue';

const props = defineProps<{
  modelValue: ViewType;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ViewType): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement>();
const triggerRef = ref<HTMLButtonElement>();
const dropdownStyle = ref<Record<string, string>>({});

interface ViewOption {
  value: ViewType;
  label: string;
  icon: any;
}

// Static options configuration
const viewOptionsConfig: Omit<ViewOption, 'label'>[] = [
  { value: ViewType.INBOX, icon: InboxIcon },
  { value: ViewType.LISTS, icon: ListIcon },
  { value: ViewType.HISTORY, icon: HistoryIcon },
];

// Reactive view options with translated labels
const viewOptions = computed<ViewOption[]>(() => {
  // Access localeState.locale to trigger reactivity when language changes
  const currentLocale = localeState.locale;
  return viewOptionsConfig.map(opt => ({
    ...opt,
    label: t(`popup.view.${opt.value}`),
  }));
});

const currentViewConfig = computed(() => {
  return viewOptions.value.find(opt => opt.value === props.modelValue) || viewOptions.value[0];
});

function toggleDropdown(): void {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updateDropdownPosition();
  }
}

function selectView(value: ViewType): void {
  emit('update:modelValue', value);
  isOpen.value = false;
}

function updateDropdownPosition(): void {
  if (!triggerRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${triggerRect.bottom + 4}px`,
    left: `${triggerRect.left}px`,
    minWidth: `${triggerRect.width}px`,
  };
}

function handleClickOutside(event: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
    triggerRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});

watch(() => props.modelValue, (newValue) => {
  // Update when modelValue changes externally
});
</script>

<style scoped>
.view-selector {
  position: relative;
  display: inline-block;
}

/* Trigger Button */
.view-selector-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-selector-trigger:hover {
  background-color: var(--bg-hover, #f3f4f6);
}

.view-selector-trigger:active {
  background-color: var(--bg-active, #e5e7eb);
}

.trigger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--text-secondary, #6b7280);
}

.trigger-label {
  line-height: 1;
}

.trigger-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--text-tertiary, #9ca3af);
  transition: transform 0.2s ease;
}

.trigger-chevron.is-rotated {
  transform: rotate(180deg);
}

/* Dropdown Panel */
.view-selector-dropdown {
  position: fixed;
  z-index: 1000;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

[data-theme='dark'] .view-selector-dropdown {
  background-color: #1f2937;
  border-color: #374151;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.dropdown-content {
  padding: 4px;
}

/* Dropdown Items */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.1s ease;
  text-align: left;
}

[data-theme='dark'] .dropdown-item {
  color: #d1d5db;
}

.dropdown-item:hover {
  background-color: #eff6ff;
}

[data-theme='dark'] .dropdown-item:hover {
  background-color: #374151;
}

.dropdown-item.is-selected {
  color: #2563eb;
  background-color: #eff6ff;
}

[data-theme='dark'] .dropdown-item.is-selected {
  color: #60a5fa;
  background-color: #1e3a5f;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.item-label {
  flex: 1;
  line-height: 1;
}

.item-checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: auto;
  color: inherit;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
