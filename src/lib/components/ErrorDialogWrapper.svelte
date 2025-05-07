<script lang="ts" module>
	const CONTEXT_KEY = 'error-dialog';

	interface ErrorDialogProps {
		message: string;
	}

	class ErrorDialogState {
		readonly props: ErrorDialogProps;
		open = $state(true);

		constructor(props: ErrorDialogProps) {
			this.props = props;
		}
	}

	interface ErrorDialogContext {
		showErrorDialog(props: ErrorDialogProps): void;
	}

	export function useErrorDialogs() {
		return getContext<ErrorDialogContext>(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let errorDialogs = $state<ErrorDialogState[]>([]);

	setContext<ErrorDialogContext>(CONTEXT_KEY, {
		showErrorDialog(props) {
			let dialogState = new ErrorDialogState(props);

			errorDialogs.push(dialogState);
		}
	});

	const openDialogs = $derived(errorDialogs.filter((dialog) => dialog.open));

	$effect(() => {
		if (errorDialogs.length > openDialogs.length) {
			errorDialogs = openDialogs;
		}
	});
</script>

{#each errorDialogs as state (state)}
	<Dialog bind:open={state.open} title="Error">
		{state.props.message}
	</Dialog>
{/each}

{@render children()}
