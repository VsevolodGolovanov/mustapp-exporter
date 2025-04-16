import { MustAppService } from './MustAppService';

export async function load({ params: { username } }) {
	const profile = await MustAppService.getProfile(username);

	return {
		username: username,
		userId: profile.id,
		lists: profile.lists
	};
}
