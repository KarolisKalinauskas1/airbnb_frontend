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
  methods: {
    handleClick(e) {
      if (this.useRouter) {
        e.preventDefault();
        this.$router.push(this.url);
      } else {
        // Let the browser handle the navigation using the href
        window.location.href = this.url;
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
