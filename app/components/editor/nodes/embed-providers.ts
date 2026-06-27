import { CameraIcon, GitBranchIcon, SquarePlayIcon, XIcon } from '@lucide/vue'

// GitHub/YouTube/X/Instagramの埋め込み（architecture.md §4.2）。
// provider は挿入時にツールバー側で固定し、ノード自体では自動判定しない。
export const embedProviders = [
  { provider: 'github', label: 'GitHub埋め込み', icon: GitBranchIcon },
  { provider: 'youtube', label: 'YouTube埋め込み', icon: SquarePlayIcon },
  { provider: 'x', label: 'X埋め込み', icon: XIcon },
  { provider: 'instagram', label: 'Instagram埋め込み', icon: CameraIcon },
] as const
