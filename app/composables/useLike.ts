export function useLike(articleId: string, initialCount: number) {
  const likeCount = ref(initialCount)
  const liked = ref(false)
  const pending = ref(false)
  const rateLimited = ref(false)
  const failed = ref(false)

  async function like() {
    if (pending.value || liked.value) return
    pending.value = true
    rateLimited.value = false
    failed.value = false
    try {
      const res = await $fetch<{ likeCount: number; liked: boolean }>(
        `/api/articles/${articleId}/like`,
        {
          method: 'POST',
        }
      )
      likeCount.value = res.likeCount
      liked.value = res.liked
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 429) {
        rateLimited.value = true
      } else {
        // ネットワークエラーや5xx等。何も表示しないとクリックが効いたのか
        // 分からなくなるため、汎用の失敗状態として表面化させる
        failed.value = true
      }
    } finally {
      pending.value = false
    }
  }

  return { likeCount, liked, pending, rateLimited, failed, like }
}
