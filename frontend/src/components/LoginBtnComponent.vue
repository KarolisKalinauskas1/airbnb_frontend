<template>
    <div v-if="!isLoading">
        <button v-if="!isAuthenticated" @click="login">Log in</button>
        <button v-else @click="handleLogout">Log out</button>
    </div>
</template>

<script setup>
import { useAuth0 } from '@auth0/auth0-vue'

const { loginWithRedirect, logout, isAuthenticated, isLoading } = useAuth0()

function login() {
  loginWithRedirect()
}

function handleLogout() {
  logout({ returnTo: window.location.origin })
}
</script>