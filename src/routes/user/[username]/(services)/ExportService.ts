import * as XLSX from 'xlsx/xlsx.mjs';
import type {
	UserProductList,
	UserProductListEntry,
	ListKey,
	UserProductLists
} from './MustAppService';
import _ from 'lodash';
import { checkState } from '$lib/Checks';

export class ExportService {
	public static export(userProductLists: UserProductLists, dataFetchTimestamp: Date) {
		console.log('Exporting');
		// based on https://docs.sheetjs.com/docs/getting-started/examples/export

		const workbook = XLSX.utils.book_new();

		// Info sheet
		const infoSheet = this.createInfoSheet(dataFetchTimestamp);
		XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info');

		// each Must list goes into a separate sheet
		for (const [listKey, list] of Object.entries(userProductLists)) {
			const listSheet = this.createListSheet(listKey as ListKey, list);
			XLSX.utils.book_append_sheet(workbook, listSheet, _.startCase(listKey));
		}

		console.log('Writing file');
		// create and download the file
		XLSX.writeFile(workbook, `MustAppExport-${toFileDateTimeString(new Date())}.xlsx`, {
			compression: true
		});

		console.log('Export complete');
	}

	private static createInfoSheet(dataFetchTimestamp: Date) {
		const infoRows = [
			['Each list was exported to a separate sheet of this workbook.'],
			[`MustApp data was fetched on ${dataFetchTimestamp.toLocaleString()}.`],
			[
				"Some columns' values are displayed as dates by Excel by default, but actually contain " +
					"time as well - you can change the cells' format to display those too."
			],
			[],
			['Report issues or request features at:'],
			['https://github.com/VsevolodGolovanov/mustapp-exporter/issues']
		];
		const link1BasedIndex = infoRows.length;

		const sheet = XLSX.utils.aoa_to_sheet(infoRows);

		// make the link an actual clickable link (it won't be automatically styled though)
		sheet[`A${link1BasedIndex}`].l = {
			Target: 'https://github.com/VsevolodGolovanov/mustapp-exporter/issues'
		};

		return sheet;
	}

	private static createListSheet(listKey: ListKey, list: UserProductList) {
		const listColumns = columns[listKey];

		// map data
		const rows = list.map((row) =>
			_.fromPairs(listColumns.map((col) => [col, getCellValue(row, col)]))
		);

		const sheet = XLSX.utils.json_to_sheet(rows);

		// column widths

		// could've just set a fixed one for the Title also, but eh, let's be flexible a bit
		const minTitleWidth = 30;
		const maxTitleWidth = 80;
		const titleWidth = Math.min(
			maxTitleWidth,
			rows.reduce((w, row) => Math.max(w, (row[Cols.Title] as string).length), minTitleWidth)
		);

		// 10 is enough for all data, but 11 also fits the "Release date" header
		const otherWidth = 11;

		sheet['!cols'] = listColumns.map((col) => {
			return { wch: col === Cols.Title ? titleWidth : otherWidth };
		});

		return sheet;
	}
}

function toFileDateTimeString(dt: Date) {
	const pad0 = (value: number) => _.padStart('' + value, 2, '0');
	return (
		`${dt.getFullYear()}-${pad0(dt.getMonth() + 1)}-${pad0(dt.getDate())}-` +
		`${pad0(dt.getHours())}-${pad0(dt.getMinutes())}-${pad0(dt.getSeconds())}`
	);
}

// the following stuff is similar to what +page.svelte does, but this export-specific mapping is
// different enough that trying to extract common parts is not worth it

const Cols = {
	Title: 'Title',
	ReleasedDate: 'Release date',
	ModifiedAt: 'Modified',
	MovieRating: 'Rating',
	MovieReviewedAt: 'Reviewed',
	MovieReviewText: 'Review',
	EpisodesWatched: 'Watched',
	EpisodesReleased: 'Released',
	EpisodesTotal: 'Total'
} as const;

type ColNames = (typeof Cols)[keyof typeof Cols];

const columns: { [listKey in ListKey]: ColNames[] } = {
	want: [Cols.Title, Cols.ReleasedDate, Cols.ModifiedAt],
	shows: [
		Cols.Title,
		Cols.ReleasedDate,
		Cols.ModifiedAt,
		Cols.EpisodesWatched,
		Cols.EpisodesReleased,
		Cols.EpisodesTotal
	],
	watched: [
		Cols.Title,
		Cols.ReleasedDate,
		Cols.ModifiedAt,
		Cols.MovieRating,
		Cols.MovieReviewedAt,
		Cols.MovieReviewText
	]
};

const getCellValue = (
	row: UserProductListEntry,
	col: ColNames
): string | number | boolean | Date | null | undefined => {
	switch (col) {
		case Cols.Title:
			return row.product.title;
		case Cols.ReleasedDate:
			return row.product.releaseDate;
		case Cols.ModifiedAt:
			return row.userProductInfo.modifiedAt;
		case Cols.MovieRating:
			return row.userProductInfo.rate;
		case Cols.MovieReviewedAt:
			return row.userProductInfo.review?.reviewedAt;
		case Cols.MovieReviewText:
			return row.userProductInfo.review?.body;
		case Cols.EpisodesWatched:
			return row.userProductInfo.userShowInfo.episodesWatched;
		case Cols.EpisodesReleased:
			return row.product.itemsReleasedCount;
		case Cols.EpisodesTotal:
			return row.product.itemsCount;
		default:
			checkState(false);
	}
};
