<script lang="ts">
	import type { UserProductListEntry, UserProductListKey, UserProductLists } from '../(services)/MustAppService';
	import type { ListDescriptor } from '../+page';
	import { checkNonNullable, checkState } from '$lib';
	import {
		Button,
		Rating,
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

	console.log('Initializing UserProductListsTable');

	// Svelte advises against using enums here, so just an object
	/** All possible columns. */
	const Cols = {
		Name: 'Name',
		ReleaseDate: 'Release date',
		ModifiedAt: 'Modified',
		MovieRating: 'Rating',
		HasMovieReview: 'Review',
		Episodes: 'Watched/Released(/Total)'
	} as const;

	type ColNames = typeof Cols[keyof typeof Cols];

	const columns: { [listKey in UserProductListKey]: ColNames[] } = {
		want: [Cols.Name, Cols.ReleaseDate],
		shows: [Cols.Name, Cols.ReleaseDate, Cols.ModifiedAt, Cols.Episodes],
		watched: [Cols.Name, Cols.ReleaseDate, Cols.ModifiedAt, Cols.MovieRating, Cols.HasMovieReview]
	};

	const getCellValue = (row: UserProductListEntry, col: ColNames): string | number | boolean | null | undefined => {
		switch (col) {
			case Cols.Name:
				return row.product.title;
			case Cols.ReleaseDate:
				return row.product.releaseDate?.toLocaleDateString();
			case Cols.ModifiedAt:
				return row.userProductInfo.modifiedAt?.toLocaleString();
			case Cols.MovieRating:
				return row.userProductInfo.rate;
			case Cols.HasMovieReview:
				return row.userProductInfo.reviewed;
			case Cols.Episodes:
				return row.userProductInfo.userShowInfo.episodesWatched
					+ '/' + row.product.itemsReleasedCount
					+ (row.product.itemsReleasedCount != null && row.product.itemsCount != null &&
					row.product.itemsReleasedCount < row.product.itemsCount ? ('/' + row.product.itemsCount) : '');
			default:
				checkState(false);
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

	const { fetchTimestamp, lists, userProductLists }: {
		fetchTimestamp: Date,
		lists: ListDescriptor[],
		userProductLists: UserProductLists
	} = $props();

	let selectedList = $state<UserProductListKey>(lists[0].key);
	const selectList = (list: UserProductListKey) => {
		selectedList = list;
		expandedRow = null;
	};

	let expandedRow = $state<number | null>(null);
	const toggleRow = (row: UserProductListEntry, idx: number) => {
		expandedRow = expandedRow === idx ? null : (row.userProductInfo.reviewed ? idx : null);
	};

	// casting helper, because casting in-place in markup currently leads to annoying parser errors:
	// https://youtrack.jetbrains.com/issue/WEB-61819/Svelte-5-TypeScript-in-markup-expressions -->
	const castToNumber = (value: ReturnType<typeof getCellValue>) => {
		return value as number;
	};
</script>

{checkNonNullable(selectedList)}

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
						<Tabs tabStyle="pill" contentClass="hidden" class="flex-none">
							{#each lists as list (list.key)}
								<TabItem open={selectedList === list.key} title={`${list.name} (${list.entryCount})`}
								         on:click={() => selectList(list.key)} />
							{/each}
						</Tabs>

						<!-- EXPORT -->
						<div class="flex-shrink text-right content-center">
							<Button on:click={() => ExportService.export(userProductLists, fetchTimestamp)}>
								Export
								<DownloadOutline />
							</Button>
						</div>
					</div>
				</th>
			</tr>

			<!-- COLUMN HEADERS -->
			<tr>
				{#each columns[selectedList] as col (col)}
					<TableHeadCell>{col}</TableHeadCell>
				{/each}
			</tr>
		</TableHead>

		<TableBody>
			{#each userProductLists[selectedList] as row, idx (row)}
				<!-- MAIN ROW -->
				<!-- `<Table hoverable={true}` makes all rows hoverable - let's cancel it out for rows
					without reviews using tailwind-merge (which Flowbite provides and documents). This way
					we don't have to hardcode any background colors, which is nice. -->
				<TableBodyRow on:click={() => toggleRow(row, idx)}
				              class={[!row.userProductInfo.reviewed && 'hover:bg- dark:hover:bg-']}
				              title={row.userProductInfo.reviewed ? 'Click the row to see the review': null}>
					{#each columns[selectedList] as col (col)}
						<!-- max-w and overflow are for the Name ofc -->
						<TableBodyCell class="max-w-lg overflow-hidden overflow-ellipsis">
							{@const cellValue = getCellValue(row, col)}
							{#if col === Cols.HasMovieReview}
								{#if cellValue}
									<AnnotationOutline />
								{/if}
							{:else if col === Cols.MovieRating}
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
				{#if expandedRow === idx}
					<!-- not hoverable (for details see main row above) -->
					<TableBodyRow class="hover:bg- dark:hover:bg-">
						<TableBodyCell colspan={columns[selectedList].length}>
							<div class="flex gap-2">
								<div class="flex-none">
									<hr class="w-px h-full border-0 border-l border-gray-200 dark:border-gray-700" />
								</div>
								<div class="flex-1">
									<h4 class="mb-1 font-semibold text-gray-700 dark:text-gray-400">Reviewed
										at {row.userProductInfo.review?.reviewedAt?.toLocaleString()}:</h4>
									<p class="text-wrap">{row.userProductInfo.review?.body}</p>
								</div>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>

	</Table>
</div>
