<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { doc, deleteDoc, addDoc, setDoc, updateDoc, collection, query, getDocs, where, 
  arrayUnion, arrayRemove, getAggregateFromServer, average, count, getCountFromServer, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import CollectionModal from '../components/CollectionModal.vue';
import router from '../router';
function print(){
  window.print();
}

const route = useRoute();
const recipeSlug = route.params.slug; 
const routeUserId = route.params.uid;
const routeColl = route.params.collection.replace(/-/g, ' ');
 
const recipeData = ref(null);
const isFavorite = ref(false);
const favoriteDocRef = ref(null);
const showModal = ref(false);
const userInfo = ref(null);

const auth = getAuth();
const userId = ref(null); 
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    userId.value = currentUser.uid;
    userInfo.value = currentUser;
   
  } else {
   
  }
});

onMounted(async () => {
 
  const q = query(collection(db,'users', routeUserId, routeColl), where("slug", "==", recipeSlug));
  
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]; // Assuming slug is unique
    recipeData.value = doc.data();
    
  } else {
    console.log("No such recipe with the given slug!");
  }
  if (userId.value) {
    const favsCol = collection(db, "users", userId.value, 'Favorites');
    const favQuery = query(favsCol, where("slug", "==", recipeSlug));
    const favSnapshot = await getDocs(favQuery);
    isFavorite.value = !favSnapshot.empty;
  
  
    if (isFavorite.value) {
      favoriteDocRef.value = favSnapshot.docs[0].ref;
    }
  }
 
});

const addFav = async (userIdd) =>{
  const collectionRef = collection(db, "users", userIdd, 'Favorites');
  const docRef = await addDoc(collectionRef, recipeData.value);

  const userDocRef = doc(db, `users/${userId.value}`);
  const xd = recipeData.value.slug;
  const updateData = {};
  updateData[`recipeCollectionsMap.${xd}`] = arrayUnion('Favorites');

  await updateDoc(userDocRef, updateData);

  isFavorite.value = true;
  favoriteDocRef.value = docRef;
}

const removeFav = async () =>{
  const userDocRef = doc(db, `users/${userId.value}`);
  const xd = recipeData.value.slug;
  const updateData = {};
  updateData[`recipeCollectionsMap.${xd}`] = arrayRemove('Favorites');

  await updateDoc(userDocRef, updateData);
  await deleteDoc(favoriteDocRef.value);
  isFavorite.value = false;
  favoriteDocRef.value = null;
}

const goUserCollections = () => router.push(`/${recipeData.value.userId}/${recipeData.value.displayName}/community`)
</script>

<template>
  <main v-if="recipeData" class="layout-small margin-top">
    <h1 class="fs-600">{{ recipeData.title }}</h1>
    
    <div class="margin-bot">Recipe by <a class="link link-hover" @click="goUserCollections">{{ recipeData.displayName }}</a></div>
    
    <div class="flex gap-tiny">
      <div v-if="isFavorite" class="fav-contain" @click="removeFav(userId)" role="button">
        <img src="../assets/icons/heart-full.svg" alt="" class="icon-small icon-white">
      </div>
      <div v-else class="fav-contain" @click="addFav(userId)" role="button">
        <img  src="../assets/icons/heart-outline.svg" alt="" class="icon-small icon-white">
      </div>
      <div @click="showModal = true" class="fav" role="button">Add to Collection +</div>
    </div>
    <p class="description">{{ recipeData.desc }}</p>
    <button class="print-btn letter-space margin-top margin-bot block" @click="print()">Print</button>
    <img :src="recipeData.img" alt="" class="recipe-image">
    <div class="time-info flex gap wrap margin-top fs-100 jockey letter-shrink">
      <div>Prep Time: <span class="bold fs-200">10 min</span></div>
      <hr>
      <div>Cook Time: <span class="bold fs-200">10 min</span></div>
      <hr>
      <div>Total Time: <span class="bold fs-200">20 min</span></div>
      <hr>
      <div>Servings: <span class="bold fs-200">5</span></div>
    </div>

    <div class="cd-grid">
      <div>
      <div class="fs-600 custom-margin alt-font">Ingredients</div>
      <div class="flex gap">
        <ul class="bullets">
          <li v-for="n in recipeData.ingr.length" :key="n">
            &#8226;
          </li>
        </ul>
        <ul class="ingredients fs-100"> 
          <li v-for="ingr in recipeData.ingr" :key="ingr">
            {{ ingr.name }}
          </li>
        </ul>
      </div>
      </div>

      <div>
      <div class="fs-600 custom-margin alt-font">Directions</div>
      <ol class="steps fs-100"> 
        <li v-for="(step,index) in recipeData.steps" :key="step">
          <div class="bold">Step {{ index +1 }}</div>
          <div>{{ step.name }}</div>
        </li>
      </ol>
      </div>
    </div>
    <br><br><br><br><br>
  </main>
  <CollectionModal v-if="showModal" :recipeData="recipeData" @submit="showModal = false"/>
  <div v-if="showModal" class="overlay" @click="showModal = false"></div>
</template>

<style scoped>
@import '../assets/recipe.css';
</style>