<script lang="ts">
	import { Hr, P, TableBodyCell, TableBodyRow } from 'flowbite-svelte';
	import { columns } from '../Columns';
	import type { UserProductListEntry } from '../../../(services)/MustAppService';
	import { quintInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { TableContext } from '../TableContext.svelte.js';

	const { row }: {
		row: UserProductListEntry
	} = $props();

	const tableContext = TableContext.current();

	tableContext.toggleExpandedRow = (row: UserProductListEntry) => {
		tableContext.expandedRow = tableContext.expandedRow === row ? null : (row.userProductInfo.reviewed ? row : null);
	};
</script>

{#if tableContext.expandedRow === row}
	<!-- not hoverable (for details see main row above) -->
	<TableBodyRow class="hover:bg- dark:hover:bg-">
		<!-- can't transition tr/td, so let's transition a div inside; but then gotta move the
			cell padding to the div for smooth transitions -->
		<TableBodyCell class="p-0" colspan={columns[tableContext.selectedList].length}>
			<div class="px-6 py-4 flex gap-2" transition:slide|global={{easing:quintInOut, duration: 200}}>
				<div class="flex-none">
					<Hr classHr="w-px h-full m-0" />
				</div>
				<div class="flex-1">
					<h4 class="mb-1 font-semibold text-gray-700 dark:text-gray-400">Reviewed
						{tableContext.selectedList === 'shows' ? 'last watched season' : ''}
						at {row.userProductInfo.review?.reviewedAt?.toLocaleString()}:</h4>
					<P>{row.userProductInfo.review?.body}</P>
				</div>
			</div>
		</TableBodyCell>
	</TableBodyRow>
{/if}
