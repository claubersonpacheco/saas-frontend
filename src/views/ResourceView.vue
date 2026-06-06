<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import ResourceManager from '../components/ResourceManager.vue';
import { resources } from '../resources';

const route = useRoute();
const config = computed(() => resources[String(route.params.resource)] || resources.users);
</script>

<template>
  <AppShell>
    <template #title>{{ config.title }}</template>
    <ResourceManager :config="config" />
  </AppShell>
</template>
