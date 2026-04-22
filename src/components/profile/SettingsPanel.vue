<script setup lang="ts">
import {ref, onMounted} from "vue";
import {invoke} from "@tauri-apps/api/core";
import {useSettingsStore} from "../../stores/settings";
import {useToastStore} from "../../stores/toast";
import {useImportStore} from "../../stores/import";
import {FolderOpen, X, RefreshCw, Github} from "lucide-vue-next";
import {open} from "@tauri-apps/plugin-dialog";

const settingsStore = useSettingsStore();
const toastStore = useToastStore();
const importStore = useImportStore();

const isKeyValid = ref<boolean | null>(null);
const isLimitExceeded = ref(false);
const isValidating = ref(false);
const localKey = ref("");
const appVersion = ref("");
const updateInfo = ref<any>(null);

onMounted(async () => {
    localKey.value = settingsStore.omdbApiKey || "";
    appVersion.value = await invoke("get_app_version");

    if (localKey.value) {
        validateApiKey(localKey.value);
    }
});

async function validateApiKey(key: string) {
    if (!key.trim()) {
        isKeyValid.value = null;
        return;
    }

    isValidating.value = true;
    isLimitExceeded.value = false;
    try {
        // We send a tiny request to check if the key works
        const response = await fetch(`https://www.omdbapi.com/?apikey=${key}&i=tt0000001`);
        const data = await response.json();

        if (data.Response === "True") {
            isKeyValid.value = true;
            isLimitExceeded.value = false;
        } else if (data.Error === "Request limit reached!") {
            isKeyValid.value = true; // Key is technically valid if we reached the limit
            isLimitExceeded.value = true;
        } else if (data.Error === "Invalid API key!") {
            isKeyValid.value = false;
        } else {
            // Some other error (e.g. Movie not found), key is likely valid
            isKeyValid.value = true;
        }
    } catch (e) {
        console.error("API validation failed", e);
        // Could be network error, we don't necessarily want to mark it invalid
        // But for simplicity in this case we'll keep it null or false
    } finally {
        isValidating.value = false;
    }
}

async function saveKey() {
    if (localKey.value.trim() !== "") {
        await settingsStore.saveApiKey(localKey.value);
        toastStore.show("success", "API key saved");
        validateApiKey(localKey.value);
    }
}

async function chooseDir() {
    const result = await invoke<string>("set_watched_directory").catch(() => null);
    if (result) {
        settingsStore.watchedDirectory = result;
        toastStore.show("success", "Watched directory updated");
        // Start initial sync as soon as directory is set
        syncNow();
    }
}

async function clearDir() {
    await settingsStore.clearWatchedDirectory();
    toastStore.show("success", "Watched directory cleared");
}

async function syncNow() {
    try {
        toastStore.show("info", "Syncing collection...");
        await invoke("sync_watched_directory_now");
        // Backend emits events to update the status bar at the bottom
    } catch (e: any) {
        toastStore.show("warning", "Sync failed: " + e);
    }
}

async function checkUpdates() {
    try {
        updateInfo.value = await invoke("check_for_updates");
    } catch (e: any) {
        toastStore.show("warning", "Could not check for updates");
    }
}

function openUrl(url: string) {
    invoke("open_external", {url});
}

async function clearDatabase() {
    if (
        confirm(
            "Are you sure you want to clear the entire database? This will remove all movies and reset all settings (EXCEPT your API key). This cannot be undone.",
        )
    ) {
        try {
            await invoke("clear_database");
            await settingsStore.load();
            const movieStore = (await import("../../stores/movies")).useMovieStore();
            await movieStore.load();
            toastStore.show("success", "Database cleared successfully");
        } catch (e: any) {
            toastStore.show("warning", "Failed to clear database: " + e);
        }
    }
}

async function importImdb() {
    try {
        const selected = await open({
            multiple: false,
            filters: [
                {
                    name: "CSV Documents",
                    extensions: ["csv"],
                },
            ],
        });

        if (selected) {
            toastStore.show("info", "Starting IMDb import...");
            await invoke("import_imdb_csv", {filePath: selected});
            // importStore handles the status bar update via events
        }
    } catch (e: any) {
        toastStore.show("warning", "Import failed: " + e);
    }
}
</script>

<template>
    <div class="settings-panel">
        <!-- Header Section -->
        <div class="settings-header">
            <h2 class="title text-gradient">Application Settings</h2>
            <p class="subtitle">Manage your preferences, API keys, and library synchronization.</p>
        </div>

        <!-- OMDB API Card -->
        <div class="settings-card">
            <div class="card-header">
                <div class="icon-wrapper ghost">
                    <Github :size="20" />
                </div>
                <div class="card-title-group">
                    <h3>OMDb API Configuration</h3>
                    <p>Required to fetch high-quality movie metadata and posters.</p>
                </div>
            </div>

            <div class="card-body">
                <div class="input-group">
                    <div class="input-wrapper">
                        <input
                            type="password"
                            v-model="localKey"
                            placeholder="Enter your OMDb API key..."
                            class="modern-input"
                        />
                    </div>
                    <button class="action-btn primary" @click="saveKey" :disabled="!localKey.trim()">Save Key</button>
                </div>

                <div class="info-footer">
                    <div class="status-badges-group">
                        <div v-if="isValidating" class="status-badge warning">
                            <RefreshCw :size="12" class="rotating" />
                            Validating key...
                        </div>
                        <template v-else-if="settingsStore.omdbApiKey">
                            <div v-if="isKeyValid === true" class="status-badge success">
                                <div class="dot"></div>
                                Key Active & Valid: ••••••••{{ settingsStore.omdbApiKey.slice(-4) }}
                            </div>
                            <div v-else-if="isKeyValid === false" class="status-badge danger">
                                <div class="dot"></div>
                                Invalid API Key
                            </div>
                            <div v-else class="status-badge success">
                                <div class="dot"></div>
                                Key Active: ••••••••{{ settingsStore.omdbApiKey.slice(-4) }}
                            </div>

                            <div v-if="isLimitExceeded || settingsStore.apiLimitReachedOn" class="status-badge danger">
                                <div class="dot"></div>
                                Daily Limit Reached
                            </div>
                            <div v-else class="status-badge success">
                                <div class="dot"></div>
                                Daily Limit: OK
                            </div>
                        </template>
                        <div v-else class="status-badge warning">
                            <div class="dot"></div>
                            No API key configured
                        </div>
                    </div>
                    <a href="#" class="inline-link" @click.prevent="openUrl('https://www.omdbapi.com/')">
                        Get a free key at omdbapi.com <i class="arrow">→</i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Library Sync Card -->
        <div class="settings-card">
            <div class="card-header">
                <div class="icon-wrapper ghost">
                    <FolderOpen :size="20" />
                </div>
                <div class="card-title-group">
                    <h3>Collection Directory</h3>
                    <p>The source folder where your movie files are stored.</p>
                </div>
            </div>

            <div class="card-body">
                <div v-if="settingsStore.watchedDirectory" class="directory-display">
                    <div class="path-box">
                        <span class="path-label">Current Path:</span>
                        <code class="path-text">{{ settingsStore.watchedDirectory }}</code>
                    </div>

                    <div class="button-row">
                        <button class="action-btn primary" @click="syncNow">
                            <RefreshCw :size="16" />
                            Sync Library
                        </button>
                        <div class="button-group">
                            <button class="action-btn outline" @click="chooseDir">Change Folder</button>
                            <button class="action-btn outline danger" @click="clearDir"><X :size="16" /> Remove</button>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-directory">
                    <p>No directory selected. Start by choosing where your movies are located.</p>
                    <button class="action-btn primary large" @click="chooseDir">
                        <FolderOpen :size="18" />
                        Select Collection Folder
                    </button>
                </div>
            </div>
        </div>

        <!-- IMDb Import Card -->
        <div class="settings-card">
            <div class="card-header">
                <div class="icon-wrapper ghost">
                    <span class="imdb-logo-text">IMDb</span>
                </div>
                <div class="card-title-group">
                    <h3>Import movies from IMDb</h3>
                    <p>Import your movies from an IMDb watchlist export CSV.</p>
                </div>
            </div>

            <div class="card-body">
                <div class="importer-content">
                    <p class="import-description">
                        Export your watchlist from IMDb as a CSV file and select it here. We'll automatically fetch
                        metadata and posters for all movies.
                    </p>
                    <button
                        class="action-btn outline full-width"
                        @click="importImdb"
                        :disabled="importStore.isImporting"
                    >
                        <RefreshCw :size="16" v-if="importStore.isImporting" class="rotating" />
                        <FolderOpen :size="16" v-else />
                        {{ importStore.isImporting ? "Importing..." : "Select IMDb CSV" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- About & Updates Row -->
        <div class="settings-row">
            <!-- About Card -->
            <div class="settings-card about-card">
                <div class="card-header">
                    <img src="../../assets/logo.svg" class="mini-logo" alt="Logo" />
                    <div class="card-title-group">
                        <h3>About</h3>
                        <p>Movie Collection Visualizer</p>
                    </div>
                </div>
                <div class="card-body">
                    <div class="about-info-list">
                        <div class="info-item">
                            <span class="label">Version</span>
                            <span class="value">{{ appVersion }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">License</span>
                            <span class="value">GPL-3.0</span>
                        </div>
                    </div>
                    <button
                        class="action-btn outline full-width mt-4"
                        @click="openUrl('https://github.com/ISO53/Movie-Collection-Visualizer')"
                    >
                        <Github :size="16" /> Project GitHub
                    </button>
                </div>
            </div>

            <!-- Updates Card -->
            <div class="settings-card update-card">
                <div class="card-header">
                    <div class="icon-wrapper ghost">
                        <RefreshCw :size="20" />
                    </div>
                    <div class="card-title-group">
                        <h3>Updates</h3>
                        <p>Stay on the latest version.</p>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="updateInfo" class="update-status">
                        <div v-if="!updateInfo.has_update" class="up-to-date">
                            <div class="status-badge success">Up to date</div>
                        </div>
                        <div v-else class="new-update-available">
                            <p class="new-version">Version {{ updateInfo.version }} is here!</p>
                            <button class="action-btn primary mt-2" @click="openUrl(updateInfo.url)">
                                Download Update
                            </button>
                        </div>
                    </div>
                    <button v-else class="action-btn outline full-width mt-2" @click="checkUpdates">
                        Check for Updates
                    </button>
                </div>
            </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-card danger-card">
            <div class="card-header">
                <div class="icon-wrapper danger-bg">
                    <X :size="20" />
                </div>
                <div class="card-title-group">
                    <h3>Danger Zone</h3>
                    <p>Actions that cannot be undone.</p>
                </div>
            </div>
            <div class="card-body">
                <div class="danger-content">
                    <p>
                        Reset the application database. This will remove all indexed movies and history. Your API key
                        will be preserved.
                    </p>
                    <button class="action-btn danger-solid" @click="clearDatabase">Factory Reset Database</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 900px;
    padding-bottom: 60px;
}

.settings-header {
    margin-bottom: 8px;
}

.text-gradient {
    background: linear-gradient(135deg, var(--text-main) 0%, var(--accent-three) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.subtitle {
    color: var(--muted-mid);
    font-size: 15px;
    margin-top: 4px;
}

/* Card Styling */
.settings-card {
    background: var(--bg-light);
    border-radius: 12px;
    overflow: hidden;
}

.card-header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-wrapper {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-wrapper.primary {
    background: rgba(236, 130, 0, 0.1);
    color: var(--accent-four);
}
.icon-wrapper.secondary {
    background: rgba(229, 186, 115, 0.1);
    color: var(--accent-three);
}
.icon-wrapper.ghost {
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted-mid);
}
.icon-wrapper.danger-bg {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.card-title-group h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 2px;
}

.card-title-group p {
    font-size: 13px;
    color: var(--muted-mid);
}

.card-body {
    padding: 0 24px 24px 24px;
}

/* Input Styling */
.input-group {
    display: flex;
    gap: 12px;
}

.input-wrapper {
    position: relative;
    flex: 1;
}

.modern-input {
    width: 100%;
    height: 44px;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    color: var(--text-main);
    font-size: 14px;
}

.modern-input:focus {
    background: rgba(0, 0, 0, 0.4);
}

/* Button Styling */
.action-btn {
    height: 44px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    user-select: none;
}

/* Primary Button Style (Save Key, Sync Library, Download Update) */
.action-btn.primary {
    background: var(--accent-four);
    color: #000;
}

.action-btn.primary:hover {
    background: var(--accent-three);
}

/* Outline/Secondary Button Style (Change, Remove, GitHub, Check for Updates) */
.action-btn.outline {
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-main);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.action-btn.outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

/* Specific Danger States for Outline Buttons */
.action-btn.outline.danger {
    color: #ef4444;
}

.action-btn.outline.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.4);
}

/* Solid Danger Button Style */
.action-btn.danger-solid {
    background: #ef4444;
    color: #fff;
}

.action-btn.danger-solid:hover {
    background: #dc2626;
}

.action-btn.large {
    width: 100%;
    height: 52px;
    font-size: 16px;
}

.full-width {
    width: 100%;
}

/* Info & Status Styling */
.info-footer {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-badges-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.success {
    background: rgba(34, 197, 94, 0.1);
    color: #4ade80;
}
.status-badge.warning {
    background: rgba(234, 179, 8, 0.1);
    color: #facc15;
}
.status-badge.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.inline-link {
    font-size: 13px;
    color: var(--accent-three);
    text-decoration: none;
    font-weight: 500;
}

.inline-link:hover {
    text-decoration: underline;
}

/* Directory Styling */
.path-box {
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.path-label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    color: var(--muted-mid);
    margin-bottom: 4px;
    letter-spacing: 0.05em;
}

.path-text {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 13px;
    color: var(--text-main);
    word-break: break-all;
}

.button-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.button-group {
    display: flex;
    gap: 8px;
}

.empty-directory {
    text-align: center;
    padding: 20px 0;
}

.empty-directory p {
    color: var(--muted-mid);
    margin-bottom: 20px;
}

/* Row Styling */
.settings-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.about-info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.info-item .label {
    color: var(--muted-mid);
    font-size: 13px;
}
.info-item .value {
    color: var(--text-main);
    font-size: 13px;
    font-weight: 600;
}

.mini-logo {
    width: 32px;
    height: 32px;
}

/* Danger Zone Styling */
.danger-card {
    background: rgba(239, 68, 68, 0.02) !important;
    border: 1px solid rgba(239, 68, 68, 0.2) !important;
}

.danger-content p {
    font-size: 13px;
    color: var(--muted-mid);
    margin-bottom: 20px;
    line-height: 1.5;
}

.mt-4 {
    margin-top: 16px;
}
.mt-2 {
    margin-top: 8px;
}

/* IMDb Section Styling */
.imdb-logo-text {
    font-weight: 900;
    font-size: 11px;
    letter-spacing: -0.2px;
    color: var(--muted-mid);
}

.importer-content {
    background: rgba(0, 0, 0, 0.2);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.03);
}

.import-description {
    font-size: 13px;
    color: var(--muted-mid);
    margin-bottom: 20px;
    line-height: 1.6;
}
.rotating {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
