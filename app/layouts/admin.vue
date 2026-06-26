<script setup lang="ts">
const route = useRoute()

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="bg-background">
      <div
        class="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3"
      >
        <div class="flex items-center gap-6">
          <span class="font-bold">管理画面</span>
          <nav class="flex items-center gap-1">
            <Button
              as-child
              variant="ghost"
              size="sm"
              :class="isActive('/admin/articles') && 'bg-accent'"
            >
              <NuxtLink to="/admin/articles">記事一覧</NuxtLink>
            </Button>
            <Button
              as-child
              variant="ghost"
              size="sm"
              :class="isActive('/admin/media') && 'bg-accent'"
            >
              <NuxtLink to="/admin/media">メディア</NuxtLink>
            </Button>
          </nav>
        </div>
        <SiteThemeToggle />
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
