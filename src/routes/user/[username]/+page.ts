import { MustAppService, type Profile, type UserProductLists } from './MustAppService';
import _ from 'lodash';
import { Fetch } from '$lib/CurrentContext.svelte';
import { MustAppClientCacheService } from './MustAppClientCacheService';

export async function load({ fetch, url, params: { username } }) {
	console.log('Loading data for user:', username);

	let profile: Profile;
	let fetchTimestamp: Date;
	let userProductLists;

	const cacheService = new MustAppClientCacheService();
	let cacheData;
	if (url.searchParams.has('update')) {
		console.log('Update requested - skipping cache');
	} else {
		cacheData = await cacheService.getData(username);
	}

	if (cacheData) {
		console.log('Found cached data');

		fetchTimestamp = cacheData.fetchTimestamp;
		profile = cacheData.profile;
		userProductLists = cacheData.userProductLists;
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

		userProductLists = await MustAppService.getUserProductLists(profile);
		console.log('Fetched lists');

		await cacheService.setData({ username, fetchTimestamp, profile, userProductLists });
	}

	return {
		username: username,
		fetchTimestamp: fetchTimestamp,
		userId: profile.id,
		lists: Object.entries(userProductLists).map(([name, list]) => {
			return {
				key: name as keyof UserProductLists,
				name: _.startCase(name),
				count: list.length
			};
		}),
		tableData: userProductLists
	};
}
