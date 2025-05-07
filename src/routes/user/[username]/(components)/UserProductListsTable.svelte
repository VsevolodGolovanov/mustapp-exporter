<script lang="ts">
	import { type UserProductLists } from '../(services)/MustAppService';
	import { Table, TableBody, TableHead } from 'flowbite-svelte';
	import { columns } from './(tableimpl)/Columns';
	import MainRow from './(tableimpl)/(body)/MainRow.svelte';
	import ExpandedRow from './(tableimpl)/(body)/ExpandedRow.svelte';
	import { TableContext } from './(tableimpl)/TableContext.svelte.js';
	import TableControlsHeader from './(tableimpl)/(header)/TableControlsHeader.svelte';
	import ColumnSortHeader from './(tableimpl)/(header)/ColumnSortHeader.svelte';
	import {
		InfiniteStaticDataLoader
	} from './(tableimpl)/(body)/(infiniteloading)/InfiniteStaticDataLoader.svelte.js';
	import InfiniteRowLoading from './(tableimpl)/(body)/(infiniteloading)/InfiniteRowLoading.svelte';
	import { nonNullable } from '$lib/Checks.js';
	import TableInfiniteRowLoadingFooter from './(tableimpl)/(footer)/TableInfiniteRowLoadingFooter.svelte';

	console.log('Initializing UserProductListsTable');

	const { fetchTimestamp, userProductLists }: {
		fetchTimestamp: Date,
		userProductLists: UserProductLists
	} = $props();

	// filters & sorting UI etc. are implemented in respective components, and they also provide their
	// UserProductList transformation functions, but the actual data transformation process is
	// performed and ordered here using those provided functions
	const tableContext = new TableContext(fetchTimestamp, userProductLists);
	TableContext.setCurrent(tableContext);

	let currentColumns = $derived(columns[tableContext.selectedList]);

	let currentUserProductList = $derived(userProductLists[tableContext.selectedList]);

	let currentUserProductListFiltered =
		$derived(tableContext.applyDataTransformationTitleTextFilter!(currentUserProductList));

	let currentUserProductListFilteredSorted =
		$derived(tableContext.applyDataTransformationSort!(currentUserProductListFiltered));

	// even a few hundred rows cause a very noticeable rendering delay and the lists can contain
	// thousands of rows - let's render lazily with infinite loading
	// (TanStack Virtual would be even better: https://tanstack.com/virtual/latest)
	tableContext.infiniteRowLoader =
		new InfiniteStaticDataLoader(() => currentUserProductListFilteredSorted, 50);
</script>

<!-- TODO ugh, easier to calc max-height here, than to "pass it down" from above to make "100%" work... -->
<div id="table-scroll-container" class="relative overflow-y-scroll rounded-md"
     style="max-height: calc(100vh - 14rem)">
	<Table divClass="need-to-override-overflow-here-for-sticky-header-to-work" hoverable={true}>

		<TableHead class="sticky top-0 normal-case" defaultRow={false}>
			<tr class="bg-gray-100 dark:bg-gray-600">
				<th colspan={currentColumns.length}>
					<TableControlsHeader />
				</th>
			</tr>

			<tr>
				{#each currentColumns as col (col)}
					<ColumnSortHeader {col} />
				{/each}
			</tr>
		</TableHead>

		<TableBody>
			{#each nonNullable(tableContext.infiniteRowLoader).infiniteData as row (row)}
				<MainRow {row} />
				<ExpandedRow {row} />
			{/each}

			<InfiniteRowLoading />
		</TableBody>

	</Table>

</div>

<TableInfiniteRowLoadingFooter />
