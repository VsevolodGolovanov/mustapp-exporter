import { fail, redirect } from '@sveltejs/kit';

// noinspection JSUnusedGlobalSymbols
export const actions = {
	getData: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username');

		if (!username || typeof username !== 'string' || username.trim() === '') {
			return fail(400, {
				username: username,
				error: 'Input valid username'
			});
		}

		redirect(303, '/user/' + username);
	}
};
