<script lang="ts">
	import { volume } from '$lib/client-state/variables.svelte';
	import { useAnimationFrame } from '$lib/components/animation-frame.svelte';
	import Duration, { convertSecondsToDuration } from '$lib/components/Duration.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';

	interface Props {
		src: string;
	}

	let { src }: Props = $props();

	let inferCurrentTime = $state(false);
	let startTime = $state<number>(0);
	let startTimestamp = $state<number>(0);
	let currentTime = $state<number>(0);

	let audioPaused = $state(true);
	let audioCurrentTime = $state<number>(0);
	let audioDuration = $state<number>(0.01);

	$effect(() => {
		inferCurrentTime = false;
		currentTime = audioCurrentTime;
	});

	function onPlaybackStart() {
		startTime = audioCurrentTime;
		startTimestamp = performance.now();
		inferCurrentTime = true;
	}

	useAnimationFrame(() => {
		if (inferCurrentTime) {
			currentTime = startTime + (performance.now() - startTimestamp) / 1000;
		}
	});

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'ArrowLeft') {
			ev.preventDefault();
			audioCurrentTime = Math.max(audioCurrentTime - 5, 0);
		} else if (ev.key === 'ArrowRight') {
			ev.preventDefault();
			audioCurrentTime = Math.min(audioCurrentTime + 5, audioDuration);
		} else if (ev.key === ' ') {
			ev.preventDefault();
			audioPaused = !audioPaused;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="audio" role="group" aria-label="Audio player" tabindex="0" onkeydown={onKeyDown}>
	<IconButton
		icon={audioPaused ? PlayIcon : PauseIcon}
		onclick={() => (audioPaused = !audioPaused)}
		buttonProps={{ tabindex: -1, 'aria-label': audioPaused ? '' : '' }}
	>
		{audioPaused ? 'Play' : 'Pause'}
	</IconButton>

	<span aria-label="Current playback time"><Duration seconds={currentTime} /></span>

	<Slider
		value={currentTime}
		max={audioDuration}
		describeValue={convertSecondsToDuration}
		onchange={(value) => (audioCurrentTime = value)}
		background="dark"
	/>

	<span aria-label="Sound duration"><Duration seconds={audioDuration} /></span>

	<audio
		{src}
		onplaying={onPlaybackStart}
		bind:paused={audioPaused}
		bind:currentTime={audioCurrentTime}
		bind:duration={audioDuration}
		volume={volume.value}
	></audio>
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.audio {
		display: flex;
		align-items: center;
		background-color: scheme.color('shade-2');
		border-radius: 4px;
		padding-left: 8px;
		padding-right: 4px;
	}

	span {
		min-width: 3em;
		text-align: center;

		/** Account for vertically uncentered digits in font */
		font-size: 17px;
		padding-top: 2px;
	}
</style>
