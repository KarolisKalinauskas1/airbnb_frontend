// stores/user.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    authUser: null,
    fullUser: null
  }),
  actions: {
    async fetchAndStoreUser() {
      const { data } = await supabase.auth.getUser()
      this.authUser = data.user

      if (this.authUser) {
        const res = await axios.get(`/api/users/full-info/${this.authUser.id}`)
        this.fullUser = res.data
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
