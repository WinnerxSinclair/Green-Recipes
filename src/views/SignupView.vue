<script setup>
import { ref } from 'vue'
import { firebaseAppAuth, db } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, updateProfile } from 'firebase/auth'
import router from '../router'

const email = ref('')
const username = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')

const goLogin = () => router.push('/login')
const createAccount = () => {
 
    // if(password.value != passwordConfirmation.value) {
    //     return errorMessage.value = "Passwords do not match"
    // }
    createUserWithEmailAndPassword(firebaseAppAuth, email.value, password.value)
        .then((data) => {
            if(username.value != '') {
                updateProfile(data.user,{
                    displayName:username.value
                }).then(() => {
                    console.log("profile updated successfully")
                })
            }
            const userRef = doc(db, "users", data.user.uid);
            setDoc(userRef, {
                email: email.value,
                username: username.value || null,
                collectionList: [
                    {
                      name: 'Favorites',
                      img:''
                    }]
            }).then(() => {
                console.log("User added to database");
                router.push('/').then(() => {
                    window.location.reload();
                });
            }).catch((error) => {
                console.error("Error adding user to database", error);
            });
        }).catch((error) => {
            switch(error.code) {
                case "auth/email-already-in-use":
                    errorMessage.value = "Email is already in use"  
                    break
                // case "auth/weak-password":
                //     errorMessage.value = "Password is too weak"
                //     break
                default:
                    errorMessage.value = "An error occured, please try again later"
            }
            console.log(error.code)
        })
}

const useGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(firebaseAppAuth, provider)
        .then((result) => {
            // User is signed in
            const user = result.user;

            // Create or update the user document
            const userRef = doc(db, "users", user.uid);
            setDoc(userRef, {
                email: user.email,
                username: user.displayName || null,
                collectionList: [
                    {
                      name: 'Favorites',
                      img:''
                    }
            ]
                // any other user details you want to store
            }, { merge: true }) // merge: true ensures that existing data is not overwritten
            .then(() => {
                console.log("User added to database");
                router.push('/')
            }).catch((error) => {
                console.error("Error adding user to database", error);
            });
        }).catch((err) => {
            console.error("Error with Google sign in", err);
            // Handle errors here, such as displaying a message to the user
        })
}
</script>
<template>
  <main class="grid-c">
    <img src="../assets/nature.webp" alt="nature picture" class="nature">
    <form @submit.prevent="createAccount" class="flex column">
      <h1 class="c-ff">Welcome to Green Recipes</h1>
      <label for="username">Display Name</label>
      <input type="text" v-model="username" id="username">

      <label for="email">Email</label>
      <input type="email" v-model="email" id="email">

      <label for="password">Password</label>
      <input type="password" v-model="password" id="password">

      <button type="submit" class="main-btn-full margin-top">Create Account</button>
    
      <div class="flex-c-c click grey rc custom-google margin-top" @click="useGoogle">
        <img src="../assets/icons/google.png" class="icon-small" alt="">
      </div>
      <br>
      <div class="click blue" @click="goLogin">Have an account? Login here</div>
    </form>
  </main>
</template>

<style scoped>
@import '../assets/login.css';
</style>