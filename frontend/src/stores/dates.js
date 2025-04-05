import { defineStore } from 'pinia'

export const useDatesStore = defineStore('dates', {
  state: () => ({
    startDate: '',
    endDate: ''
  }),
  actions: {
    setDates(startDate, endDate) {
      this.startDate = startDate
      this.endDate = endDate
    }
  },
  persist: true
})
