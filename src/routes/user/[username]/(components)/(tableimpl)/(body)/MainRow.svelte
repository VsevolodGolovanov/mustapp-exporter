<script lang="ts">
	import { TableBodyRow } from 'flowbite-svelte';
	import Cell from './Cell.svelte';
	import { columns } from '../Columns';
	import type { UserProductListEntry } from '../../../(services)/MustAppService';
	import { TableContext } from '../TableContext.svelte.js';
	import { nonNullable } from '$lib/Checks';

	const { row }: {
		row: UserProductListEntry
	} = $props();

	const tableContext = TableContext.current();
</script>

<!-- `<Table hoverable={true}` makes all rows hoverable - let's cancel it out for rows without
	reviews using tailwind-merge (which Flowbite provides and documents). This way we don't have to
	hardcode any background colors, which is nice. -->
<TableBodyRow on:click={() => nonNullable(tableContext.toggleExpandedRow)(row)}
              class={[!row.userProductInfo.reviewed && 'hover:bg- dark:hover:bg-']}
              title={row.userProductInfo.reviewed ? 'Click the row to see the review': null}>
	{#each columns[tableContext.selectedList] as col (col)}
		<Cell {row} {col} />
	{/each}
</TableBodyRow>
