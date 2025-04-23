import { checkNonNullable } from '$lib/index';

export type FetchFunc = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const currentContext: { fetchFunc?: FetchFunc } = $state({});

/**
 * SvelteKit insists that it's better to use its `fetch` function, not the native one.
 * To avoid having to pass references around, let's keep it in the store.
 */
export class Fetch {
	static set(fetchFunc: FetchFunc): void {
		currentContext.fetchFunc = fetchFunc;
	}

	static get(): FetchFunc {
		checkNonNullable(currentContext.fetchFunc, 'currentContext.fetchFunc');
		return currentContext.fetchFunc;
	}
}
