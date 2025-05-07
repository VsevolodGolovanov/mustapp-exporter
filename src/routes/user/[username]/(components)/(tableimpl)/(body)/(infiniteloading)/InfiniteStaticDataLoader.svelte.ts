import type { InfiniteEvent } from 'svelte-infinite-loading';

type Options = {
	/**
	 * Automatically reset the `infiniteData` array when the provided data changes. True by default.
	 *
	 * The array should be reset in conjunction with InfiniteLoading's `identifier` value change -
	 * you can set it to `loader.dataProvider()` to achieve this.
	 */
	readonly autoResetOnDataChange?: boolean;
	/**
	 * Immediately preload this amount of batches - without waiting for `handler` to be triggered.
	 * This helps prevent flashes of empty content.
	 *
	 * But it breaks scrollbar resetting to the top when `reset` happens - if the scrollbar was low
	 * enough then after reset it goes to the end of the preloaded content and forces next batch load.
	 * Compensate by doing something like (assuming autoResetOnDataChange):
	 *
	 * ```
	 * 	$effect(() => {
	 * 		infiniteStaticDataLoader.dataProvider(); // react to data changes
	 * 		document.getElementById('your-scroll-container')!.scrollTop = 0;
	 * 	});
	 * 	```
	 */
	readonly preloadBatchCount?: number;
};

/**
 * Implements infinite loading of static data - for when you don't have lazy data fetching, but
 * already have the whole dataset prefetched. It can still be worth using infinite loading, because
 * rendering it all at once can result in a very noticeable delay.
 */
export class InfiniteStaticDataLoader<DATA_ITEM> {
	/**
	 *
	 * @param dataProvider must return complete dataset
	 * @param batchSize how many items should handler load per invocation
	 * @param options see Options
	 */
	constructor(
		readonly dataProvider: () => DATA_ITEM[],
		readonly batchSize: number,
		readonly options?: Options
	) {
		this.options = {
			autoResetOnDataChange: true,
			preloadBatchCount: 1,
			...this.options
		};

		// so that you could simply do `on:infinite={infiniteLoader.handler}`:
		this.handler = this.handler.bind(this);

		if (this.options.autoResetOnDataChange) {
			$effect(() => {
				// 1. "$effect automatically picks up any reactive values ($state, $derived, $props) that
				// are synchronously read inside its function body (including indirectly, via function
				// calls) and registers them as dependencies. When those dependencies change, the $effect
				// schedules a re-run." - so we just need to call `dataProvider`. Perhaps it would be good
				// to also compare that the result actually changed, but let's skip that for now.
				// 2. "An effect only reruns when the object it reads changes, not when a property inside it
				// changes." - good, better don't react to mutations inside data rows (even if changed
				// property affects a filter or sort order?).
				// https://svelte.dev/docs/svelte/$effect
				dataProvider();

				console.log('InfiniteStaticDataLoader auto reset');
				this.reset();
			});
		}

		if (this.options.preloadBatchCount) {
			$effect(() => {
				// this will also trigger on data change, which is good
				const preloadSize = this.options!.preloadBatchCount! * this.batchSize;
				this.infiniteData = dataProvider().slice(0, preloadSize);
			});
		}
	}

	/**
	 * Use this array to render your table rows.
	 *
	 * I don't need deep reactivity, so using raw state for better performance (not that there was a
	 * real problem).
	 */
	infiniteData = $state.raw<DATA_ITEM[]>([]);

	/**
	 * Assign this to `<InfiniteLoading on:infinite`.
	 *
	 * @param loaded
	 * @param complete
	 * @param error
	 */
	handler({ detail: { loaded, complete, error } }: InfiniteEvent) {
		try {
			const start = this.infiniteData.length;
			const data = this.dataProvider();

			if (start < data.length) {
				const end = start + this.batchSize;
				const moreData = data.slice(start, end);
				this.infiniteData = [...this.infiniteData, ...moreData];

				console.log('InfiniteStaticDataLoader#handler loaded items:', this.infiniteData.length);
				loaded();
			} else {
				console.log('InfiniteStaticDataLoader#handler complete, items:', this.infiniteData.length);
				complete();
			}
		} catch (e) {
			console.error(e, 'InfiniteStaticDataLoader#handler error, items:', this.infiniteData?.length);
			error();
		}
	}

	/**
	 * Reset the `infiniteData` array. If the `autoResetOnDataChange` option doesn't work for you.
	 *
	 * The array should be reset in conjunction with InfiniteLoading's `identifier` value change.
	 */
	reset() {
		this.infiniteData = [];
	}

	/**
	 * Load all data at once.
	 */
	loadAll() {
		this.infiniteData = this.dataProvider();
	}
}
