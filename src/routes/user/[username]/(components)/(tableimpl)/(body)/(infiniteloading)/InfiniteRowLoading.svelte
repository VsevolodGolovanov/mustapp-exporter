<script lang="ts">
	import InfiniteLoading from 'svelte-infinite-loading';
	import { TableContext } from '../../TableContext.svelte';
	import { nonNullable } from '$lib/Checks';

	const tableContext = TableContext.current();
</script>

<InfiniteLoading on:infinite={nonNullable(tableContext.infiniteDataLoader).handler}
                 identifier={tableContext.selectedList}>
	<!-- InfiniteLoading renders a normal div, not tr, so it's treated as one cell. The easiest way to
		render something decent would probably be with "absolute w-full". But nah, I don't really want
		to show anything, let's just hide everything. Except `error` - just in case. -->

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
