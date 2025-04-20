/**
 * Component Error Handling Utilities
 */

/**
 * Wraps a component with error boundaries
 * @param {Function} importFunc - Dynamic import function
 * @returns {Object} Wrapped component with error handling
 */
export function withErrorBoundary(importFunc) {
  return {
    // This is run before the component is actually created
    async setup() {
      try {
        // Try to dynamically import the component
        const module = await importFunc();
        
        // Return the component
        return { component: module.default };
      } catch (error) {
        // Handle import error and show a nice error message
        console.error('Component loading error:', error);
        return {
          render() {
            return h('div', { class: 'error-boundary p-8 bg-red-50 text-red-600 rounded' }, [
              h('h2', { class: 'text-xl font-bold mb-2' }, 'Component Failed to Load'),
              h('p', {}, 'There was an error loading this component. Please try refreshing the page.'),
              h('pre', { class: 'mt-4 p-2 bg-red-100 overflow-auto text-xs' }, error.message)
            ]);
          }
        };
      }
    },
    
    // Render the component or error state
    render() {
      if (this.component) {
        return h(this.component);
      } else {
        return h('div', { class: 'loading p-8 text-center' }, 'Loading...');
      }
    }
  };
}

/**
 * Simple function to check if a Vue component appears to be valid
 * @param {string} componentCode - The component code to check
 * @returns {Object} Result with validity and any errors found
 */
export function validateVueComponent(componentCode) {
  const errors = [];
  
  // Check for common issues:
  // 1. Mismatched template tags
  const templateOpenTags = (componentCode.match(/<template/g) || []).length;
  const templateCloseTags = (componentCode.match(/<\/template>/g) || []).length;
  
  if (templateOpenTags !== templateCloseTags) {
    errors.push(`Mismatched <template> tags: ${templateOpenTags} opening vs ${templateCloseTags} closing`);
  }
  
  // 2. Mismatched script tags
  const scriptOpenTags = (componentCode.match(/<script/g) || []).length;
  const scriptCloseTags = (componentCode.match(/<\/script>/g) || []).length;
  
  if (scriptOpenTags !== scriptCloseTags) {
    errors.push(`Mismatched <script> tags: ${scriptOpenTags} opening vs ${scriptCloseTags} closing`);
  }
  
  // 3. Mismatched style tags
  const styleOpenTags = (componentCode.match(/<style/g) || []).length;
  const styleCloseTags = (componentCode.match(/<\/style>/g) || []).length;
  
  if (styleOpenTags !== styleCloseTags) {
    errors.push(`Mismatched <style> tags: ${styleOpenTags} opening vs ${styleCloseTags} closing`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
