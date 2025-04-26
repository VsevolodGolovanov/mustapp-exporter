<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import type { LayoutSnippets } from '../../+layout.svelte';
	import { ArrowUpRightFromSquareOutline, RefreshOutline } from 'flowbite-svelte-icons';
	import type { UserProductListKey } from './(services)/MustAppService';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { setSnippets } from '$lib/layout-snippets.svelte';
	import _ from 'lodash';
	import type { PageProps } from './$types';
	import { sleep } from '$lib';
	import UserProductListsTable from './(components)/UserProductListsTable.svelte';
	import UserProductListsLoadingProgress from './(components)/UserProductListsLoadingProgress.svelte';

	// tried importing icon  directly like https://flowbite-svelte.com/icons/svelte-5#Faster_compiling shows:
	// import ArrowUpRightFromSquareOutline from 'flowbite-svelte-icons/ArrowUpRightFromSquareOutline.svelte';
	// it works, but IDEA removes the import as "unused" :\

	console.log('Running page script');

	const { data }: PageProps = $props();

	setSnippets<LayoutSnippets>({ layoutHeaderCenter });

	// tracks number of loaded entries per list
	let loadingUserProductListsState = $derived(
		_.mapValues(data.loadingUserProductLists, () => 0) as Record<UserProductListKey, number>);
	$effect(() => {
		if (data.loadingUserProductLists) {
			Object.entries(data.loadingUserProductLists).forEach(([listKey, batches]) => {
				batches.forEach(b => {
					b.then(res => {
						loadingUserProductListsState[listKey as UserProductListKey] += res.length;
						// deriveds are not deeply reactive, so let's clone the object to force a UI update
						loadingUserProductListsState = { ...loadingUserProductListsState };
					});
				});
			});
		}
	});
	// if we just #await for data.userProductLists then the last progress bar never makes it to 100% - so let's wrap
	// data.userProductLists with `all(data.loadingUserProductLists)` + a little sleep
	const loadingUserProductListsAll = $derived(data.loadingUserProductLists
		? Promise.all(Object.values(data.loadingUserProductLists).flat(1)).then(async () => {
			await sleep(300);
			return await data.userProductLists;
		}) : data.userProductLists);
</script>

{#snippet layoutHeaderCenter()}
	<a class="inline-flex place-content-center items-center gap-1 mr-8"
	   href="https://mustapp.com/@{encodeURIComponent(data.username)}" target="_blank">
		User: {data.username}#{data.userId}
		<ArrowUpRightFromSquareOutline class="ml-1" />
	</a>
	Last data fetch: {data.fetchTimestamp.toLocaleString()}
	<Button type="button" class="ml-1" onclick={async () => {
		await goto('?update', { invalidateAll: true });
		replaceState(page.url.pathname, {});
	}}>
		<RefreshOutline class="me-2" />
		Update
	</Button>
{/snippet}

<Card class="min-w-full">
	{#await loadingUserProductListsAll}
		<UserProductListsLoadingProgress lists={data.lists} loadingUserProductListsState={loadingUserProductListsState} />
	{:then userProductLists}
		<UserProductListsTable fetchTimestamp={data.fetchTimestamp} lists={data.lists}
		                       userProductLists={userProductLists} />
	{/await}
</Card>
