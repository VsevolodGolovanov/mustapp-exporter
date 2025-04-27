<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, Input, Label, P } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	const { form }: PageProps = $props();
</script>

<Card class="m-auto">
	<div class="space-y-4 p-6 sm:p-8 md:space-y-6">
		<form class="flex flex-col space-y-6" method="POST" action="?/getData" use:enhance>
			<h3 class="p-0 text-xl font-medium text-gray-900 dark:text-white">Choose user</h3>

			<Label class="space-y-2">
				<span>Enter Must username</span>
				<Input type="text" name="username" placeholder="Username" value={form?.username ?? ''} required />
			</Label>

			{#if form?.error}
				<P class="text-red-500 dark:text-red-500">{form.error}</P>
			{/if}
			<Button type="submit">Get Must data</Button>
		</form>
	</div>
</Card>
