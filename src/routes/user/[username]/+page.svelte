<script lang="ts">
	import { Button, Card, P } from 'flowbite-svelte';
	import type { LayoutSnippets } from '../../+layout.svelte';
	import { ArrowUpRightFromSquareOutline, RefreshOutline, UserSolid } from 'flowbite-svelte-icons';
	import { type ListKey, listKeys } from './(services)/MustAppService';
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

	// #######################################################
	// ### This page file handles loading of Must userdata ###
	// #######################################################

	console.log('Running page script');

	const { data }: PageProps = $props();

	setSnippets<LayoutSnippets>({ layoutHeaderCenter });

	// #await-triggering load doesn't happen fast enough when clicking the "Update" button, so it's
	// easy to double-click the button and start a double-load - let's compensate with this additional
	// state (alternatively could use _.throttle, but it's also faster visual feedback with the state)
	let loading = $state(false);

	// tracks number of loaded entries per list
	let loadingUserProductListsState = $derived(_.fromPairs(listKeys.map(lk => [lk, 0])) as Record<ListKey, number>);
	$effect(() => {
		data.userdata.then(fetchedUserdata => {
			if (fetchedUserdata.loadingUserProductLists) {
				Object.entries(fetchedUserdata.loadingUserProductLists).forEach(([listKey, batches]) => {
					batches.forEach(b => {
						b.then(res => {
							loadingUserProductListsState[listKey as ListKey] += res.length;
							// deriveds are not deeply reactive, so let's clone the object to force a UI update
							loadingUserProductListsState = { ...loadingUserProductListsState };
						});
					});
				});
			}
		});
		return () => {
			loadingUserProductListsState = _.fromPairs(listKeys.map(lk => [lk, 0])) as Record<ListKey, number>;
		};
	});
	// if we just #await for data.userProductLists then the last progress bar never makes it to 100% - so let's delay the
	// resolve a little bit
	const loadingUserProductListsDelayed = $derived(data.userdata.then(async fetchedUserdata => {
		const fetchedUserProductLists = await fetchedUserdata.userProductLists;
		await sleep(300);
		loading = false;
		return fetchedUserProductLists;
	}));

	// working around `[plugin vite-plugin-svelte] Not implemented TSTypeCastExpression` when
	// specifying `boolean` or other primitive parameter type in snippet arguments
	// TODO report snippet arg type issue
	type booleanType = boolean;
</script>

{#snippet layoutHeaderCenter()}
	<a class="flex place-content-center place-items-center gap-1 mr-8"
	   href="https://mustapp.com/@{encodeURIComponent(data.username)}" target="_blank">
		<UserSolid />{data.username}
		<ArrowUpRightFromSquareOutline class="ml-1" />
	</a>
	{#await data.userdata.then(async () => await loadingUserProductListsDelayed)}
		{@render userdata(true)}
		<!-- TODO report issue: avoiding intentionally unused variable warning-->
		<!--eslint-disable-next-line-->
	{:then fetchedUserdata}
		{@render userdata(loading)}
	{/await}
{/snippet}

{#snippet userdata(loadingArg: booleanType)}
	Last data fetch: {data.fetchTimestamp.toLocaleString()}
	<!-- Flowbite disables inputs with opacity, so let's do the same:
		https://flowbite-svelte.com/docs/components/forms#Disabled -->
	<Button type="button" class={['ml-2 disabled:opacity-50']} disabled={loadingArg}
	        onclick={async () => {
						loading = true;
						await goto('?update', { invalidateAll: true });
						replaceState(page.url.pathname, {});
					}}>
		<!-- TODO report Flowbite icon type issue: `Svelte: Type (string | false)[] is not assignable to type string`-->
		<!-- it works at runtime, but let's join to work around the IDE error -->
		<RefreshOutline class={['me-2', loadingArg && 'animate-spin'].join(' ')} />
		Update
	</Button>
{/snippet}

<Card class="min-w-full">
	{#await data.userdata}
		<span>
			<RefreshOutline class="inline-block animate-spin" />
			<span class="ml-2 align-middle">Loading user data...</span>
		</span>
	{:then fetchedUserdata}
		{#await loadingUserProductListsDelayed}
			<UserProductListsLoadingProgress listCounts={fetchedUserdata.listCounts}
			                                 loadingUserProductListsState={loadingUserProductListsState} />
		{:then userProductLists}
			{#if fetchedUserdata.profilePrivate}
				<P>Failed to fetch data - the profile is private.</P>
			{:else}
				<UserProductListsTable fetchTimestamp={data.fetchTimestamp} userProductLists={userProductLists} />
			{/if}
		{/await}
	{:catch err}
		<!-- handles "user not found" error from MustAppService#getProfile -->
		<P>
			{err.body?.message ?? `Unexpected error: ${err}`}
		</P>
	{/await}
</Card>
