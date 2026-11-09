import type { Attachment } from 'svelte/attachments';

export interface Deferred {
	readonly isVisible: boolean;
	keepRendered(): void;

	readonly attachment: Attachment;
}

export function useDeferredRendering(): Deferred {
	return new DeferredImpl();
}

class DeferredImpl implements Deferred {
	#persistOnceMounted = false;
	isVisible = $state(false);

	readonly attachment = DeferredImpl.watchForViewportIntersection((isInViewport) => {
		if (!isInViewport && this.#persistOnceMounted) return;

		this.isVisible = isInViewport;
	});

	keepRendered(): void {
		this.#persistOnceMounted = true;
	}

	private static watchForViewportIntersection(onVisible: (visible: boolean) => void): Attachment {
		return (element) => {
			const intersectionObserver = new IntersectionObserver((entries) => {
				const [entry = undefined] = entries;
				if (entry) {
					onVisible(entry.isIntersecting);
				}
			});

			intersectionObserver.observe(element);

			return () => {
				intersectionObserver.disconnect();
			};
		};
	}
}
