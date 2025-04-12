import Vue from 'vue'
import Router from 'vue-router'
import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'
import BookingSuccessView from './views/BookingSuccessView.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/booking-success',
      name: 'booking-success',
      component: BookingSuccessView
    }
  ]
})