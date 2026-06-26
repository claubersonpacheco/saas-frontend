<script setup lang="ts">
import Menu from './Menu.vue';
</script>

<template>
  <aside
    id="hs-application-sidebar"
    class="hs-overlay [--auto-close:lg] hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform w-65 h-full hidden fixed inset-y-0 inset-s-0 z-60 bg-white dark:bg-neutral-800 border-e border-gray-200 dark:border-neutral-700 lg:block lg:translate-x-0 lg:inset-e-auto lg:bottom-0"
    role="dialog"
    tabindex="-1"
    aria-label="Sidebar"
  >
    <Menu />
  </aside>
</template>
