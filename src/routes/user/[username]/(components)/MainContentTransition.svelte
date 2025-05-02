<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	// makes so old content doesn't push new content down - instead old fades into new in the same
	// position
	const takeOutOfStaticFlow = (e: CustomEvent<null>) => {
		const el = e.target as HTMLElement;
		el.className = 'absolute left-0 right-0 px-[inherit]';
	};
</script>

<!--suppress HtmlUnknownAttribute (IDEA's validation fail)-->
<div transition:fade={{duration: 500}} onoutrostart={takeOutOfStaticFlow}>
	{@render children()}
</div>
