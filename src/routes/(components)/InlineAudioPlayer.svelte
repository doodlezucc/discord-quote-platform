<script lang="ts">
	import { useAnimationFrame } from '$lib/components/animation-frame.svelte';
	import Duration from '$lib/components/Duration.svelte';
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
</script>

<div class="audio">
	<IconButton
		icon={audioPaused ? PlayIcon : PauseIcon}
		onclick={() => (audioPaused = !audioPaused)}
	>
		{audioPaused ? 'Play' : 'Pause'}
	</IconButton>

	<span><Duration seconds={currentTime} /></span>

	<div class="progress" style:--progress={currentTime / audioDuration}></div>

	<span><Duration seconds={audioDuration} /></span>

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
	}

	span {
		min-width: 3em;
		text-align: center;
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
		height: 4px;
		border-radius: 4px;
		background: stop-gradient(
			calc(var(--progress) * 100%),
			scheme.color('primary'),
			scheme.color('background')
		);
	}
</style>
