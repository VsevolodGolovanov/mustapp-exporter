import { getContext, setContext } from 'svelte';

// this is a workaround for https://github.com/sveltejs/kit/issues/12928

const key = Symbol('layout-snippets');

export function initSnippets<Snippets>(): Snippets {
	const snippets = $state<Snippets>({} as Snippets);
	return setContext(key, snippets);
}

export function setSnippets<Snippets extends object>(snippets: Snippets) {
	const context = getContext<Snippets>(key);
	Object.assign(context, snippets);
}
