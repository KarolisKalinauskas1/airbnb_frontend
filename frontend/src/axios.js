import axios from 'axios'
import { supabase } from '@/lib/supabase'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
})

// Add auth token to requests
axiosInstance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default axiosInstance