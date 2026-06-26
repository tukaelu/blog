<script setup lang="ts">
function toggleTheme() {
  const root = document.documentElement
  if (root.classList.contains('dark')) {
    root.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  } else {
    root.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }
}
</script>

<template>
  <button
    type="button"
    aria-label="テーマ切替"
    class="group p-2 transition"
    @click="toggleTheme"
  >
    <svg
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="h-6 w-6 fill-orange-300 stroke-zinc-500 transition group-hover:fill-orange-400 group-hover:stroke-zinc-700 dark:hidden"
    >
      <path
        d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z"
      />
      <path
        d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061"
        fill="none"
      />
    </svg>
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="hidden h-6 w-6 fill-yellow-400 stroke-yellow-500 transition dark:block dark:group-hover:stroke-zinc-400 dark:group-hover:fill-yellow-300"
    >
      <path
        d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
