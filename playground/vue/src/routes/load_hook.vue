<script setup lang="ts">
import { use_router } from 'ruta-vue';

const router = use_router();
</script>

<template>
	<h1>Load Hook {{ router.context.load_hook }}</h1>
</template>
