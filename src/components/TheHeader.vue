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

const profileClicked = () => {
  showMenu.value = true; 
  document.addEventListener('click', handleClickOutside);
}

const menuRef = ref(null); // Reference to the menu element

const handleClickOutside = (event) => {
  console.log('xd')
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showMenu.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const mobileMenu = ref(false);
</script>

<template>
  <div class="main-container header-bg flex align-c alt">
    <div class="burger-container click" @click="mobileMenu = !mobileMenu">
      <img src="../assets/burger.svg" alt="mobile menu opener/closer" class="icon-white icon-small burger">
    </div>
    <div class="content pad flex align-c ff-2">
      <div @click="goHome" class="click flex align-c">
        <img src="../assets/icons/frog.png" class="icon-small" alt="">
        <div class="main-title acc ps-l">Green Recipes</div>
      </div>
      <div class="c-l flex gap-big">
        <a @click="goProf(userId)" class="ml-auto hide white-blur trans">Your Collections</a>
        <a @click="goForm" class="hide white-blur trans">Add Recipe</a>
      </div>
    </div>
    

    <div class="login-container">
      <button v-if="user && user.displayName" class="c-margin" @click.stop="profileClicked">{{ user?.displayName }}</button>
      <button v-else class="c-margin" @click="goLogin">Login</button>
    </div>
  </div>

  <div class="menu" v-if="showMenu" ref="menuRef">
    <TheMenuOption word="Settings"> 
      <img class="icon-white" src="../assets/icons/heart-full.svg" alt="">
       
    </TheMenuOption>
    <TheMenuOption word="Signout" @menuFunctionX="signOutClicked"></TheMenuOption>
  </div>
  <div class="overlay" v-if="mobileMenu" @click="mobileMenu = false">
    <div class="mm white">
      <a @click="goProf(userId)">Your Collections</a>
      <a @click="goForm">Add a Recipe</a>
    </div>
  </div>
</template>

<style scoped>
.c-l{
  margin-left:5rem;
}
.acc{
  color: rgb(161, 251, 65);
}
.main-title{
  font-family:RougeScript;
  font-size:2rem;
  min-width:180px;
}
.mm{
  display:none;
}
.mm a{
  padding:1rem;
  font-family:Jockey;
  letter-spacing: 1px;
}
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

.burger-container{
  display:none;
  z-index:999;
}

.login-container{
  margin-left:auto;
}


@media(max-width: 768px){
  .burger-container{
    display:block;
  }
  .hide{
    display:none;
  }
  .mm{
    display: flex;
    flex-direction: column;
    position:fixed;
    align-items:center;
    min-width: 100vw;
    background-color: rgb(0, 0, 0);
    height:auto;
    top: var(--header-height);
    z-index:999;
    justify-content: center;
  }
}
</style>