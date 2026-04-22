<script setup lang="ts">
import {ref, onMounted, onUnmounted, watch, computed} from "vue";
import {useMovieStore} from "../stores/movies";
import {SortOption} from "../types/movie";
import SearchBar from "../components/search/SearchBar.vue";
import FilterBar from "../components/search/FilterBar.vue";
import SortDropdown from "../components/search/SortDropdown.vue";
import MovieGrid from "../components/search/MovieGrid.vue";
import {ArrowDown} from "lucide-vue-next";

import {useRoute} from "vue-router";

const props = defineProps<{
    prefilterGenre?: string;
}>();

const movieStore = useMovieStore();
const route = useRoute();

const query = ref("");
const selectedGenres = ref<string[]>([]);
const sortType = ref("added");
const sortOrder = ref<"asc" | "desc">("desc");

const currentSortOption = computed((): SortOption => {
    if (sortType.value === "shuffle") return "shuffle";
    return `${sortType.value}_${sortOrder.value}` as SortOption;
});

function toggleOrder() {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
}

const isTucked = ref(false);
let lastScrollY = 0;
let isAnimating = false;
let mainEl: Element | null = null;
let scrollRafId: number | null = null;

function setTucked(val: boolean) {
    if (isTucked.value === val) return;

    isTucked.value = val;
    isAnimating = true;

    setTimeout(() => {
        isAnimating = false;
        if (mainEl) lastScrollY = mainEl.scrollTop;
    }, 400);
}

function handleScrollInner() {
    if (!mainEl) return;
    const currentScrollY = mainEl.scrollTop;

    if (isAnimating) {
        lastScrollY = currentScrollY;
        return;
    }

    if (currentScrollY <= 20) {
        setTucked(false);
    } else if (currentScrollY > lastScrollY + 12) {
        setTucked(true);
    } else if (currentScrollY < lastScrollY - 12) {
        setTucked(false);
    }

    lastScrollY = currentScrollY;
}

function handleScroll() {
    if (scrollRafId !== null) return;
    scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        handleScrollInner();
    });
}

onMounted(() => {
    if (props.prefilterGenre) {
        selectedGenres.value = [props.prefilterGenre];
    }
    if (route.query.q) {
        query.value = route.query.q as string;
    }
    if (route.query.director) {
        query.value = route.query.director as string;
    }
    if (route.query.genre) {
        selectedGenres.value = [route.query.genre as string];
    }

    mainEl = document.querySelector(".app-main");
    if (mainEl) {
        mainEl.addEventListener("scroll", handleScroll, {passive: true});
    }
});

onUnmounted(() => {
    if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
    }
    if (scrollRafId !== null) {
        cancelAnimationFrame(scrollRafId);
    }
    mainEl = null;
});

watch(
    () => props.prefilterGenre,
    (newVal) => {
        if (newVal) {
            selectedGenres.value = [newVal];
            query.value = "";
        }
    },
);

watch(
    () => route.query,
    (newQuery) => {
        if (newQuery.q) {
            query.value = newQuery.q as string;
        } else if (newQuery.director) {
            query.value = newQuery.director as string;
        } else {
            query.value = "";
        }

        if (newQuery.genre) {
            selectedGenres.value = [newQuery.genre as string];
        } else if (!props.prefilterGenre) {
            selectedGenres.value = [];
        }
    },
    {deep: true},
);

function onSearch(q: string) {
    query.value = q;
    if (q.trim() !== "") {
        selectedGenres.value = []; // clear genres on manual text search as per requirement
    }
}

function onToggleGenre(genre: string) {
    if (selectedGenres.value.includes(genre)) {
        selectedGenres.value = selectedGenres.value.filter((g) => g !== genre);
    } else {
        selectedGenres.value.push(genre);
        query.value = ""; // clear search on clicking genre chip
    }
}
</script>

<template>
    <div class="search-container">
        <div class="top-section" :class="{'is-tucked': isTucked}">
            <div class="glass-background"></div>
            <div class="search-content">
                <div class="search-sort-row">
                    <SearchBar :value="query" @update="onSearch" class="search-bar-flex" />
                    <div class="sort-controls">
                        <SortDropdown v-model="sortType" />
                        <button
                            class="direction-toggle"
                            :class="{rotated: sortOrder === 'asc'}"
                            @click="toggleOrder"
                            :disabled="sortType === 'shuffle'"
                            :title="sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'"
                        >
                            <ArrowDown :size="18" />
                        </button>
                    </div>
                </div>
                <Transition name="filter-slide">
                    <div class="filter-wrapper" v-show="!isTucked">
                        <FilterBar :genres="movieStore.allGenres" :selected="selectedGenres" @toggle="onToggleGenre" />
                    </div>
                </Transition>
            </div>
        </div>

        <div class="grid-section">
            <MovieGrid :query="query" :genres="selectedGenres" :sort="currentSortOption" />
        </div>
    </div>
</template>

<style scoped>
.search-container {
    display: flex;
    flex-direction: column;
    min-height: 100%;
}

.top-section {
    padding: 32px 40px 16px 40px;
    position: sticky;
    top: 0;
    z-index: 20;
    transition: padding 0.3s ease;
    will-change: transform;
    contain: layout style;
}

.top-section.is-tucked {
    padding: 24px 40px 24px 40px;
}

.glass-background {
    position: absolute;
    inset: 0;
    background-color: var(--bg-dark-glass);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    z-index: -1;
}

.search-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    z-index: 1;
}

.search-sort-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;
    transition: margin-bottom 0.3s ease;
}

.top-section.is-tucked .search-sort-row {
    margin-bottom: 0px;
}

.filter-slide-enter-active,
.filter-slide-leave-active {
    transition:
        max-height 0.3s ease,
        opacity 0.3s ease;
    max-height: 100px;
    opacity: 1;
    overflow: hidden;
}

.filter-slide-enter-from,
.filter-slide-leave-to {
    max-height: 0;
    opacity: 0;
}

.sort-controls {
    display: flex;
    gap: 12px;
    align-items: center;
}

.direction-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background-color: var(--bg-light-glass);
    border: 1px solid var(--muted-dark);
    border-radius: 8px;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.direction-toggle:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: var(--muted-mid);
}

.direction-toggle.rotated svg {
    transform: rotate(180deg);
}

.direction-toggle svg {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.direction-toggle:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.search-bar-flex {
    flex: 1;
}

.grid-section {
    flex: 1;
    padding: 0 40px 40px 40px;
}
</style>
