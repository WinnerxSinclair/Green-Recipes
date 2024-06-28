<script setup>
import TheHeader from './components/TheHeader.vue'
import { RouterLink, RouterView } from 'vue-router'
import {ref, onMounted} from 'vue'

</script>

<template>
  <div>
 <TheHeader />
</div>
 <router-view></router-view>
</template>

<style scoped>

</style>
