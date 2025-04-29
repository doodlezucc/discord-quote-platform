import { onMount } from 'svelte';

export function useAnimationFrame(onTick: () => void) {
	let animationFrameRequest = $state<number>();

	function tick() {
		animationFrameRequest = requestAnimationFrame(tick);
		onTick();
	}

	onMount(() => {
		tick();

		return () => {
			if (animationFrameRequest !== undefined) {
				cancelAnimationFrame(animationFrameRequest);
			}
		};
	});
}
