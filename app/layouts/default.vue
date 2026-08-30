<template>
  <div
    class="flex min-h-screen flex-col bg-odwr-100 font-sans dark:bg-zinc-800"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-odwr-300 focus:px-4 focus:py-2 focus:text-zinc-900"
    >
      メインコンテンツへスキップ
    </a>
    <SiteHeader />
    <main
      id="main-content"
      class="mx-auto w-full max-w-3xl flex-grow px-4 py-8 md:px-0"
    >
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
