<script setup lang="ts">
import {Home, Search, User, Settings} from "lucide-vue-next";
import {useRoute, useRouter} from "vue-router";

const route = useRoute();
const router = useRouter();

function isActive(path: string) {
    if (path === "/") return route.path === "/";
    return route.path.startsWith(path);
}

function goSettings() {
    router.push("/profile?tab=settings");
}
</script>

<template>
    <aside class="sidebar group">
        <div class="sidebar-top">
            <div class="logo-container">
                <img src="../../assets/logo.svg" class="logo-img" alt="MCV Logo" />
                <span class="logo-text">MCV</span>
            </div>

            <nav class="nav-links">
                <router-link to="/" class="nav-item" :class="{active: isActive('/')}">
                    <Home class="icon" :size="20" />
                    <span class="label">Home</span>
                </router-link>
                <router-link to="/search" class="nav-item" :class="{active: isActive('/search')}">
                    <Search class="icon" :size="20" />
                    <span class="label">Search</span>
                </router-link>
                <router-link to="/profile" class="nav-item" :class="{active: isActive('/profile')}">
                    <User class="icon" :size="20" />
                    <span class="label">Profile</span>
                </router-link>
            </nav>

            <div class="divider"></div>
        </div>

        <div class="sidebar-bottom">
            <button class="nav-item" @click="goSettings">
                <Settings class="icon" :size="20" />
                <span class="label">Settings</span>
            </button>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    width: 64px;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--bg-dark-glass);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    z-index: 50;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
}

.sidebar:hover {
    width: 200px;
}

.sidebar-top,
.sidebar-bottom {
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    gap: 8px;
}

.logo-container {
    display: flex;
    align-items: center;
    padding: 0 18px;
    height: 48px;
    margin-bottom: 24px;
    color: var(--accent-four);
}

.logo-img {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
}

.logo-text {
    font-weight: 700;
    font-size: 18px;
    margin-left: 20px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar:hover .logo-text,
.sidebar:hover .label {
    opacity: 1;
}

.nav-item {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 22px;
    text-decoration: none;
    color: var(--muted-mid);
    background: transparent;
    width: 100%;
    text-align: left;
}

.nav-item:hover {
    color: var(--text-main);
    background-color: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
    color: var(--accent-four);
}

.nav-item.active .icon {
    color: var(--accent-four);
}

.icon {
    flex-shrink: 0;
}

.icon-wrapper {
    position: relative;
    display: flex;
}

.badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background-color: var(--accent-four);
    border-radius: 50%;
}

.label {
    margin-left: 22px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.divider {
    height: 1px;
    background-color: var(--muted-dark);
    margin: 16px;
}
</style>
