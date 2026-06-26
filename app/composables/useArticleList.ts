import type { ArticleSummary, Pagination } from '#shared/types/article'

export function useArticleList(page: number) {
  return useFetch<{ articles: ArticleSummary[]; pagination: Pagination }>(
    '/api/articles',
    {
      query: { page },
    }
  )
}
