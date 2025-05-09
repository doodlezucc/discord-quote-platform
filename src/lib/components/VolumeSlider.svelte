<script lang="ts">
	import { volume } from '$lib/client-state/variables.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import Tooltip from './Tooltip.svelte';

	const MAX_VOLUME = 1.0;

	let isDragging = $state(false);
	let isFocused = $state(false);
	let showTooltip = $derived(isDragging || isFocused);

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'ArrowLeft') {
			ev.preventDefault();
			volume.value = Math.max(volume.value - 0.05, 0);
		} else if (ev.key === 'ArrowRight') {
			ev.preventDefault();
			volume.value = Math.min(volume.value + 0.05, MAX_VOLUME);
		}
	}

	function toPercentage(value: number) {
		return (value * 100).toFixed(0) + '%';
	}
</script>

<Tooltip
	alignment="bottom-center"
	keepVisible={showTooltip}
	tooltip={'Volume: ' + toPercentage(volume.value)}
>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="group"
		tabindex="0"
		onkeydown={onKeyDown}
		onfocus={() => (isFocused = true)}
		onblur={() => (isFocused = false)}
	>
		<Volume2Icon size={20} />
		<Slider
			bind:value={volume.value}
			max={MAX_VOLUME}
			describeValue={toPercentage}
			bind:isDragging
		/>
	</div>
</Tooltip>

<style lang="scss">
	div {
		padding: 4px 0;
		display: flex;
		align-items: center;
		gap: 12px;
		width: 120px;
	}
</style>
