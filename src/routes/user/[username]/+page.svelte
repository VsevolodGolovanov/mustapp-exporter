<script lang="ts">
	import {
		Button,
		Card,
		Progressbar,
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
	import type { LayoutSnippets } from '../../+layout.svelte';
	import { AnnotationOutline, ArrowUpRightFromSquareOutline, DownloadOutline } from 'flowbite-svelte-icons';
	import type { UserProductListEntry, UserProductListKey, UserProductLists } from './MustAppService';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { setSnippets } from '$lib/layout-snippets.svelte';
	import _ from 'lodash';
	import type { PageProps } from './$types';
	import { checkNonNullable, sleep } from '$lib';
	import type { ListDescriptor } from './+page';

	// tried importing icon  directly like https://flowbite-svelte.com/icons/svelte-5#Faster_compiling shows:
	// import ArrowUpRightFromSquareOutline from 'flowbite-svelte-icons/ArrowUpRightFromSquareOutline.svelte';
	// it works, but IDEA removes the import as "unused" :\

	console.log('Running page script');

	// Svelte advises against using enums here, so just an object
	/** All possible columns. */
	const Cols = {
		Name: 'Name',
		ReleaseDate: 'Release date',
		Modified: 'Modified',
		Rating: 'Rating',
		Review: 'Review',
		Watched: 'Watched/Released(/Total)'
	} as const;

	type ColValues = typeof Cols[keyof typeof Cols];

	const columns: { [listKey in UserProductListKey]: ColValues[] } = {
		want: [Cols.Name, Cols.ReleaseDate],
		shows: [Cols.Name, Cols.ReleaseDate, Cols.Modified, Cols.Rating, Cols.Review, Cols.Watched],
		watched: [Cols.Name, Cols.ReleaseDate, Cols.Modified, Cols.Rating, Cols.Review]
	};

	const getCellValue = (row: UserProductListEntry, col: ColValues): string | number | boolean | null | undefined => {
		switch (col) {
			case Cols.Name:
				return row.product.title;
			case Cols.ReleaseDate:
				return row.product.releaseDate?.toLocaleDateString();
			case Cols.Modified:
				return row.userProductInfo.modifiedAt?.toLocaleString();
			case Cols.Rating:
				return row.userProductInfo.rate;
			case Cols.Review:
				return row.userProductInfo.reviewed;
			case Cols.Watched:
				return row.userProductInfo.userShowInfo.episodesWatched
					+ '/' + row.product.itemsReleasedCount
					+ (row.product.itemsReleasedCount != null && row.product.itemsCount != null &&
					row.product.itemsReleasedCount < row.product.itemsCount ? ('/' + row.product.itemsCount) : '');
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

	const { data }: PageProps = $props();

	setSnippets<LayoutSnippets>({ layoutHeaderCenter });

	let selectedList = $state<UserProductListKey>(data.lists[0].key);
	const selectList = (list: UserProductListKey) => {
		selectedList = list;
		expandedRow = null;
	};

	let expandedRow = $state<number | null>(null);
	const toggleRow = (row: UserProductListEntry, idx: number) => {
		expandedRow = expandedRow === idx ? null : (row.userProductInfo.reviewed ? idx : null);
	};

	let loadingUserProductListsState = $derived(
		_.mapValues(data.loadingUserProductLists, () => 0) as Record<UserProductListKey, number>);
	$effect(() => {
		if (data.loadingUserProductLists) {
			Object.entries(data.loadingUserProductLists).forEach(([listKey, batches]) => {
				batches.forEach(b => {
					b.then(res => {
						loadingUserProductListsState[listKey as UserProductListKey] += res.length;
						// deriveds are not deeply reactive, so let's clone the object to force a UI update
						loadingUserProductListsState = { ...loadingUserProductListsState };
					});
				});
			});
		}
	});
	// if we just #await for data.userProductLists then the last progress bar never makes it to 100% - so let's wrap
	// data.userProductLists with `all(data.loadingUserProductLists)` + a little sleep
	const loadingUserProductListsAll = $derived(data.loadingUserProductLists
		? Promise.all(Object.values(data.loadingUserProductLists).flat(1)).then(async () => {
			await sleep(300);
			return await data.userProductLists;
		}) : data.userProductLists);

	// casting helper, because casting in-place in markup currently leads to annoying parser errors:
	// https://youtrack.jetbrains.com/issue/WEB-61819/Svelte-5-TypeScript-in-markup-expressions -->
	const castToNumber = (value: ReturnType<typeof getCellValue>) => {
		return value as number;
	};
</script>

{#snippet layoutHeaderCenter()}
	<a class="inline-flex place-content-center items-center gap-1 mr-4"
	   href="https://mustapp.com/@{encodeURIComponent(data.username)}" target="_blank">
		User: {data.username}#{data.userId}
		<ArrowUpRightFromSquareOutline />
	</a>
	Last data fetch: {data.fetchTimestamp.toLocaleString()}
	<Button type="button" onclick={async () => {
		await goto('?update', { invalidateAll: true });
		replaceState(page.url.pathname, {});
	}}>Update
	</Button>
{/snippet}

<Card class="min-w-full">
	{#await loadingUserProductListsAll}
		{@render loading()}
	{:then userProductLists}
		{@render table(userProductLists)}
	{/await}
</Card>

{#snippet loading()}
	{#each data.lists as list (list.key)}
		{@render loadingList(list)}
	{/each}
{/snippet}

{#snippet loadingList(list: ListDescriptor)}
	{#if list.key in loadingUserProductListsState}
		<p class="m-4">
			<Progressbar progress={Math.round(100 * loadingUserProductListsState[list.key] / list.entryCount)}
			             labelOutside={list.name} size="h-4" animate />
		</p>
	{/if}
{/snippet}

{#snippet table(userProductLists: UserProductLists)}
	{checkNonNullable(selectedList)}

	<!-- TODO ugh, easier to calc max-height here for now, rather than to "pass it down" from above... -->
	<div id="table-scroll-container" class="relative overflow-y-scroll rounded-md"
	     style="max-height: calc(100vh - 11rem)">
		<Table divClass="need-to-override-overflow-here-for-sticky-header-to-work">

			<TableHead class="sticky top-0 normal-case" defaultRow={false}>
				<!-- TABLE HEADER: CONTROLS -->
				<tr class="bg-gray-100 dark:bg-gray-600">
					<th colspan={columns[selectedList].length}>
						<div class="px-4 py-2 flex justify-between">
							<!-- LIST SELECTOR -->
							<!-- I use Tabs without content as the input here, because I prefer them to radio
								buttons in this case visually -->
							<Tabs tabStyle="pill" contentClass="hidden" class="flex-none">
								{#each data.lists as list (list.key)}
									<TabItem open={selectedList === list.key} title={`${list.name} (${list.entryCount})`}
									         on:click={() => selectList(list.key)} />
								{/each}
							</Tabs>

							<!-- EXPORT -->
							<div class="flex-shrink text-right content-center">
								<a href="..." class="flex place-content-end items-center gap-1 text-base font-normal">
									<!-- FIXME export -->
									Export
									<DownloadOutline />
								</a>
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
					<TableBodyRow on:click={() => toggleRow(row, idx)}
					              title={row.userProductInfo.reviewed ? 'Click the row to see the review': null}>
						{#each columns[selectedList] as col (col)}
							<!-- max-w and overflow are for the Name ofc -->
							<TableBodyCell class="max-w-lg overflow-hidden overflow-ellipsis">
								{@const cellValue = getCellValue(row, col)}
								{#if col === Cols.Review}
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
					{#if expandedRow === idx}
						<TableBodyRow>
							<TableBodyCell colspan={columns[selectedList].length}>
								<div class="flex gap-2">
									<div class="flex-none">
										<hr class="w-px h-full border-0 border-l border-gray-200 dark:border-gray-700" />
									</div>
									<div class="flex-1">
										<h4>Reviewed at {row.userProductInfo.review?.reviewedAt?.toLocaleString()}:</h4>
										<p>{row.userProductInfo.review?.body}</p>
									</div>
								</div>
							</TableBodyCell>
						</TableBodyRow>
					{/if}
				{/each}
			</TableBody>
		</Table>
	</div>
{/snippet}