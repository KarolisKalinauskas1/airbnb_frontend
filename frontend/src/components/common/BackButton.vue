<template>
  <a :href="url" class="back-link" @click="handleClick">
    <span class="back-arrow">←</span>
    <slot>Back</slot>
  </a>
</template>

<script>
export default {
  name: 'BackButton',
  props: {
    url: {
      type: String,
      default: '/campers'
    },
    useRouter: {
      type: Boolean,
      default: false
    }
  },
  methods: {    handleClick(e) {
      e.preventDefault();
      if (this.useRouter) {
        // Use Vue router for navigation
        this.$router.push(this.url);
      } else {
        // For non-router navigation, still use Vue router for internal links
        // but allow direct navigation for external links
        const isExternal = this.url.startsWith('http') || this.url.startsWith('//');
        if (isExternal) {
          window.location.href = this.url;
        } else {
          this.$router.push(this.url);
        }
      }
    }
  }
}
</script>

<style scoped>
/* These styles are a backup in case the global styles in back-button.css aren't loaded */
.back-link {
  display: inline-flex !important; 
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  margin-bottom: 1.5rem;
  cursor: pointer;
  color: #4B5563; /* gray-600 */
}

.back-link:hover {
  color: #111827; /* gray-900 */
}

.back-arrow {
  font-size: 1.25rem;
}
</style>
