// stores/user.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    authUser: null,
    fullUser: null
  }),
  actions: {
    async fetchAndStoreUser() {
      try {
        const { data } = await supabase.auth.getUser()
        this.authUser = data.user

        if (this.authUser) {
          const res = await axios.get('/api/users/full-info', {
            headers: {
              Authorization: `Bearer ${data.session?.access_token}`
            }
          })
          this.fullUser = res.data
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        if (error.response?.status === 401) {
          this.logout()
        }
      }
    },
    setFullUser(data) {
      this.fullUser = data
    },
    logout() {
      this.authUser = null
      this.fullUser = null
    }
  }
})
