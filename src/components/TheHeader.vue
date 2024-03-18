<script setup>
import router from "../router"
import { signOut, onAuthStateChanged } from "firebase/auth";
import {ref, onMounted, onUnmounted} from "vue"
import {firebaseAppAuth} from '@/firebase'
import TheMenuOption from "./TheMenuOption.vue";

const goHome = () => router.push('/');
const goComm = () => router.push('/');
const goLogin = () => router.push('/login')
const goForm = () => router.push('/form')


const user = ref(null)
const userId = ref(null)
const showMenu = ref(false)

onAuthStateChanged(firebaseAppAuth, currentUser => {
  if(currentUser){
    user.value = currentUser
    userId.value = currentUser.uid
  }
})
const goProf = (uid) => router.push(`/${uid}/collections`)

const signOutClicked = async () => {
     await signOut(firebaseAppAuth).then((res) => {}).catch((error) =>{
        console.log(error.code)
        alert(error.message)
     })
     showMenu.value = false
     user.value = null;
     router.push('/');
}

const profileClicked = () => {showMenu.value = true; console.log(showMenu.value)}

const menuRef = ref(null); // Reference to the menu element

const handleClickOutside = (event) => {
  console.log('xd')
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="main-container header-bg flex-sb align-c alt">
    <div class="content pad flex align-c gap-big jockey">
      <div class="title click cool-font" @click="goHome">GREEN RECIPES</div>
      <a @click="goProf(userId)" class="margin-left">Your Collections</a>
      <a @click="goForm">Add Recipe</a>
    </div>

    <button v-if="user" class="c-margin" @click.stop="profileClicked">{{ user.displayName }}</button>
    <button v-else class="c-margin" @click="goLogin">Login</button>
  </div>

  <div class="menu" v-if="showMenu" ref="menuRef">
    <TheMenuOption word="Settings"> 
      <img class="icon-white" src="../assets/icons/heart-full.svg" alt="">
       
    </TheMenuOption>
    <TheMenuOption word="Signout" @menuFunctionX="signOutClicked"></TheMenuOption>
  </div>
  
</template>

<style scoped>
.menu{
  width:10%;
  position:absolute;
  right:0;
}
.main-container{
  width:100vw;
}
.c-margin{
  border-radius:.2rem;
  margin-right:2rem;
  padding: .2em .6em;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  background:rgb(12, 219, 12);
  border:none;
}

.header-bg{
  background:rgb(36, 146, 36);
}
</style>