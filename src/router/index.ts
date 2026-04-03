import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: HomeView 
    },
    { 
      path: '/search', 
      component: SearchView,
      props: route => ({ prefilterGenre: route.query.genre }) 
    },
    { 
      path: '/profile', 
      component: ProfileView,
      props: route => ({ tab: route.query.tab ?? 'stats' }) 
    }
  ]
})

export default router
