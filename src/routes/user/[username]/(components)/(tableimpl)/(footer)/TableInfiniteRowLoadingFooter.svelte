<script lang="ts">
	import { checkNonNullable } from '$lib/Checks';
	import { TableContext } from '../TableContext.svelte';
	import { Spinner } from 'flowbite-svelte';
	import { tick } from 'svelte';

	const tableContext = TableContext.current();

	let renderingAll = $state(false);

	const showAll = async () => {
		renderingAll = true;
		await tick();
		// this tick is not enough to make Spinner show up, even multiple ticks are not enough - but a
		// timeout works
		setTimeout(async () => {
			tableContext.infiniteRowLoader!.loadAll();
			renderingAll = false;
		}, 0);
	};
</script>

{checkNonNullable(tableContext.infiniteRowLoader)}

<div class="mt-4 p-2 rounded-b-md flex gap-4 bg-gray-100 dark:bg-gray-600 text-xs">
	<p>Displaying {tableContext.infiniteRowLoader.infiniteData.length}
		of {tableContext.infiniteRowLoader.dataProvider().length}</p>
	<button type="button" onclick={showAll}
	        class="text-primary-600 dark:text-primary-500 hover:underline">
		Show all
	</button>
	{#if renderingAll}
		<Spinner size={4} />
	{/if}
</div>
