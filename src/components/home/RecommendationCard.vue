<script setup lang="ts">
import {ExternalLink, Star} from "lucide-vue-next";

defineProps<{
    movie: {
        imdbId: string;
        title: string;
        year: string;
        genres: string;
        imdbRating: string;
        similarity: number;
        posterUrl: string;
        plot: string;
    };
}>();

const emit = defineEmits(["click"]);

function genreGradient(genres: string): string {
    const palette: Record<string, [string, string]> = {
        Action: ["#ff4b2b", "#ff416c"],
        Drama: ["#4776e6", "#8e54e9"],
        Adventure: ["#f7971e", "#ffd200"],
        Thriller: ["#0f0c29", "#302b63"],
        "Sci-Fi": ["#00b4db", "#0083b0"],
        Crime: ["#373b44", "#4286f4"],
        Mystery: ["#5c258d", "#4389a2"],
        Horror: ["#1a1a1a", "#8b0000"],
        Comedy: ["#f7971e", "#ffd200"],
        Fantasy: ["#134e5e", "#71b280"],
        Animation: ["#f953c6", "#b91d73"],
        Documentary: ["#1d4350", "#a43931"],
        Romance: ["#ee9ca7", "#ffdde1"],
        Music: ["#355c7d", "#6c5b7b"],
        War: ["#373b44", "#4286f4"],
        Western: ["#c85250", "#6a3093"],
        Biography: ["#396afc", "#2948ff"],
        History: ["#4e4376", "#2b5876"],
    };
    const tokens = genres.split(",").map((g) => g.trim());
    for (const t of tokens) {
        for (const [key, [a, b]] of Object.entries(palette)) {
            if (t.toLowerCase().includes(key.toLowerCase())) {
                return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
            }
        }
    }
    return "linear-gradient(135deg, #333 0%, #111 100%)";
}
</script>

<template>
    <div class="rec-card-new" @click="emit('click')">
        <div class="rec-poster-frame">
            <div
                v-if="movie.posterUrl && movie.posterUrl !== 'N/A'"
                class="rec-poster-img"
                :style="{backgroundImage: `url(${movie.posterUrl})`}"
            ></div>
            <div v-else class="rec-poster-fallback" :style="{background: genreGradient(movie.genres)}">
                <span>No Poster</span>
            </div>
        </div>

        <div class="rec-details">
            <div class="rec-header">
                <h3 class="rec-title">{{ movie.title || movie.imdbId }}</h3>
                <div class="rec-metrics">
                    <div class="rec-rating" v-if="movie.imdbRating && movie.imdbRating !== 'N/A'">
                        <Star :size="14" fill="currentColor" />
                        <span>{{ movie.imdbRating }}</span>
                    </div>
                    <div class="rec-match">{{ Math.round(movie.similarity * 100) }}% MATCH</div>
                </div>
            </div>

            <div class="rec-meta">
                <span class="rec-year">{{ movie.year }}</span>
                <span class="rec-sep" v-if="movie.year">·</span>
                <span class="rec-genres">{{ movie.genres }}</span>
            </div>

            <div class="rec-plot-container">
                <p class="rec-plot" :class="{'is-loading': !movie.plot}">
                    {{ movie.plot || "Fetching cinematic details from OMDB hub..." }}
                </p>
            </div>

            <div class="imdb-btn">
                <span>IMDb</span>
                <ExternalLink :size="12" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.rec-card-new {
    display: flex;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    height: 165px;
    cursor: pointer;
    position: relative;
    backdrop-filter: blur(10px);
}

.rec-card-new:hover {
    border-color: var(--accent-four);
    background: rgba(255, 255, 255, 0.04);
}

.rec-poster-frame {
    width: 100px;
    height: 100%;
    flex-shrink: 0;
    padding: 8px;
}

.rec-poster-img,
.rec-poster-fallback {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.rec-poster-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.rec-details {
    flex: 1;
    padding: 14px 16px 20px 16px; /* Added more bottom padding for the absolute button */
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
}

.rec-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
}

.rec-title {
    font-size: 18px;
    font-weight: 800;
    color: white;
    margin: 0;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.5px;
    width: 100%;
}

.rec-metrics {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.rec-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--accent-four);
    font-weight: 700;
    font-size: 13px;
}

.rec-match {
    background: var(--accent-four);
    color: black;
    font-size: 9px;
    font-weight: 900;
    padding: 1px 4px;
    border-radius: 2px;
    letter-spacing: 0.5px;
}

.rec-meta {
    margin-top: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    width: 100%;
}

.rec-sep {
    margin: 0 6px;
    opacity: 0.3;
}

.rec-plot-container {
    margin-top: 10px;
    position: relative;
    flex: 1;
}

.rec-plot {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    position: relative;
    z-index: 2;
}

.imdb-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.4);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(4px);
    z-index: 10;
}

.rec-card-new:hover .imdb-btn {
    border-color: var(--accent-four);
    color: var(--accent-four);
    background: #141414; /* Solid opaque background */
    backdrop-filter: blur(4px);
    opacity: 1;
    transform: translateY(0);
}
</style>
