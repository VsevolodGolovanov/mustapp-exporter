<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Input, Label, P } from 'flowbite-svelte';
	import type { PageProps } from './$types';
	import { setSnippets } from '$lib/layout-snippets.svelte';
	import type { LayoutSnippets } from './+layout.svelte';

	const { form }: PageProps = $props();

	// need to reset the snippets workaround when navigating from subroute back here, otherwise
	// subroute's snippets linger and render
	setSnippets<LayoutSnippets>({ layoutHeaderCenter: undefined });

	let privacyLearnMoreExpanded = $state(false);
</script>

<Card class="m-auto sm:p-12">
	<form class="flex flex-col space-y-6" method="POST" action="?/getData" use:enhance>
		<h3 class="p-0 text-xl font-medium text-gray-900 dark:text-white">Choose Must user</h3>

		<div>
			<Label>
				<span>Must username</span>
				<Input type="text" name="username" placeholder="Enter username" value={form?.username ?? ''}
				       required />
			</Label>
			<div class="text-xs -mt-0.5">Must profile must be public</div>

			{#if form?.error}
				<P class="text-red-500 dark:text-red-500">{form.error}</P>
			{/if}
		</div>

		<div class="w-full flex flex-col">
			<Button type="submit">Get Must data</Button>

			<div class="text-xs">
				<p>
					Data stays on your device.
					<button type="button" class="text-primary-600 dark:text-primary-500 hover:underline mt-1"
					        onclick={() => privacyLearnMoreExpanded = !privacyLearnMoreExpanded}>
						{privacyLearnMoreExpanded ? 'Show less.' : 'Learn more.'}
					</button>
				</p>
				{#if privacyLearnMoreExpanded}
					<div class="mt-1">
						Username is not logged on server. Data requested directly to your browser and stored
						only locally on your device.
					</div>
				{/if}
			</div>
		</div>
	</form>
</Card>
