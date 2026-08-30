<script setup lang="ts">
// Vue Routerは同一ルートレコードへの遷移（/page/2 → /page/3）でコンポーネントインスタンスを
// 再利用するため、keyを明示してページ番号ごとに再マウントさせる。これによりuseFetch等が
// 都度フレッシュに実行され、バリデーションもページ遷移のたびに再評価される
// （setup内の一度きりのthrowだと2回目以降のナビゲーションでは再チェックされないため、
// 常に再評価されるvalidateフックを使う）。
definePageMeta({
  key: route => route.fullPath,
  validate: route => {
    const n = Number(route.params.n)
    return Number.isInteger(n) && n >= 2
  },
})

const route = useRoute()
const page = computed(() => Number(route.params.n))
</script>

<template>
  <SiteArticleListPage :page="page" />
</template>
