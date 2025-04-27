<script lang="ts">
	import { type ListKey, type ListKeyedObject, listKeys, listNames } from '../(services)/MustAppService';
	import { P, Progressbar } from 'flowbite-svelte';

	const { listCounts, loadingUserProductListsState }: {
		listCounts: ListKeyedObject<number>,
		loadingUserProductListsState: Record<ListKey, number>
	} = $props();
</script>

{#each listKeys as listKey (listKey)}
	{@render loadingList(listKey)}
{/each}

{#snippet loadingList(listKey: ListKey)}
	{#if listKey in loadingUserProductListsState}
		<P class="m-4">
			<!-- TODO why blue text by default in light mode-->
			<Progressbar progress={Math.round(100 * loadingUserProductListsState[listKey] / listCounts[listKey])}
			             labelOutside={`${listNames[listKey]} (${listCounts[listKey]})`} size="h-4" animate />
		</P>
	{/if}
{/snippet}
