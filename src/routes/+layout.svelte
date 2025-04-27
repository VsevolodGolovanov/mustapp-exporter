<script module lang="ts">
	import type { Snippet } from 'svelte';

	export type LayoutSnippets = { layoutHeaderCenter?: Snippet };
</script>

<script lang="ts">
	import '../app.css';
	import { DarkMode, Navbar, NavBrand } from 'flowbite-svelte';
	import { initSnippets } from '$lib/layout-snippets.svelte';
	import type { LayoutProps } from './$types';

	const { children }: LayoutProps = $props();

	// https://github.com/sveltejs/kit/issues/12928
	const snippets = initSnippets<LayoutSnippets>();
</script>

<div class="min-h-screen max-h-screen bg-white dark:bg-gray-900 flex flex-col">
	<header class="text-center top-0 z-40 flex-none w-full mx-auto bg-white border-b
		border-gray-200 dark:border-gray-600 dark:bg-gray-800">
		<Navbar navContainerClass="max-w-full" class="text-black dark:text-white">
			<!-- whole NavBrand becomes a link, so it shouldn't stretch -->
			<NavBrand href="/" class="flex-shrink font-semibold">
				<img class="mr-2 h-8 w-8" src="/mustapp.svg" alt="logo" />
				MustApp Exporter
			</NavBrand>

			<div class="flex-1 flex place-content-center place-items-center">
				{@render snippets.layoutHeaderCenter?.()}
			</div>

			<!-- fixed width matching NavBrand's width - so that layoutHeaderCenter is positioned in the
				center and gets all the space -->
			<div class="basis-43 shrink-0 grow-0 text-right">
				<DarkMode />
			</div>
		</Navbar>
	</header>

	<main class="flex-1 min-h-0">
		<div class="mx-auto max-w-7xl lg:px-20 px-8 md:px-auto py-8">
			{@render children()}
		</div>
	</main>
</div>
