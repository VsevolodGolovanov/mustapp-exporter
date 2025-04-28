<script lang="ts">
	import {
		type ListKey,
		listKeys,
		listNames,
		type UserProductListEntry,
		type UserProductLists
	} from '../(services)/MustAppService';
	import {
		Button,
		P,
		Rating,
		Search,
		TabItem,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tabs
	} from 'flowbite-svelte';
	import { ExportService } from '../(services)/ExportService';
	import { AnnotationOutline, DownloadOutline } from 'flowbite-svelte-icons';
	import { debouncer } from '$lib/Utils.svelte';
	import { checkState } from '$lib/Checks';
	import { isBlank } from '$lib/Strings';
	import _ from 'lodash';
	import { slide } from 'svelte/transition';

	console.log('Initializing UserProductListsTable');

	// Svelte advises against using enums here, so just an object
	/** All possible columns. */
	const Cols = {
		Title: 'Title',
		ReleaseDate: 'Release date',
		ModifiedAt: 'Modified',
		Rating: 'Rating',
		HasReview: 'Review',
		Episodes: 'Watched/Released(/Total)'
	} as const;

	type ColNames = typeof Cols[keyof typeof Cols];

	const columns: { [listKey in ListKey]: ColNames[] } = {
		want: [Cols.Title, Cols.ReleaseDate, Cols.ModifiedAt],
		shows: [Cols.Title, Cols.ReleaseDate, Cols.ModifiedAt, Cols.Episodes, Cols.Rating, Cols.HasReview],
		watched: [Cols.Title, Cols.ReleaseDate, Cols.ModifiedAt, Cols.Rating, Cols.HasReview]
	};

	const getCellValue = (row: UserProductListEntry, col: ColNames): string | number | boolean | Date | null | undefined => {
		switch (col) {
			case Cols.Title:
				return row.product.title;
			case Cols.ReleaseDate:
				return row.product.releaseDate;
			case Cols.ModifiedAt:
				return row.userProductInfo.modifiedAt;
			case Cols.Rating:
				return row.userProductInfo.rate;
			case Cols.HasReview:
				return row.userProductInfo.reviewed;
			case Cols.Episodes:
				return row.userProductInfo.userShowInfo.episodesWatched;
			default:
				checkState(false);
		}
	};

	const getCellDisplayValue = (row: UserProductListEntry, col: ColNames): string | number | boolean | null | undefined => {
		switch (col) {
			case Cols.ReleaseDate:
				return row.product.releaseDate?.toLocaleDateString();
			case Cols.ModifiedAt:
				return row.userProductInfo.modifiedAt?.toLocaleString();
			case Cols.Episodes:
				return row.userProductInfo.userShowInfo.episodesWatched
					+ '/' + row.product.itemsReleasedCount
					+ (row.product.itemsReleasedCount != null && row.product.itemsCount != null &&
					row.product.itemsReleasedCount < row.product.itemsCount ? ('/' + row.product.itemsCount) : '');
			default: {
				const cellValue = getCellValue(row, col);
				checkState(!(cellValue instanceof Date));
				return cellValue;
			}
		}
	};

	const getRatingColor = (rating: number) => {
		switch (rating) {
			case 1:
				return '#FF4545';
			case 2:
				return '#FF653F';
			case 3:
				return '#FF853A';
			case 4:
				return '#FFA534';
			case 5:
				return '#FFC434';
			case 6:
				return '#FFE234';
			case 7:
				return '#DBE02F';
			case 8:
				return '#B7DD29';
			case 9:
				return '#87E02B';
			case 10:
				return '#57E32C';
			default:
				throw new Error('Unexpected rating value: ' + rating);
		}
	};

	const { fetchTimestamp, userProductLists }: {
		fetchTimestamp: Date,
		userProductLists: UserProductLists
	} = $props();

	let selectedList = $state<ListKey>(listKeys[0]);
	const selectList = (list: ListKey) => {
		selectedList = list;
	};

	// `<Table filter` and `TableSearch` force their weird markup and aren't debounced, so I'm gonna
	// do my own filter. I don't use `<Table items` anyway, so filtering myself is easy.
	let textFilterInputValue = $state<string>();
	const textFilterAppliedValue = $derived.by(debouncer(() => textFilterInputValue, 300));
	let currentUserProductListFiltered = $derived.by(() => {
		console.log(textFilterAppliedValue ? `Applying text filter "${textFilterAppliedValue}"`
			: 'Resetting text filter');

		const currentUserProductList = userProductLists[selectedList];

		if (textFilterAppliedValue && !isBlank(textFilterAppliedValue)) {
			return currentUserProductList.filter(upl =>
				upl.product.title.toLowerCase().includes(textFilterAppliedValue.toLowerCase()));
		} else {
			return currentUserProductList;
		}
	});

	let sortColumn = $state<ColNames>();
	let sortDirection = $state(true);
	const sort = (col: ColNames) => {
		console.log('Changing sort to/for', col);

		if (sortColumn === col) {
			sortDirection = !sortDirection;
		} else {
			sortColumn = col;
			sortDirection = true;
		}
	};
	let currentUserProductListFilteredSorted = $derived.by(() => {
		if (sortColumn) {
			const sorted = _.sortBy(currentUserProductListFiltered, (row) => getCellValue(row, sortColumn!));
			if (!sortDirection) {
				sorted.reverse();
			}
			return sorted;
		} else {
			return currentUserProductListFiltered;
		}
	});

	// raw, because don't need deep reactivity here, and it prevents using rows for identity
	let expandedRow = $state.raw<object | null>(null);
	const toggleRow = (row: UserProductListEntry) => {
		expandedRow = expandedRow === row ? null : (row.userProductInfo.reviewed ? row : null);
	};

	// casting helper, because casting in-place in markup currently leads to annoying parser errors:
	// https://youtrack.jetbrains.com/issue/WEB-61819/Svelte-5-TypeScript-in-markup-expressions -->
	const castToNumber = (value: ReturnType<typeof getCellDisplayValue>) => {
		return value as number;
	};
</script>

<!-- TODO ugh, easier to calc max-height here for now, rather than to "pass it down" from above... -->
<div id="table-scroll-container" class="relative overflow-y-scroll rounded-md"
     style="max-height: calc(100vh - 11rem)">
	<Table divClass="need-to-override-overflow-here-for-sticky-header-to-work" hoverable={true}>

		<TableHead class="sticky top-0 normal-case" defaultRow={false}>
			<!-- TABLE HEADER: CONTROLS -->
			<tr class="bg-gray-100 dark:bg-gray-600">
				<th colspan={columns[selectedList].length}>
					<div class="px-4 py-2 flex justify-between">
						<!-- LIST SELECTOR -->
						<!-- I use Tabs without content as the input here, because I prefer them to radio
							buttons in this case visually -->
						<Tabs tabStyle="pill" contentClass="hidden" class="tabs flex-none">
							{#each listKeys as listKey (listKey)}
								<TabItem open={selectedList === listKey}
								         title={`${listNames[listKey]} (${userProductLists[listKey].length})`}
								         on:click={() => selectList(listKey)} />
							{/each}
						</Tabs>

						<div class="ml-10">
							<Search bind:value={textFilterInputValue} placeholder="Title search" size="md"
							        class="font-normal" />
						</div>

						<!-- push Search to the left -->
						<div class="grow"></div>

						<!-- EXPORT -->
						<div class="shrink text-right content-center">
							<Button on:click={() => ExportService.export(userProductLists, fetchTimestamp)}>
								<DownloadOutline class="me-2" />
								Export
							</Button>
						</div>
					</div>
				</th>
			</tr>

			<!-- COLUMN HEADERS -->
			<tr>
				{#each columns[selectedList] as col (col)}
					<!-- TODO marked error at `col` - again IDEA's fail here? -->
					{@const
			  hint = selectedList === 'shows' && [Cols.Rating, Cols.HasReview].includes(col) && 'of last watched season'}
					<!-- cancel th padding, add on button instead, so the whole visual header is clickable -->
					<TableHeadCell class="!p-0">
						<!-- borrowed from TableHeadCell.svelte-->
						<button class={['w-full text-left after:absolute after:pl-2 px-6 py-3',
											'hover:bg-gray-200 dark:hover:bg-slate-600',
											sortColumn === col && `after:content-["${sortDirection ? '▲': '▼'}"]`]}
						        onclick={() => sort(col)}>
							<span title={hint ? hint : null}>{col}{hint ? '*' : ''}</span>
						</button>
					</TableHeadCell>
				{/each}
			</tr>
		</TableHead>

		<TableBody>
			{#each currentUserProductListFilteredSorted as row (row)}
				<!-- MAIN ROW -->
				<!-- `<Table hoverable={true}` makes all rows hoverable - let's cancel it out for rows
					without reviews using tailwind-merge (which Flowbite provides and documents). This way
					we don't have to hardcode any background colors, which is nice. -->
				<TableBodyRow on:click={() => toggleRow(row)}
				              class={[!row.userProductInfo.reviewed && 'hover:bg- dark:hover:bg-']}
				              title={row.userProductInfo.reviewed ? 'Click the row to see the review': null}>
					{#each columns[selectedList] as col (col)}
						<!-- max-w and overflow are for the Title ofc - to fit the widest table (Series) with
							an overflowing title without horizontal scrolling -->
						<TableBodyCell class="max-w-lg overflow-hidden overflow-ellipsis">
							{@const cellValue = getCellDisplayValue(row, col)}
							{#if col === Cols.HasReview}
								{#if cellValue}
									<AnnotationOutline />
								{/if}
							{:else if col === Cols.Rating}
								{#if cellValue != null}
									{@const ratingColor = getRatingColor(castToNumber(cellValue))}
									<!-- Rating title doesn't show: https://github.com/themesberg/flowbite-svelte/issues/1576 -->
									<Rating total={5} rating={castToNumber(cellValue) / 2} size={20} class="[&>*]:-m-0.5"
									        iconFillColor={ratingColor} iconStrokeColor={ratingColor}
									        title={'' + cellValue} />
								{/if}
							{:else}
								{cellValue}
							{/if}
						</TableBodyCell>
					{/each}
				</TableBodyRow>

				<!-- EXPANDED ROW (REVIEW) -->
				{#if expandedRow === row}
					<!-- not hoverable (for details see main row above) -->
					<TableBodyRow class="hover:bg- dark:hover:bg-">
						<TableBodyCell colspan={columns[selectedList].length}>
							<div class="flex gap-2" transition:slide|global>
								<div class="flex-none">
									<hr class="w-px h-full border-0 border-l border-gray-200 dark:border-gray-700" />
								</div>
								<div class="flex-1">
									<h4 class="mb-1 font-semibold text-gray-700 dark:text-gray-400">Reviewed
										{selectedList === 'shows' ? 'last watched season' : ''}
										at {row.userProductInfo.review?.reviewedAt?.toLocaleString()}:</h4>
									<P>{row.userProductInfo.review?.body}</P>
								</div>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>

	</Table>
</div>
