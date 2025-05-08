export class Ring<E> {
	private index = 0;

	constructor(private readonly items: E[]) {}

	get length() {
		return this.items.length;
	}

	get currentItem() {
		return this.items[this.index];
	}

	rotate() {
		this.index = (this.index + 1) % this.length;
	}

	removeWhere(predicate: (item: E) => boolean) {
		let i = 0;

		while (i < this.length) {
			const item = this.items[i];
			if (predicate(item)) {
				this.removeAtIndex(i);
			} else {
				i++;
			}
		}
	}

	private removeAtIndex(index: number) {
		this.items.splice(index, 1);
		this.index = this.index % this.length;
	}
}
