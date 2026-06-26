<script setup lang="ts">
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import ResourceManager from '@/components/ResourceManager.vue';
import { resources } from '@/resources';

const config = resources.budgetFilters;
</script>

<template>
  <AdminLayout>
    <template #title>{{ config.title }}</template>
    <ResourceManager :config="config" />
  </AdminLayout>
</template>
