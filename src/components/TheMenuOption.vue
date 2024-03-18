<script setup>
  const props = defineProps({
    word: String,
    bgColor: {
      type: String,
      default: 'rgb(45, 75, 45)'
    }
  })
</script>

<template>
  <div class="flex white pad click" :style="{backgroundColor: props.bgColor}" @click="$emit('menuFunctionX')">
    <slot></slot>
    <div class="flex-c-c help">
      <div>{{ props.word }}</div>
    </div>
  </div>
</template>

<style scoped>
.help{
  width:100%;
}
</style>