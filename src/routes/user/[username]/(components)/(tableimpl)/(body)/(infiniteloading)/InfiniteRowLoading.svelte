<script lang="ts">
	import InfiniteLoading from 'svelte-infinite-loading';
	import { TableContext } from '../../TableContext.svelte';
	import { checkNonNullable } from '$lib/Checks';

	const tableContext = TableContext.current();

	// compensate scrollbar not properly resetting to the top because of preloadBatchCount
	$effect(() => {
		tableContext.infiniteRowLoader!.dataProvider();
		document.getElementById('table-scroll-container')!.scrollTop = 0;
	});
</script>

{checkNonNullable(tableContext.infiniteRowLoader)}

<InfiniteLoading on:infinite={tableContext.infiniteRowLoader.handler}
                 identifier={tableContext.infiniteRowLoader.dataProvider()}>
	<!-- InfiniteLoading renders a normal div in a div, not tr/td, and it's treated as one cell a
		table body context. The easiest way to render something decent would probably be with
		"absolute w-full". But nah, I don't really want to show anything, let's just hide everything.
		 Except `error` - just in case. -->

	<!-- ugh, IDEA wrongly marks snippets as errors here, so I'll use slots:
		https://youtrack.jetbrains.com/issue/WEB-72832 -->

	<!--{#snippet spinner()}-->
	<!--{/snippet}-->
	<div slot="spinner">
	</div>

	<!--{#snippet noResults()}-->
	<!--{/snippet}-->
	<div slot="noResults">
	</div>

	<!--{#snippet noMore()}-->
	<!--{/snippet}-->
	<div slot="noMore">
	</div>
</InfiniteLoading>
