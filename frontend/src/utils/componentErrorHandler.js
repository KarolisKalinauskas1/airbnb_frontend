/**
 * Component Error Handler
 * 
 * Provides utilities for handling errors in component loading and rendering
 */

import { h, onErrorCaptured, ref } from 'vue';

/**
 * Wraps a component with error handling
 * @param {Function} asyncImport - The async import function for the component
 * @param {Object} options - Options for the error handling
 * @returns {Function} A component factory function with error handling
 */
export function withErrorHandling(asyncImport, options = {}) {
  return () => {
    const isLoading = ref(true);
    const loadError = ref(null);
    
    const AsyncComponent = asyncImport().catch(error => {
      console.error('Component loading error:', error);
      loadError.value = error;
      return {
        render() {
          return h('div', { class: 'error-boundary p-4 border border-red-300 bg-red-50 rounded text-red-700' }, [
            h('h3', { class: 'text-lg font-medium' }, 'Failed to load component'),
            h('p', {}, options.fallbackMessage || 'Please try refreshing the page.')
          ]);
        }
      };
    }).finally(() => {
      isLoading.value = false;
    });
    
    return {
      component: AsyncComponent,
      error: loadError,
      loading: isLoading
    };
  };
}

/**
 * Creates an error boundary component
 * @param {Object} childComponent - The component to wrap with error boundary
 * @returns {Object} A Vue component with error handling
 */
export function createErrorBoundary(childComponent) {
  return {
    setup() {
      const error = ref(null);
      
      onErrorCaptured((err) => {
        error.value = err;
        return false; // Prevent error propagation
      });
      
      return () => {
        if (error.value) {
          return h('div', { class: 'error-boundary p-4 border border-red-300 bg-red-50 rounded text-red-700' }, [
            h('h3', { class: 'text-lg font-medium' }, 'Something went wrong'),
            h('p', {}, error.value?.message || 'An unexpected error occurred'),
            h('button', {
              class: 'mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700',
              onClick: () => { error.value = null }
            }, 'Try Again')
          ]);
        }
        
        return h(childComponent);
      };
    }
  };
}

export default {
  withErrorHandling,
  createErrorBoundary
};
