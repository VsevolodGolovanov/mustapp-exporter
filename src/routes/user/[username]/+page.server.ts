import { MustAppService, type Profile, type UserProductList } from './MustAppService';
import _ from 'lodash';
import { sleep } from '$lib';

export async function load({ params: { username } }) {
	console.log('Loading data for user:', username);

	const profile = await MustAppService.getProfile(username);
	const lists = profile.lists;
	console.log(
		`Loaded profile: id=${profile.id}, want ${lists.want.length}, ` +
			`shows ${lists.shows.length}, watched ${lists.watched.length}`
	);

	const userProductLists = await getUserProductLists(profile);
	console.log('Got all lists!');

	return {
		username: username,
		userId: profile.id,
		lists: lists
	};
}

async function getUserProductLists(profile: Profile) {
	// it'd be nice to be able to use _.mapValues, but problematic with async, especially since I
	// want to load the lists strictly sequentially
	let resultLists = {};
	for (const listKey of Object.keys(profile.lists) as (keyof Profile['lists'])[]) {
		console.log(`Batch fetching ${listKey} list`);
		const list = profile.lists[listKey];
		resultLists = {
			...resultLists,
			[listKey]: await getUserProductListBatched(profile.id, list)
		};
	}
	return resultLists as Record<keyof Profile['lists'], UserProductList>;
}

async function getUserProductListBatched(userId: number, ids: number[]) {
	// when scrolling mustapp.com fetches in batches of 30 - let's try to go a bit bigger, but not
	// too much
	const batchSize = 100;
	// and let's wait between batches a bit to lessen the risk of triggering some DOS protection
	const waitMs = 100;

	const userProductList: UserProductList = [];
	for (const idBatch of _.chunk(ids, batchSize)) {
		// better wait before because we just fetched Profile
		await sleep(waitMs);
		userProductList.push(...(await MustAppService.getUserProductList(userId, idBatch)));
		console.log(`Fetched ${userProductList.length}/${ids.length} items`);
	}

	return userProductList;
}
