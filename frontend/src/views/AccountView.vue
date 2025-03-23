<template>
  <div>
    <h2>User Profile</h2>
    <LoginBtnComponent />

    <div v-if="!isLoading">
      <pre v-if="isAuthenticated">
        <code>{{ user }}</code>
      </pre>
      <p v-else>Please log in to view your profile.</p>
    </div>
  </div>
</template>

<script setup>
import { useAuth0 } from '@auth0/auth0-vue'
import LoginBtnComponent from '../components/LoginBtnComponent.vue'

const { user, isAuthenticated, isLoading } = useAuth0()
</script>
