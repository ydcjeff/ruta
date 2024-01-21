<script setup lang="ts">
import { use_route } from 'ruta-vue';

const route = use_route();
</script>

<template>
	<h1>param id - {{ route.params.param_id }}</h1>
</template>
