<script setup lang="ts">
import { onMounted } from 'vue';
import { loadAuthenticatedBranding } from '@/stores/branding';
import Breadcrumb from './partials/Breadcrumb.vue';
import Navigator from './partials/Navigator.vue';
import Sidebar from './partials/Sidebar.vue';

onMounted(() => {
  loadAuthenticatedBranding();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-900">
    <Navigator />

    <Breadcrumb>
      <template #title>
        <slot name="title">Panel</slot>
      </template>
    </Breadcrumb>

    <Sidebar />

    <main class="w-full lg:ps-65">
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div class="hidden lg:block">
          <p class="text-xs font-semibold uppercase text-primary-700 dark:text-primary-300">SaaS Core</p>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
            <slot name="title">Panel</slot>
          </h1>
        </div>

        <slot />
      </div>
    </main>
  </div>
</template>
