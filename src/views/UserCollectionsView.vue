<script setup>
import {collection, onSnapshot, doc, getDoc} from "firebase/firestore"
import {db} from "../firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref, onMounted, computed} from 'vue'
import {useRoute} from 'vue-router'
import TheRecipe from '../components/TheRecipe.vue'

const route = useRoute();
const routeCollections = route.params.uid; 

const userCollections = ref([])
const auth = getAuth();
const userId = ref(null); 
const userName = ref(null);
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId.value = user.uid;
    userName.value = user.displayName;
    await fetchUserCollections();
  } else {
   
  }
});

async function fetchUserCollections() {
  const userDocRef = doc(db, `users/${routeCollections}`);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const collectionsList = userDoc.data().collectionList || [];
    userCollections.value = collectionsList;
    // You can now use userCollections to fetch data from each collection
  } else {
    console.log("User document does not exist");
  }
}
const slugifiedCollections = computed(() => {
  return userCollections.value.map(collectionObj => {
    // Ensure that collectionObj.name exists and is a string before replacing
    if (typeof collectionObj.name === 'string') {
      return collectionObj.name.replace(/\s+/g, '-');
    } else {
      return ''; // or some default value
    }
  });
});
</script>

<template>
  <div class="flex-c margin-top">
    <h1 class="ff-1 underline light">{{ userName }}'s Collections</h1>
  </div>
  <main class="grid-wrapper">
    <div v-for="(collection, index) in slugifiedCollections" :key="index">
      <router-link :to="`/${routeCollections}/collections/${collection}`" class="c-link recipe-card rc">
        <img :src="userCollections[index].img" alt="empty collection :(">
        <div class="flex-c-c">
          <div class="title"> {{ userCollections[index].name }}</div>
        </div>
      </router-link>
    </div>
  </main>
</template>

<style scoped>

main{
  width:90vw;
  margin-top:3rem;
  margin-inline: auto;
}

img{
  height: 15rem;
  overflow:none;
  width:100%;
  object-fit:cover;
  border-radius:1rem 1rem 0 0;
}

.c-link{
  color:black;
}
</style>