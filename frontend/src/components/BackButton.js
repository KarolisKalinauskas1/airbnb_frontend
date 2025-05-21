// Temporary helper component for navigation
export default {
  name: 'BackButton',
  props: {
    to: {
      type: String,
      required: true
    }
  },
  template: `
    <a 
      :href="to" 
      class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
    >
      <span class="text-xl">←</span>
      <slot>Back</slot>
    </a>
  `
}
