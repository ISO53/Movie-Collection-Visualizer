<script setup lang="ts">
import {Movie} from "../../types/movie";
import {useDialogStore} from "../../stores/dialog";
import MoviePoster from "../shared/MoviePoster.vue";
import RatingBadge from "../shared/RatingBadge.vue";

const props = defineProps<{
    movie: Movie;
}>();

const dialogStore = useDialogStore();

function onClick() {
    dialogStore.openMovieDetail(props.movie);
}
</script>

<template>
    <div class="movie-card" @click="onClick">
        <MoviePoster :poster-path="movie.posterPath" :poster-url="movie.posterUrl" :alt="movie.title" class="poster" />
        <div class="overlay"></div>
        <div class="card-content">
            <div class="title">{{ movie.title }}</div>
        </div>
        <RatingBadge :rating="movie.imdbRating" class="rating-badge" />
    </div>
</template>

<style scoped>
.movie-card {
    width: 130px;
    height: 195px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background-color: var(--bg-light);
    flex-shrink: 0;
}

.movie-card:hover {
    transform: scale(1.04);
}

.poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 50%);
    opacity: 0.8;
}

.card-content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px;
    z-index: 2;
}

.title {
    color: white;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rating-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    z-index: 2;
}
</style>
