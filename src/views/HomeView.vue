<script setup lang="ts">
import {ref, computed, onMounted} from "vue";
import {useRouter} from "vue-router";
import {
    RefreshCcw,
    Crosshair,
    Search,
    Rocket,
    Skull,
    Drama,
    Compass,
    Zap,
    Key,
    PartyPopper,
    Wand2,
    Palette,
    Video,
    Film,
    Heart,
    Music,
    Swords,
    Mountain,
    User,
    History,
} from "lucide-vue-next";
import {convertFileSrc, invoke} from "@tauri-apps/api/core";
import {useMovieStore} from "../stores/movies";
import {useDialogStore} from "../stores/dialog";
import {parseImdbRating, splitAndTrim, parseRuntime, formatTotalRuntime} from "../lib/utils";
import HeroBanner from "../components/home/HeroBanner.vue";
import RecommendationCard from "../components/home/RecommendationCard.vue";

const movieStore = useMovieStore();
const dialogStore = useDialogStore();
const router = useRouter();

// ── Recommender state ─────────────────────────────────────────────────────────
interface RecommendedMovie {
    imdbId: string;
    imdbRating: string;
    totalVotes: number;
    similarity: number;
    posterUrl: string;
    title: string;
    year: string;
    genres: string;
    plot: string;
}

interface RecommendationCluster {
    mood: string;
    recommendations: RecommendedMovie[];
}

const recommendedClusters = ref<RecommendationCluster[]>([]);
const recommendationsLoading = ref(false);
const recommendationsError = ref<string | null>(null);

async function fetchRecommendations() {
    if (movieStore.movies.length === 0) return;
    recommendationsLoading.value = true;
    recommendationsError.value = null;
    try {
        const clusters = await invoke<RecommendationCluster[]>("get_recommendations");
        recommendedClusters.value = clusters;
    } catch (e: any) {
        recommendationsError.value = String(e);
    } finally {
        recommendationsLoading.value = false;
    }
}

onMounted(fetchRecommendations);

function openImdb(imdbId: string) {
    const url = `https://www.imdb.com/title/${imdbId}/`;
    invoke("open_external", {url});
}

const seedOffset = ref(0);
const reshuffle = () => {
    seedOffset.value += 1;
    fetchRecommendations();
};

const dayOfYear = computed(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay) + seedOffset.value;
});

const isEmpty = computed(() => movieStore.movies.length === 0);

// Section 1: Stats
const stats = computed(() => {
    const total = movieStore.movies.length;
    if (total === 0) return [];

    const avgRating = (movieStore.movies.reduce((acc, m) => acc + parseImdbRating(m.imdbRating), 0) / total).toFixed(1);

    const allDirectors = movieStore.movies.flatMap((m) => splitAndTrim(m.director));
    const uniqueDirectors = new Set(allDirectors).size;

    const totalMinutes = movieStore.movies.reduce((acc, m) => acc + parseRuntime(m.runtime), 0);

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthCount = movieStore.movies.filter((m) => new Date(m.addedAt) >= firstDayOfMonth).length;

    return [
        {label: "TOTAL MOVIES", value: total, trend: `↑ ${thisMonthCount} this month`},
        {label: "AVG RATING", value: avgRating, trend: "↑ 0.1 from last week"},
        {label: "DIRECTORS", value: uniqueDirectors, trend: "↑ 2 new"},
        {label: "TOTAL RUNTIME", value: formatTotalRuntime(totalMinutes), trend: "↑ 14h this month"},
    ];
});

// Section 2: Featured Mosaic
const featuredMovies = computed(() => {
    const allMovies = [...movieStore.movies].filter((m) => m.imdbRating && m.imdbRating !== "N/A");
    if (allMovies.length === 0) return [];

    // If we have few movies, just show what we have
    if (allMovies.length <= 5) {
        return allMovies.map((m) => ({...m, pill: "COLLECTION"}));
    }

    // Use current day + offset to keep selection stable but refreshable
    const currentDay = dayOfYear.value;

    // Create pools for variety
    const topRatedPool = [...allMovies]
        .sort((a, b) => parseImdbRating(b.imdbRating) - parseImdbRating(a.imdbRating))
        .slice(0, 30);

    const gemsPool = allMovies.filter((m) => {
        const r = parseImdbRating(m.imdbRating);
        return r >= 7.2 && r < 8.2;
    });

    const vaultPool = [...allMovies]
        .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
        .slice(0, 30);

    const result: any[] = [];
    const ids = new Set<string>();

    const addFromPool = (pool: any[], label: string, offset: number) => {
        if (pool.length === 0) return false;
        // Pick based on day + offset to get different movies from the same pool
        let idx = (currentDay + offset) % pool.length;
        let attempts = 0;
        while (attempts < pool.length) {
            const movie = pool[idx];
            if (!ids.has(movie.imdbId)) {
                ids.add(movie.imdbId);
                result.push({...movie, pill: label});
                return true;
            }
            idx = (idx + 1) % pool.length;
            attempts++;
        }
        return false;
    };

    // Assemble variety (Large card first)
    addFromPool(topRatedPool, "TOP RATED", 0);
    addFromPool(gemsPool.length > 0 ? gemsPool : allMovies, "HIDDEN GEM", 7);
    addFromPool(vaultPool, "FROM THE VAULT", 13);

    // Fill remaining slots with "Discover" picks from all movies
    let discoverOffset = 21;
    while (result.length < 5) {
        if (!addFromPool(allMovies, "DISCOVER", discoverOffset)) break;
        discoverOffset += 5;
    }

    return result;
});

// Section 3: Browse by Mood
const moodGenres = computed(() => {
    const counts = new Map<string, number>();
    movieStore.movies.forEach((m) => {
        splitAndTrim(m.genre).forEach((g) => {
            counts.set(g, (counts.get(g) || 0) + 1);
        });
    });

    const genreData = [
        {name: "Action", icon: Crosshair, color: "#ff4b2b"},
        {name: "Drama", icon: Drama, color: "#ff9a9e"},
        {name: "Adventure", icon: Compass, color: "#f9d423"},
        {name: "Thriller", icon: Zap, color: "#43e97b"},
        {name: "Sci-Fi", icon: Rocket, color: "#4facfe"},
        {name: "Crime", icon: Search, color: "#a18cd1"},
        {name: "Mystery", icon: Key, color: "#f093fb"},
        {name: "Horror", icon: Skull, color: "#fa709a"},
        {name: "Comedy", icon: PartyPopper, color: "#ffecd2"},
        {name: "Fantasy", icon: Wand2, color: "#84fab0"},
        {name: "Animation", icon: Palette, color: "#a6c1ee"},
        {name: "Documentary", icon: Video, color: "#fbc2eb"},
        {name: "Romance", icon: Heart, color: "#ee9ca7"},
        {name: "Music", icon: Music, color: "#355c7d"},
        {name: "War", icon: Swords, color: "#373b44"},
        {name: "Western", icon: Mountain, color: "#c85250"},
        {name: "Biography", icon: User, color: "#396afc"},
        {name: "History", icon: History, color: "#4e4376"},
    ];

    const allGenres = Array.from(counts.entries());
    const pool = allGenres.sort((a, b) => b[1] - a[1]).slice(0, 16);

    const selectedGenres: [string, number][] = [];
    const used = new Set<string>();
    let offset = 0;
    const currentDay = dayOfYear.value;

    while (selectedGenres.length < 8 && selectedGenres.length < pool.length) {
        const idx = (currentDay + offset) % pool.length;
        const g = pool[idx];
        if (!used.has(g[0])) {
            used.add(g[0]);
            selectedGenres.push(g);
        }
        offset++;
    }

    return selectedGenres.map(([name, count]) => {
        const preset = genreData.find((g) => g.name === name) || {
            name,
            icon: Film,
            color: "#888",
        };
        return {...preset, count};
    });
});

// Section 4: Directors
const topDirectors = computed(() => {
    const counts = new Map<string, number>();
    movieStore.movies.forEach((m) => {
        splitAndTrim(m.director).forEach((d) => {
            counts.set(d, (counts.get(d) || 0) + 1);
        });
    });

    const allDirectors = Array.from(counts.entries());
    if (allDirectors.length === 0) return [];

    // Use current day + offset for variety
    const currentDay = dayOfYear.value;

    // Pool of top 20 directors for selection
    const pool = allDirectors.sort((a, b) => b[1] - a[1]).slice(0, 20);

    const selectedDirectors: [string, number][] = [];
    const used = new Set<string>();
    let offset = 0;

    while (selectedDirectors.length < 4 && selectedDirectors.length < pool.length) {
        const idx = (currentDay + offset) % pool.length;
        const d = pool[idx];
        if (!used.has(d[0])) {
            used.add(d[0]);
            selectedDirectors.push(d);
        }
        offset++;
    }

    return selectedDirectors.map(([name, count]) => {
        const directorMovies = movieStore.movies.filter((m) => splitAndTrim(m.director).includes(name)).slice(0, 4);

        const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        return {name, count, movies: directorMovies, initials};
    });
});

function openMovie(movie: any) {
    dialogStore.openMovieDetail(movie);
}

function getPosterUrl(movie: any) {
    if (!movie) return "";
    if (movie.posterPath) return convertFileSrc(movie.posterPath);
    if (movie.posterUrl && movie.posterUrl !== "N/A") return movie.posterUrl;
    return "";
}

/** Turns raw stemmed keywords into a readable lowercase hint string */
function formatMoodHint(mood: string): string {
    // mood is 'PIXAR, ANIM, DISNEY, ...' — take first few, lowercase them
    return mood.toLowerCase().split(", ").slice(0, 4).join(" · ");
}
</script>

<template>
    <div class="home-container">
        <div v-if="isEmpty && !movieStore.isLoading" class="empty-state">
            <div class="empty-content">
                <h1 class="empty-title">Movie Collection Visualizer</h1>
                <p class="empty-subtitle">Your personal movie collection</p>
                <button class="primary-btn" @click="router.push('/profile?tab=settings')">Setup Your Collection</button>
            </div>
        </div>

        <div v-else-if="!isEmpty" class="scroll-content relative-container">
            <HeroBanner :key="seedOffset" />

            <div class="content-sections">
                <!-- Section 1: Stats Strip -->
                <section class="stats-section">
                    <div class="stats-grid">
                        <div
                            v-for="stat in stats"
                            :key="stat.label"
                            class="stat-card"
                            @click="router.push('/profile?tab=stats')"
                        >
                            <div class="stat-value">{{ stat.value }}</div>
                            <div class="stat-label">{{ stat.label }}</div>
                            <div class="stat-trend">{{ stat.trend }}</div>
                        </div>
                    </div>
                </section>

                <!-- Section 2: Featured Mosaic -->
                <section class="section-container">
                    <header class="section-header">
                        <h2 class="section-title">Handpicked for tonight</h2>
                        <router-link to="/search" class="see-all-link">Explore all →</router-link>
                    </header>

                    <div class="mosaic-grid" v-if="featuredMovies.length > 0">
                        <!-- Large Card -->
                        <div
                            class="mosaic-card large"
                            :style="{backgroundImage: `url(${getPosterUrl(featuredMovies[0])})`}"
                            @click="openMovie(featuredMovies[0])"
                        >
                            <div class="mosaic-overlay">
                                <div class="mosaic-top">
                                    <span class="rating-badge">★ {{ featuredMovies[0].imdbRating }}</span>
                                    <span class="top-rated-pill">{{
                                        (featuredMovies[0] as any).pill || "TOP RATED"
                                    }}</span>
                                </div>
                                <div class="mosaic-bottom">
                                    <h3 class="movie-title">{{ featuredMovies[0].title }}</h3>
                                    <p class="movie-meta">
                                        {{ featuredMovies[0].year }} • {{ featuredMovies[0].runtime }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Small Cards -->
                        <div class="mini-grid">
                            <div
                                v-for="movie in featuredMovies.slice(1, 5)"
                                :key="movie.imdbId"
                                class="mosaic-card small"
                                :style="{backgroundImage: `url(${getPosterUrl(movie)})`}"
                                @click="openMovie(movie)"
                            >
                                <div class="mosaic-overlay">
                                    <div class="mosaic-top">
                                        <span class="rating-badge small">★ {{ movie.imdbRating }}</span>
                                        <span class="top-rated-pill small" v-if="(movie as any).pill">{{
                                            (movie as any).pill
                                        }}</span>
                                    </div>
                                    <div class="mosaic-bottom">
                                        <h4 class="movie-title small">{{ movie.title }}</h4>
                                        <p class="movie-meta small">{{ movie.year }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 3: Browse by Mood -->
                <section class="section-container">
                    <header class="section-header">
                        <h2 class="section-title">Browse by mood</h2>
                        <router-link to="/search" class="see-all-link">All genres →</router-link>
                    </header>

                    <div class="mood-grid">
                        <div
                            v-for="genre in moodGenres"
                            :key="genre.name"
                            class="genre-tile"
                            :style="{'--genre-color': genre.color}"
                            @click="router.push(`/search?genre=${genre.name}`)"
                        >
                            <div class="genre-info">
                                <div class="genre-name">{{ genre.name }}</div>
                                <div class="genre-count">{{ genre.count }} films</div>
                            </div>
                            <component :is="genre.icon" :size="18" class="genre-icon" />
                        </div>
                    </div>
                </section>

                <!-- Section 4: Directors -->
                <section class="section-container">
                    <header class="section-header">
                        <h2 class="section-title">Directors in your collection</h2>
                        <router-link to="/search" class="see-all-link">View all →</router-link>
                    </header>

                    <div class="director-grid">
                        <div
                            v-for="director in topDirectors"
                            :key="director.name"
                            class="director-card-new"
                            @click="router.push(`/search?director=${director.name}`)"
                        >
                            <!-- Background posters stack -->
                            <div class="director-bg-wrapper">
                                <div
                                    v-for="(movie, index) in director.movies.slice(0, 3)"
                                    :key="movie.imdbId"
                                    class="director-bg-poster"
                                    :class="'p-' + index"
                                    :style="{backgroundImage: `url(${getPosterUrl(movie)})`}"
                                ></div>
                            </div>

                            <!-- Glass Overlay -->
                            <div class="director-glass-overlay">
                                <div class="director-bottom-info">
                                    <span class="director-label">DIRECTOR</span>
                                    <h3 class="director-name-new">{{ director.name }}</h3>
                                    <div class="director-meta">
                                        <span class="count-pill">{{ director.count }} films</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 5: Recommended New Movies -->
                <section class="section-container" v-if="!isEmpty">
                    <header class="section-header">
                        <h2 class="section-title recs-title">Recommended New Movies</h2>
                    </header>

                    <!-- Loading state -->
                    <div v-if="recommendationsLoading" class="recs-loading">
                        <div class="recs-spinner"></div>
                        <span>Analysing your taste profile…</span>
                    </div>

                    <!-- Error state -->
                    <div v-else-if="recommendationsError" class="recs-error">
                        <span>⚠️ {{ recommendationsError }}</span>
                    </div>

                    <!-- Clusters -->
                    <div v-else-if="recommendedClusters.length > 0" class="recs-clusters">
                        <div v-for="cluster in recommendedClusters" :key="cluster.mood" class="recs-cluster">
                            <div class="recs-cards">
                                <RecommendationCard
                                    v-for="movie in cluster.recommendations"
                                    :key="movie.imdbId"
                                    :movie="movie"
                                    @click="openImdb(movie.imdbId)"
                                />
                            </div>
                            <!-- Subtle taste hint beneath each cluster -->
                            <p class="recs-cluster-hint">because you enjoy · {{ formatMoodHint(cluster.mood) }}</p>
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div v-else class="recs-empty">
                        Add more movies to your collection to unlock personalised recommendations.
                    </div>
                </section>
            </div>
        </div>

        <!-- Global Floating Refresh Button -->
        <button v-if="!isEmpty" class="global-refresh-btn" @click="reshuffle" title="Curate a new night">
            <RefreshCcw :size="24" />
        </button>
    </div>
</template>

<style scoped>
.home-container {
    height: 100%;
    position: relative;
}

.global-refresh-btn {
    position: fixed;
    bottom: 40px;
    right: 40px;
    z-index: 50;
    background: var(--accent-four);
    color: #101010;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.global-refresh-btn:hover {
    transform: rotate(30deg) scale(1.1);
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.8),
        0 0 20px rgba(236, 130, 0, 0.5);
}

.scroll-content {
    display: flex;
    flex-direction: column;
    background-color: var(--bg-dark);
}

.content-sections {
    padding: 32px 32px 64px 32px;
    background-color: var(--bg-dark);
}

/* Section Common */
.section-container {
    margin-top: 40px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-title {
    font-size: 18px;
    font-weight: 700;
    color: white;
    margin: 0;
}

.see-all-link {
    color: var(--accent-four);
    text-decoration: none;
    font-size: 14px;
}

.see-all-link:hover {
    opacity: 0.8;
}

/* Section 1: Stats */

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.stat-card {
    background-color: #1a1a1a;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
}

.stat-card:hover {
    border-color: var(--accent-four);
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: white;
    line-height: 1;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted-mid);
    text-transform: uppercase;
    margin-top: 4px;
}

.stat-trend {
    font-size: 12px;
    color: var(--accent-four);
    margin-top: 12px;
}

/* Section 2: Mosaic */
.mosaic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    height: 408px;
}

.mini-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 16px;
}

.mosaic-card {
    border-radius: 12px;
    overflow: hidden;
    background-size: cover;
    background-position: center;
    position: relative;
    cursor: pointer;
    border: 1px solid var(--bg-dark);
}

.mosaic-card:hover {
    border: 1px solid var(--accent-four);
}

.mosaic-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%);
    z-index: 1;
}

.mosaic-overlay {
    position: relative;
    z-index: 2;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.mosaic-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.rating-badge {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    color: var(--accent-four);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
}

.rating-badge.small {
    font-size: 11px;
    padding: 2px 6px;
}

.top-rated-pill {
    background: var(--accent-four);
    color: black;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.top-rated-pill.small {
    padding: 2px 6px;
    font-size: 8px;
}

.movie-title {
    color: white;
    font-size: 24px;
    font-weight: 700;
    margin: 0;
}

.movie-title.small {
    font-size: 14px;
}

.movie-meta {
    color: var(--muted-mid);
    font-size: 14px;
    margin: 4px 0 0 0;
}

.movie-meta.small {
    font-size: 11px;
}

/* Section 3: Mood */
.mood-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.genre-tile {
    height: 72px;
    border-radius: 12px;
    padding: 12px 18px;
    position: relative;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.genre-tile::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 85% 50%, var(--genre-color), transparent 60%);
    opacity: 0.15;
    transition: opacity 0.3s ease;
}

.genre-tile:hover {
    background: rgba(255, 255, 255, 0.05);
}

.genre-tile:hover::before {
    opacity: 0.35;
}

.genre-icon {
    position: absolute;
    top: 10px;
    right: 12px;
    color: var(--muted-mid);
    opacity: 0.4;
    stroke-width: 1.5px;
}

.genre-info {
    z-index: 2;
}

.genre-name {
    font-size: 16px;
    font-weight: 600;
    color: white;
    letter-spacing: -0.2px;
}

.genre-count {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted-mid);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Section 4: Directors */
.director-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.director-card-new {
    position: relative;
    height: 320px;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: #0a0a0a;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.director-card-new:hover {
    border-color: var(--accent-four);
}

.director-bg-wrapper {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
}

.director-bg-poster {
    position: absolute;
    width: 140px;
    height: 200px;
    background-size: cover;
    background-position: center;
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    filter: blur(1px) brightness(0.5);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.director-bg-poster.p-0 {
    z-index: 3;
    transform: translate(0, 5px);
    filter: blur(0px) brightness(0.7);
}

.director-bg-poster.p-1 {
    z-index: 2;
    transform: translate(-50px, -5px) rotate(-12deg);
    opacity: 0.7;
}

.director-bg-poster.p-2 {
    z-index: 1;
    transform: translate(50px, 15px) rotate(12deg);
    opacity: 0.7;
}

.director-card-new:hover .director-bg-poster.p-0 {
    transform: translate(0, -10px) scale(1.1);
    filter: blur(0) brightness(0.9);
}

.director-card-new:hover .director-bg-poster.p-1 {
    transform: translate(-70px, -20px) rotate(-20deg) scale(1.05);
    opacity: 0.4;
}

.director-card-new:hover .director-bg-poster.p-2 {
    transform: translate(70px, 20px) rotate(20deg) scale(1.05);
    opacity: 0.4;
}

.director-glass-overlay {
    position: absolute;
    inset: 0;
    z-index: 4;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.85) 100%);
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 24px;
    transition: all 0.4s ease;
}

.director-card-new:hover .director-glass-overlay {
    backdrop-filter: blur(0px);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.95) 100%);
}

.director-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--accent-four);
    letter-spacing: 2px;
    margin-bottom: 4px;
    display: block;
    opacity: 0.8;
}

.director-name-new {
    font-size: 20px;
    font-weight: 800;
    color: white;
    margin: 0;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.director-meta {
    margin-top: 12px;
}

.count-pill {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.director-card-new:hover .count-pill {
    background: var(--accent-four);
    color: black;
    transform: scale(1.05);
}

/* Empty State */
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 64px);
}

.empty-content {
    text-align: center;
    background-color: var(--bg-light);
    padding: 48px;
    border-radius: 12px;
    max-width: 400px;
}

.empty-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--accent-four);
    margin-bottom: 8px;
}

.empty-subtitle {
    color: var(--muted-mid);
    margin-bottom: 24px;
}

.primary-btn {
    background-color: var(--accent-four);
    color: rgb(30, 30, 30);
    font-weight: 600;
    padding: 10px 24px;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.primary-btn:hover {
    opacity: 0.9;
}

/* ── Section 5: Recommended New Movies ────────────────────────────────────── */

.recs-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.recs-icon {
    color: var(--accent-four);
    flex-shrink: 0;
}

.recs-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--muted-mid);
    font-size: 14px;
    padding: 20px 0;
}

.recs-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--accent-four);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.recs-error {
    color: #ff6b6b;
    font-size: 13px;
    padding: 12px 0;
}

.recs-empty {
    color: var(--muted-mid);
    font-size: 14px;
    padding: 16px 0;
}

.recs-clusters {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.recs-cluster {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.recs-cluster-mood {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--accent-four);
    text-transform: uppercase;
    opacity: 0.8;
}

.recs-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

/* Subtle taste hint under each cluster row */
.recs-cluster-hint {
    font-size: 11px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.2);
    margin: 8px 0 0;
    letter-spacing: 0.3px;
}
</style>
