import { untrack } from 'svelte';

type TickListener = () => void;

export function useAnimationFrameConditional(condition: () => boolean, onTick: TickListener) {
	const isConditionMet = $derived(condition());

	// This effect only triggers when the RESULT of condition() toggles.
	$effect(() => {
		if (isConditionMet) {
			return untrack(() => {
				let isExitingLoop = false;

				function tick() {
					if (!isExitingLoop) {
						requestAnimationFrame(tick);
					}

					onTick();
				}

				requestAnimationFrame(tick);
				onTick();

				return () => {
					isExitingLoop = true;
				};
			});
		}
	});
}
