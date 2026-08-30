<script setup lang="ts">
import { Trash2Icon } from '@lucide/vue'
import type { Component } from 'vue'

defineProps<{ icon?: Component }>()
defineEmits<{ delete: [] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <component
      :is="icon"
      v-if="icon"
      class="size-4 shrink-0 text-muted-foreground"
    />
    <slot />
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="削除"
      @click="$emit('delete')"
    >
      <Trash2Icon class="size-4" />
    </Button>
  </div>
</template>
