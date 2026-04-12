import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
import { EXCLUDE_RELATED_TAGS } from './constants'

export type Post = CollectionEntry<'posts'>
export type EnPost = CollectionEntry<'enPosts'>

const collectionName = (lang: 'ja' | 'en') =>
  lang === 'en' ? ('enPosts' as const) : ('posts' as const)

export const getPublishedPosts = async (lang: 'ja' | 'en' = 'ja') => {
  const posts = await getCollection(collectionName(lang), ({ data }) => {
    return import.meta.env.DEV || !data.draft
  })
  return posts.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  )
}

export const getListablePosts = async (lang: 'ja' | 'en' = 'ja') => {
  const posts = await getPublishedPosts(lang)
  return posts.filter(post => !post.data.unlisted)
}

export const getRelatedPosts = async (
  currentPost: Post,
  max: number = 3
): Promise<Post[]> => {
  const posts = (await getPublishedPosts()) as Post[]
  const currentTags = currentPost.data.tags

  return posts
    .filter(
      post =>
        post.data.slug !== currentPost.data.slug &&
        post.data.tags.some(
          tag =>
            currentTags.includes(tag) && !EXCLUDE_RELATED_TAGS.includes(tag)
        )
    )
    .slice(0, max)
}
