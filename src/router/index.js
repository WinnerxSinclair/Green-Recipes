import { createRouter, createWebHistory } from 'vue-router'
import { firebaseAppAuth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

function requireLogin(to, from, next ){
  const unsubscribe = onAuthStateChanged(firebaseAppAuth, user => {
    unsubscribe()
    if(!user){
      console.log("no user, route to login")
      next('/login')
    } else {
      next()
    }
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/:slug',
      name: 'recipe',
      component: () => import('../views/RecipeView.vue')
    },
    {
      path: '/:uid/collections',
      name: 'usercollections',
      component: () => import('../views/UserCollectionsView.vue'),
      beforeEnter: requireLogin
    },
    {
      path: '/:uid/collections/:collection',
      name: 'userprofile',
      component: () => import('../views/UserRecipesView.vue')
    },
    {
      path: '/:uid/collections/:collection/:slug',
      name: 'userrecipe',
      component: () => import('../views/RecipeView.vue')
    },
    {
      path: '/form',
      name: 'form',
      component: () => import('../views/FormView.vue'),
      beforeEnter: requireLogin
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue')
    },
  ]
})

export default router