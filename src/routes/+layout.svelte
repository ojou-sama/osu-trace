<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AuthNav from '$lib/components/AuthNav.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>osu! WikiGame</title>
</svelte:head>

<div class="app-shell">
	<header class="site-header">
		<nav class="site-nav" aria-label="Main">
			<a href="/">Home</a>
			<a href="/daily">Daily</a>
			<a href="/solo">Solo</a>
			<a href="/tutti/demo">Tutti</a>
		</nav>

		<AuthNav currentUser={data.currentUser} />
	</header>

	<main class="site-main">
		{@render children()}
	</main>

	<footer class="site-footer">
		<p>osu! WikiGame</p>
	</footer>
</div>
