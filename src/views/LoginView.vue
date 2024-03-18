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
  <main class="layout-small">
    <form @submit.prevent="submitLogin" class="flex column">
      <label>Email</label>
      <input type="email" v-model="email">

      <label>Password</label>
      <input type="password" v-model="password">

      <button type="submit" class="main-btn-full margin-top">Sign in</button>
   
      <div class="flex align-c click grey custom-google margin-top">
        <img src="../assets/icons/google.png" class="icon-small" alt="">
        <div class="margin-left alt fs-400" @click="submitSignInWIthGoogle">Sign in with Google</div>
      </div>
      <br>
      <div class="click" @click="goSignup">No Account? Sign up here.</div>
    </form>
  </main>
</template>

<style scoped>
@import '../assets/login.css';

.custom-google{
  padding:.5rem;
}
</style>