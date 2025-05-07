<script lang="ts">
	import type { UserProductListEntry } from '../../../(services)/MustAppService';
	import { type ColNames, Cols } from '../Columns';
	import { Rating, TableBodyCell } from 'flowbite-svelte';
	import { AnnotationOutline } from 'flowbite-svelte-icons';
	import { getCellDisplayValue } from './CellValue';

	const ratingColors = ['#FF4545', '#FF653F', '#FF853A', '#FFA534', '#FFC434',
		'#FFE234', '#DBE02F', '#B7DD29', '#87E02B', '#57E32C'];

	const { row, col }: {
		row: UserProductListEntry,
		col: ColNames
	} = $props();
</script>

<!-- max-w and overflow are for the Title ofc - to fit the widest table (Series) with
	an overflowing title without horizontal scrolling;
	it would good to fix the column widths - to not have them change so much on infinite loading and
	list switches. but the datetime columns are locale dependent. -->
<TableBodyCell class="max-w-lg overflow-hidden overflow-ellipsis">
	{@const cellValue = getCellDisplayValue(row, col)}
	{#if col === Cols.HasReview}
		{#if cellValue}
			<AnnotationOutline />
		{/if}
	{:else if col === Cols.Rating}
		{#if cellValue != null}
			<!-- ts static cast here leads to annoying parser error in IDEA, so let's js runtime cast
				https://youtrack.jetbrains.com/issue/WEB-61819/Svelte-5-TypeScript-in-markup-expressions -->
			<!--{@const ratingValue = cellValue as number}-->
			{@const ratingValue = +cellValue}

			{@const ratingColor = ratingColors[ratingValue - 1]}
			<!-- Rating title doesn't show: https://github.com/themesberg/flowbite-svelte/issues/1576 -->
			<Rating total={5} rating={ratingValue / 2} size={20} class="[&>*]:-m-0.5"
			        iconFillColor={ratingColor} iconStrokeColor={ratingColor}
			        title={'' + cellValue} />
		{/if}
	{:else}
		{cellValue}
	{/if}
</TableBodyCell>
