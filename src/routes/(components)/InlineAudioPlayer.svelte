<script lang="ts">
	import { useAnimationFrame } from '$lib/components/animation-frame.svelte';
	import Duration, { convertSecondsToDuration } from '$lib/components/Duration.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
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

	let dragStart = $state<{ rect: DOMRect }>();
	let isDragging = $derived(dragStart !== undefined);

	function inferTimeFromMouse(ev: MouseEvent) {
		if (!dragStart) return;

		const x = ev.clientX - dragStart.rect.left;
		const progress = Math.min(Math.max(x / dragStart.rect.width, 0), 1);
		const newTime = audioDuration * progress;

		audioCurrentTime = newTime;
	}

	function onMouseDown(ev: MouseEvent) {
		ev.preventDefault();

		dragStart = {
			rect: (ev.target as HTMLElement).getBoundingClientRect()
		};

		inferTimeFromMouse(ev);
	}

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

<svelte:window
	onmousemove={isDragging ? inferTimeFromMouse : undefined}
	onmouseup={isDragging ? () => (dragStart = undefined) : undefined}
/>

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

	<div
		class="progress"
		style:--progress={currentTime / audioDuration}
		role="slider"
		tabindex={-1}
		aria-valuetext={convertSecondsToDuration(currentTime)}
		aria-valuenow={currentTime}
		aria-valuemin={0}
		aria-valuemax={audioDuration}
		onmousedown={onMouseDown}
	>
		<div class="handle"></div>
	</div>

	<span aria-label="Sound duration"><Duration seconds={audioDuration} /></span>

	<audio
		{src}
		onplaying={onPlaybackStart}
		bind:paused={audioPaused}
		bind:currentTime={audioCurrentTime}
		bind:duration={audioDuration}
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

	@function stop-gradient($stop-percentage, $color-before, $color-after) {
		@return linear-gradient(
			to right,
			$color-before $stop-percentage,
			$color-after $stop-percentage
		);
	}

	.progress {
		flex: 1;
		position: relative;
		cursor: pointer;
		display: flex;
		align-items: center;
		height: 4px;
		border-radius: 4px;
		background: stop-gradient(
			calc(var(--progress) * 100%),
			scheme.color('primary'),
			scheme.color('background')
		);

		&::after {
			content: '';
			position: absolute;
			padding: 12px 0;
			left: 0;
			width: 100%;
		}

		&:hover .handle {
			opacity: 1;
		}
	}

	.handle {
		pointer-events: none;
		position: absolute;
		left: calc(var(--progress) * 100%);
		transform: translateX(-50%);
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background-color: scheme.color('primary');

		opacity: 0;
		transition: opacity 0.15s;
	}
</style>
