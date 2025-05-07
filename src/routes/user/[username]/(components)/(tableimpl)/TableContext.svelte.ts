import {
	type ListKey,
	listKeys,
	type UserProductList,
	type UserProductListEntry,
	type UserProductLists
} from '../../(services)/MustAppService';
import { getContext, setContext } from 'svelte';
import type { ColNames } from './Columns';
import { InfiniteStaticDataLoader } from './(body)/(infiniteloading)/InfiniteStaticDataLoader.svelte';

/**
 * Shares Table-level state with Child components to simplify decomposing the Table into parts.
 *
 * State-referencing functions are reactive implicitly, no need to make them some runic somehow:
 * https://stackoverflow.com/q/79605856/1341535
 */
export class TableContext {
	private static readonly key = Symbol('UserProductListsTable-TableContext');

	static setCurrent(tableContext: TableContext) {
		setContext(TableContext.key, tableContext);
	}

	static current() {
		return getContext(TableContext.key) as TableContext;
	}

	constructor(
		readonly fetchTimestamp: Date,
		readonly userProductLists: UserProductLists
	) {}

	selectedList: ListKey = $state(listKeys[0]);

	applyDataTransformationTitleTextFilter?: (userProductList: UserProductList) => UserProductList;

	sortColumn = $state<ColNames>();
	sortDirection = $state(true);
	applyDataTransformationSort?: (userProductList: UserProductList) => UserProductList;

	infiniteRowLoader?: InfiniteStaticDataLoader<UserProductListEntry>;

	// raw state, because don't need deep reactivity here, and it prevents using rows for identity
	expandedRow = $state.raw<object | null>(null);
	toggleExpandedRow?: (row: UserProductListEntry) => void;
}
