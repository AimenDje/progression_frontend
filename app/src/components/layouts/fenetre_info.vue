<template>
  <div style="flex: 1 1 0; min-height: 0; flex-flow: column;" class="bordure-fenetre d-flex">
    <header class="bordure-titre p-1" v-if="titre">
      <strong>{{ titre }}</strong>
    </header>
    <perfect-scrollbar>
      <slot></slot>
    </perfect-scrollbar>
  </div>
</template>

<script>
export default {
  props: ['titre','codeTest']
}
</script>

<style scoped>
  .bordure-fenetre {
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-top: none;
  }

  .bordure-titre {
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    color: rgba(0, 0, 0, 0.5);
  }

  .ps {
    height: 100%;
  }
</style>