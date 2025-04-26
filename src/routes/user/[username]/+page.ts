import {
	MustAppService,
	type Profile,
	type UserProductList,
	type UserProductListKey,
	type UserProductLists
} from './(services)/MustAppService';
import { Fetch } from '$lib/CurrentContext.svelte';
import { MustAppClientCacheService } from './(services)/MustAppClientCacheService';
import _ from 'lodash';
import { checkNonNullable } from '$lib/Checks';

export async function load({ fetch, url, params: { username } }) {
	console.log('Loading data for user:', username);

	let profile: Profile;
	let fetchTimestamp: Date;
	let userProductLists: Promise<UserProductLists>;

	const cacheService = new MustAppClientCacheService();
	let cacheData;
	if (url.searchParams.has('update')) {
		console.log('Update requested - skipping cache');
	} else {
		cacheData = await cacheService.getData(username);
	}

	let loadingUserProductLists: Record<UserProductListKey, Promise<UserProductList>[]> | null = null;
	if (cacheData) {
		console.log('Found cached data');

		fetchTimestamp = cacheData.fetchTimestamp;
		profile = cacheData.profile;
		userProductLists = Promise.resolve(cacheData.userProductLists);
	} else {
		console.log('No cached data - fetching');
		Fetch.set(fetch);

		fetchTimestamp = new Date();

		// separately getting profile and lists here to provide detailed UI feedback

		profile = await MustAppService.getProfile(username);
		const lists = profile.lists;
		console.log(
			`Loaded profile: id=${profile.id}, want ${lists.want.length}, ` +
				`shows ${lists.shows.length}, watched ${lists.watched.length}`
		);

		loadingUserProductLists = MustAppService.getUserProductLists(profile);
		// Still need to provide a single Promise resolving to completely resolved de-batched data as
		// well - at the minimum to support a singular data API with caching above; at the maximum
		// because the UI code would have to do something like that anyway. But does that mean that we
		// send the same data twice to the client? Maybe I should do:
		// `loadingUserProductLists.values.map(batch => batch.length)` - that would be enough to
		// track loading progress.
		const allPromises = Object.values(loadingUserProductLists).flat(1);
		userProductLists = Promise.all(allPromises).then(async () => {
			console.log('Assembling loaded userProductLists batches');
			// can't use _.mapValues here, because I need to `await` the batches (ye, this really calls
			// for a Promise-specific library...)

			let resultLists = {};
			checkNonNullable(loadingUserProductLists);
			for (const listKey of Object.keys(loadingUserProductLists) as UserProductListKey[]) {
				const list: UserProductList = (await Promise.all(loadingUserProductLists[listKey])).flat(1);
				resultLists = {
					...resultLists,
					[listKey]: list
				};
			}
			return resultLists as UserProductLists;
		});

		userProductLists.then((upLists) => {
			console.log('Fetched lists');
			cacheService
				.setData({ username, fetchTimestamp, profile, userProductLists: upLists })
				.then(() => console.log('userProductLists cached'));
		});
	}

	const lists: ListDescriptor[] = Object.entries(profile.lists).map(([key, list]) => {
		return {
			key: key as UserProductListKey,
			name: _.startCase(key),
			entryCount: list.length
		};
	});

	return {
		username,
		fetchTimestamp,
		userId: profile.id,
		lists,
		userProductLists,
		loadingUserProductLists
	};
}

export type ListDescriptor = {
	key: UserProductListKey;
	name: string;
	entryCount: number;
};
