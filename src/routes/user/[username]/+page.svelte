<script lang="ts">
	let { data } = $props();
</script>

<div>
	Henlo stinky {data.username}#{data.userId}<br>
	<ul>
		<li>Want: {data.lists.want.length}
		<li>Watched: {data.lists.watched.length}
		<li>Series: {data.lists.shows.length}
		<li>YouTube: {data.lists.youtube.length}
	</ul>
</div>
