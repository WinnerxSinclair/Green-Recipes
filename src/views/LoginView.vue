<script setup>
import { ref } from 'vue'
import { firebaseAppAuth } from '@/firebase'
import { signInWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import router from '../router'

const user = ref(null)
const isAdmin = ref(false)
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const submitToSignUp = () => router.push('/signup');
const submitLogin = async () => {
    email.value = email.value.trim()
    await signInWithEmailAndPassword(firebaseAppAuth, email.value, password.value)
        .then((data) => {
            console.log("Login Successful")
            router.push('/')
        }).catch((error) => {
            if(error.code == "auth/invalid-login-credentials") {
                errorMessage.value = "Wrong Email or Password";
                password.value = "";
            }
            console.log(error.code)
        })
}
const submitSignInWIthGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(firebaseAppAuth, provider)
        .then((result) => {
            console.log(result.user)
            router.push('/')
        }).catch((err) => {
            err
        })
}

onAuthStateChanged(firebaseAppAuth, currentUser => {
    user.value = currentUser
    if(currentUser) {
        currentUser.getIdTokenResult().then(idTokenResult => {
            isAdmin.value = idTokenResult.claims.admin ? true : false
        })
    }
})

const goSignup = () => router.push('/signup')
</script>

<template>
  <main class="grid-c">
    <img src="../assets/nature.webp" alt="nature picture" class="nature">
    <form @submit.prevent="submitLogin" class="flex column">
      <h1 class="c-ff">Welcome to Green Recipes</h1>
      <label>Email</label>
      <input type="email" v-model="email">

      <label>Password</label>
      <input type="password" v-model="password">

      <button type="submit" class="main-btn-full margin-top">Sign in</button>
   
      <div class="flex-c-c click custom-google margin-top" @click="submitSignInWIthGoogle">
        <img src="../assets/icons/google.png" class="icon-small" alt="">
       
      </div>
      <br>
      <div class="click blue" @click="goSignup">No Account? Sign up here.</div>
    </form>
  </main>
</template>

<style scoped>
@import '../assets/login.css';

</style>