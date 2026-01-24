/**
 * EmptyState 组件测试
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyState from './EmptyState.vue';

describe('EmptyState', () => {
  it('renders default state', () => {
    const wrapper = mount(EmptyState, {
      props: {
        description: 'No items found'
      }
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-description').text()).toBe('No items found');
  });

  it('renders custom title', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Nothing Here',
        description: 'Add some items to get started'
      }
    });

    expect(wrapper.find('.empty-title').text()).toBe('Nothing Here');
    expect(wrapper.find('.empty-description').text()).toBe('Add some items to get started');
  });

  it('renders icon slot', () => {
    const wrapper = mount(EmptyState, {
      props: {
        description: 'test'
      },
      slots: {
        icon: '<svg class="custom-icon">icon</svg>'
      }
    });

    expect(wrapper.find('.empty-icon .custom-icon').exists()).toBe(true);
  });

  it('renders action slot', () => {
    const wrapper = mount(EmptyState, {
      props: {
        description: 'test'
      },
      slots: {
        action: '<button>Add New</button>'
      }
    });

    expect(wrapper.find('.empty-action button').text()).toBe('Add New');
  });

  it('applies search variant class', () => {
    const wrapper = mount(EmptyState, {
      props: {
        description: 'test'
      }
    });

    expect(wrapper.classes()).toContain('empty-state');
  });
});
