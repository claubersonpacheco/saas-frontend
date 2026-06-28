<script setup lang="ts">
import {
  Activity,
  Bell,
  Lock,
  LogOut,
  Search,
  User,
} from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { authState, clearSession } from '@/stores/auth';
import { brandingState, resetBranding } from '@/stores/branding';

const router = useRouter();

const initials = computed(() => {
  const source = authState.user?.name || authState.user?.username || 'MC';
  return source
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

function logout() {
  clearSession();
  resetBranding();
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-48 w-full bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 text-sm py-2.5 lg:ps-65">
    <nav class="px-4 sm:px-6 flex basis-full items-center w-full mx-auto">
      <div class="me-5 lg:hidden">
        <RouterLink class="flex-none rounded-md text-xl inline-flex items-center gap-x-2 font-semibold focus:outline-hidden focus:opacity-80" to="/" aria-label="MiControl">
          <span class="app-brand-mark size-8 rounded-lg">
            <img v-if="brandingState.logo" :src="brandingState.logo" :alt="brandingState.name" />
            <span v-else>M</span>
          </span>
          <span class="app-brand-name text-gray-900 dark:text-neutral-100">{{ brandingState.name }}</span>
        </RouterLink>
      </div>

      <div class="w-full flex items-center justify-end ms-auto md:justify-between gap-x-1 md:gap-x-3">
        <div class="hidden md:block">
          <div class="relative">
            <Search class="pointer-events-none absolute left-3.5 top-1/2 z-20 size-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              class="block h-10 w-72 rounded-lg border border-gray-200 bg-white py-0 pl-12 pr-4 text-sm leading-10 text-gray-800 placeholder:text-gray-400 focus:border-primary-600 focus:outline-hidden focus:ring-primary-600 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500"
              placeholder=""
            />
          </div>
        </div>

        <div class="flex flex-row items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Buscar"
            class="md:hidden size-9.5 relative inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Search class="shrink-0 size-4" />
          </button>

          <button
            type="button"
            class="size-9.5 relative inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Bell class="shrink-0 size-4" />
            <span class="sr-only">Notificaciones</span>
          </button>

          <button
            type="button"
            class="size-9.5 relative inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Activity class="shrink-0 size-4" />
            <span class="sr-only">Actividad</span>
          </button>

          <div class="hs-dropdown [--placement:bottom-right] relative inline-flex">
            <button
              id="hs-dropdown-account"
              type="button"
              class="size-9.5 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-800 dark:text-neutral-200 focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label="Cuenta"
            >
              <img
                v-if="authState.user?.photoUrl"
                :src="authState.user.photoUrl"
                :alt="authState.user.name || authState.user.username"
                class="size-9.5 rounded-full object-cover"
              />
              <span v-else class="inline-flex size-9.5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                {{ initials }}
              </span>
            </button>

            <div
              class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-60 bg-white dark:bg-neutral-900 border border-transparent shadow-md rounded-lg mt-2 after:h-4 after:absolute after:-bottom-4 after:inset-s-0 after:w-full before:h-4 before:absolute before:-top-4 before:inset-s-0 before:w-full"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="hs-dropdown-account"
            >
              <div class="py-3 px-5 bg-gray-100 dark:bg-neutral-700 rounded-t-lg">
                <p class="text-sm text-gray-500 dark:text-neutral-400">Conectado como</p>
                <p class="text-sm font-medium text-gray-800 dark:text-neutral-200 truncate">
                  {{ authState.user?.email || authState.user?.username }}
                </p>
              </div>
              <div class="p-1.5 space-y-0.5">
                <RouterLink
                  class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-800"
                  to="/perfil"
                >
                  <User class="shrink-0 size-4" />
                  Perfil
                </RouterLink>
                <RouterLink
                  class="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-800"
                  to="/perfil/password"
                >
                  <Lock class="shrink-0 size-4" />
                  Seguridad
                </RouterLink>
                <button
                  type="button"
                  class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-800"
                  @click="logout"
                >
                  <LogOut class="shrink-0 size-4" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
