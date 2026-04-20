<script lang="ts">
	import { page } from '$app/state';

	let { currentUser } = $props<{ currentUser: App.OsuAuthUser | null }>();

	const loginHref = $derived.by(() => {
		const next = `${page.url.pathname}${page.url.search}`;
		return `/auth/osu/login?next=${encodeURIComponent(next)}`;
	});
</script>

<div class="auth-nav">
	{#if currentUser}
		<a class="auth-profile" href={`/profile/${currentUser.id}`}>
			<img class="auth-avatar" src={currentUser.avatarUrl} alt={`${currentUser.username} avatar`} />
			<span>{currentUser.username}</span>
		</a>

		<form method="POST" action="/auth/osu/logout">
			<button class="auth-logout" type="submit">Log out</button>
		</form>
	{:else}
		<a class="auth-login" href={loginHref}>Log in with osu!</a>
	{/if}
</div>
