<template>
  <header
    class="sticky top-0 z-50 border-b border-zinc-200 py-3 backdrop-blur transition-colors dark:border-zinc-600 dark:bg-zinc-800"
  >
    <div
      class="mx-auto flex max-w-4xl items-center justify-between px-4 md:px-0"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2 hover:underline"
        aria-label="ホームに戻る"
      >
        <img
          src="/assets/tuka-3d.png"
          alt=""
          aria-hidden="true"
          class="h-12 w-12 rounded-full object-cover"
        />
        <span class="text-lg font-bold dark:text-zinc-400">nsymtks.com</span>
      </NuxtLink>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/search"
          class="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >検索</NuxtLink
        >
        <SiteThemeToggle />
      </div>
    </div>
  </header>
</template>
