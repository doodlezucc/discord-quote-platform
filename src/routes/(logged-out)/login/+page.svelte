<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<form method="POST" action="?/login">
	<Button buttonProps={{ type: 'submit' }}>Log in with Discord</Button>
</form>
