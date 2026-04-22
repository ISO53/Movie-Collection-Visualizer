<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{
    genres: string[];
    selected: string[];
}>();

const emit = defineEmits<{
    (e: "toggle", genre: string): void;
}>();

const sortedGenres = computed(() => {
    return [...props.genres].sort((a, b) => {
        const aSelected = props.selected.includes(a);
        const bSelected = props.selected.includes(b);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        // Maintain original order for non-selected/selected groups
        return props.genres.indexOf(a) - props.genres.indexOf(b);
    });
});
</script>

<template>
    <div class="filter-bar">
        <TransitionGroup name="list">
            <button
                v-for="genre in sortedGenres"
                :key="genre"
                class="genre-chip"
                :class="{active: selected.includes(genre)}"
                @click="emit('toggle', genre)"
            >
                {{ genre }}
            </button>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.filter-bar {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
}

.filter-bar::-webkit-scrollbar {
    display: none;
}

.genre-chip {
    padding: 6px 16px;
    background-color: var(--bg-light-glass);
    border: 1px solid var(--muted-dark);
    border-radius: 9999px;
    color: var(--muted-mid);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
}

.genre-chip:hover {
    border-color: var(--muted-mid);
    color: var(--text-main);
}

.genre-chip.active {
    background-color: rgba(236, 130, 0, 0.1);
    border-color: var(--accent-four);
    color: var(--accent-four);
}

/* Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
    transition: all 0.4s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>
