<script lang="ts" module>
	// a larger value with appropriate easing to really smooth out the steps
	export const progressBarTweenDuration = 1000;
</script>

<script lang="ts">
	import { type ListKey, type ListKeyedObject, listKeys, listNames } from '../(services)/MustAppService';
	import { P, Progressbar } from 'flowbite-svelte';
	import { sineOut } from 'svelte/easing';

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
			             labelOutside={`${listNames[listKey]} (${listCounts[listKey]})`} size="h-4" animate
			             classLabelOutside="*:text-black" tweenDuration={progressBarTweenDuration} easing={sineOut} />
		</P>
	{/if}
{/snippet}
