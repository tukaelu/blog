<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1e293b;
      padding: 64px;
    "
  >
    <p
      style="
        font-size: 64px;
        font-weight: 700;
        font-family: 'Noto Sans JP';
        color: #ffffff;
        text-align: center;
      "
    >
      {{ title }}
    </p>
  </div>
</template>
