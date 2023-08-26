<script setup lang="ts">
const links = ['/', '/params/123', '/params/456'];
</script>

<template>
	<h1>root layout {{ Date.now() }}</h1>

	<a v-for="l in links" :href="l">{{ l }}</a>

	<slot />
</template>
