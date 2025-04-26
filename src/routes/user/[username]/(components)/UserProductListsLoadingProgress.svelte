<script lang="ts">
	import type { ListDescriptor } from '../+page';
	import type { UserProductListKey } from '../(services)/MustAppService';
	import { Progressbar } from 'flowbite-svelte';

	const { lists, loadingUserProductListsState }: {
		lists: ListDescriptor[],
		loadingUserProductListsState: Record<UserProductListKey, number>
	} = $props();
</script>

{#each lists as list (list.key)}
	{@render loadingList(list)}
{/each}

{#snippet loadingList(list: ListDescriptor)}
	{#if list.key in loadingUserProductListsState}
		<p class="m-4">
			<Progressbar progress={Math.round(100 * loadingUserProductListsState[list.key] / list.entryCount)}
			             labelOutside={`${list.name} (${list.entryCount})`} size="h-4" animate />
		</p>
	{/if}
{/snippet}
