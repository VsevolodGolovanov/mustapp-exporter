import type { UserProductListEntry } from '../../../(services)/MustAppService';
import { type ColNames, Cols } from '../Columns';
import { checkState } from '$lib/Checks';
import _ from 'lodash';

export function getCellValue(
	row: UserProductListEntry,
	col: ColNames
): string | number | boolean | Date | null | undefined {
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
}

export function getCellDisplayValue(
	row: UserProductListEntry,
	col: ColNames
): string | number | boolean | null | undefined {
	switch (col) {
		case Cols.ReleaseDate:
			return row.product.releaseDate?.toLocaleDateString();
		case Cols.ModifiedAt:
			return row.userProductInfo.modifiedAt?.toLocaleString();
		case Cols.Episodes:
			return (
				row.userProductInfo.userShowInfo.episodesWatched +
				'/' +
				row.product.itemsReleasedCount +
				(row.product.itemsReleasedCount != null &&
				row.product.itemsCount != null &&
				row.product.itemsReleasedCount < row.product.itemsCount
					? '/' + row.product.itemsCount
					: '')
			);
		default: {
			const cellValue = getCellValue(row, col);
			checkState(!_.isObject(cellValue));
			return cellValue;
		}
	}
}
