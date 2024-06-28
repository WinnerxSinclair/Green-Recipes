<script setup>
import { defineProps, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const { recipe, linkType } = defineProps({
  recipe: {
    type: Object,
    required: true
  },
  linkType: {
    type: String,
    default: 'default' // 'default' or 'user'
  }
});

const toLink = computed(() => {
  if (linkType === 'user') {
    return `${route.path}/${recipe.slug}`;
  }
  return `/${recipe.slug}`;
});
</script>

<template>
  <div class="rel rc">
    <router-link :to="toLink" class="no-link recipe-card rc">
        <img :src="recipe.image" alt="image of recipe">
        <div class="wrapper flex-c-c">
          <div class="name text-center title">{{ recipe.name }}</div>
        </div>
    </router-link>

    <slot></slot>
  </div>
</template>

<style scoped>

.name{
  color:black;
}

img{
  height: 15rem;
  overflow:none;
  width:100%;
  object-fit:cover;
  border-radius:1rem 1rem 0 0;
}

</style>