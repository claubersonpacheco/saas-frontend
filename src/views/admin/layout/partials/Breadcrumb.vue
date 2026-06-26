<script setup lang="ts">
import { Menu } from '@lucide/vue';
</script>

<template>
  <div class="-mt-px lg:hidden">
    <div class="sticky top-0 inset-x-0 z-20 bg-white dark:bg-neutral-800 border-y border-gray-200 dark:border-neutral-700 px-4 sm:px-6">
      <div class="flex items-center py-2">
        <button
          type="button"
          class="size-8 flex justify-center items-center gap-x-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="hs-application-sidebar"
          aria-label="Abrir navegación"
          data-hs-overlay="#hs-application-sidebar"
        >
          <Menu class="shrink-0 size-4" />
        </button>

        <ol class="ms-3 flex items-center whitespace-nowrap">
          <li class="flex items-center text-sm text-gray-500 dark:text-neutral-400">
            MiControl
            <span class="mx-3 text-gray-300 dark:text-neutral-600">/</span>
          </li>
          <li class="text-sm font-semibold text-gray-800 dark:text-neutral-200 truncate" aria-current="page">
            <slot name="title">Panel</slot>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
