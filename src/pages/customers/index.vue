<script setup lang="ts">
import AppShell from '../../components/AppShell.vue';
import ResourceManager from '../../components/ResourceManager.vue';
import { resources } from '../../resources';

const config = resources.customers;
</script>

<template>
  <AppShell>
    <template #title>{{ config.title }}</template>
    <ResourceManager :config="config" />
  </AppShell>
</template>

