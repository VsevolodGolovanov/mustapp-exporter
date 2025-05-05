<script lang="ts">
	import { type ColNames, Cols } from '../Columns';
	import { TableContext } from '../TableContext.svelte.js';
	import { TableHeadCell } from 'flowbite-svelte';
	import type { UserProductList } from '../../../(services)/MustAppService';
	import _ from 'lodash';
	import { getCellValue } from '../(body)/CellValue';

	const { col }: {
		col: ColNames
	} = $props();

	const tableContext = TableContext.current();

	// sortColumn and sortDirection are in the TableContext, because they need to be singular per
	// Table, not one for each col

	let hint = $derived(tableContext.selectedList === 'shows' &&
		([Cols.Rating, Cols.HasReview] as ColNames[]).includes(col) && 'of last watched season');

	const sort = (col: ColNames) => {
		if (tableContext.sortColumn === col) {
			tableContext.sortDirection = !tableContext.sortDirection;
		} else {
			tableContext.sortColumn = col;
			tableContext.sortDirection = true;
		}

		console.log('Changing sort to', tableContext.sortColumn,
			tableContext.sortDirection ? 'ascending' : 'descending');
	};

	tableContext.applyDataTransformationSort = (userProductList: UserProductList) => {
		if (tableContext.sortColumn) {
			const sorted = _.sortBy(userProductList, (row) => getCellValue(row, tableContext.sortColumn!));
			if (!tableContext.sortDirection) {
				sorted.reverse();
			}
			return sorted;
		} else {
			return userProductList;
		}
	};
</script>

<!-- cancel th padding, add it to the button instead, so the whole visual header is clickable -->
<TableHeadCell class="!p-0">
	<!-- borrowed from TableHeadCell.svelte-->
	<button class={['w-full text-left after:absolute after:pl-2 px-6 py-3',
										'hover:bg-gray-200 dark:hover:bg-slate-600',
										tableContext.sortColumn === col &&
											`after:content-["${tableContext.sortDirection ? '▲': '▼'}"]`]}
	        onclick={() => sort(col)}>
		<span title={hint || null}>{col}{hint ? '*' : ''}</span>
	</button>
</TableHeadCell>
