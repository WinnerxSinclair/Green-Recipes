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

const recipeData = ref(null);
const isFavorite = ref(false);
const favoriteDocRef = ref(null);
const showModal = ref(false);
const avgRating = ref(null);
const numReviews = ref(null);
const userRating = ref(0);
const userComment = ref(null);
const userReviews = ref([]);
const userHasReviewed = ref(false)
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
  const recipesCol = collection(db, 'Recipes');
  const q = query(recipesCol, where("slug", "==", recipeSlug));
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
  await didUserReview();

  const tempAvg = await getAvgRating();
  avgRating.value = Math.round(tempAvg);
 
});

async function getAvgRating(){
  const recipeColl = collection(db, 'reviews');
  const recipeDoc = doc(recipeColl, recipeData.value.slug);
  const subRecipeColl = collection(recipeDoc, 'recipereviews')

  const snapshot = await getAggregateFromServer(subRecipeColl, {
    averagRating: average('rating')
  });

  const countSnap = await getCountFromServer(subRecipeColl);
  numReviews.value = countSnap.data().count;
  

  //getting reviews
  await getReviews();
 
  return snapshot.data().averagRating;
 
}

async function getReviews(){
  const subRecipeColl = collection(db, 'reviews', recipeData.value.slug, 'recipereviews')
  const test = await getDocs(subRecipeColl);
  if(!test.empty){
    userReviews.value = test.docs.map(doc =>({
      rating: doc.data().rating,
      comment: doc.data().comment,
      userName: doc.data().userName
    }))
  }
}

async function didUserReview(){
  const recipeColl = collection(db, 'reviews');
  const recipeDoc = doc(recipeColl, recipeData.value.slug);
  const subRecipeColl = collection(recipeDoc, 'recipereviews')
  const userDocRef = doc(subRecipeColl, userId.value);
  const userDoc = await getDoc(userDocRef);
  
  userHasReviewed.value = userDoc.exists();
  console.log(userHasReviewed.value)
}


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

const goUserCollections = () => router.push(`/${recipeData.value.userId}/collections`)

function setRating(rating){
  userRating.value = rating;
}

async function submitReview(){
  const collectionRef = collection(db, "reviews", recipeData.value.slug, "recipereviews");
  await setDoc(doc(collectionRef, userId.value),  {
    userName: userInfo.value.displayName,
    rating: userRating.value,
    comment: userComment.value
  })
  await didUserReview();

  const mainRecipeDoc = doc(db, 'Recipes', recipeSlug);
  
  numReviews.value++;
  await updateDoc(mainRecipeDoc,{
    'count': numReviews.value,
    'rating': avgRating.value
  })

  await getReviews();
}
</script>

<template>
  <main v-if="recipeData" class="layout-small margin-top">
    <div class="flex align-c gap-big">
      <h1 class="fs-600">{{ recipeData.title }}</h1>
      <div @click="showModal = true" class="click">Add to Collection +</div>
    </div>
    <div class="margin-bot">Recipe by <a class="link link-hover" @click="goUserCollections">{{ recipeData.displayName }}</a></div>
    <div class="flex align-c margin-bot review-contain">
      <img v-if="avgRating" v-for="n in avgRating" :key="n" src="../assets/icons/star-filled.png" alt="">
      <div v-if="numReviews" class="margin-left">({{ numReviews }})</div>
    </div>
    <div v-if="isFavorite" class="fav-contain" @click="removeFav(userId)">
      <img src="../assets/icons/heart-full.svg" alt="" class="icon-small">
      <button class="pad fav">Remove from Favorites</button>
    </div>
    <div v-else class="fav-contain" @click="addFav(userId)">
      <img src="../assets/icons/heart-outline.svg" alt="" class="icon-small">
      <button  class="pad fav">Add to Favorites</button>
    </div>
    <p class="description">{{ recipeData.desc }}</p>
    <button class="main-btn-full letter-space margin-top margin-bot block" @click="print()">Print</button>
    <img :src="recipeData.img" alt="" class="recipe-image">
    <div class="time-info flex-sb margin-top fs-400">
      <div>
        <p>Prep Time: </p>
        <p>{{ recipeData.prep }}</p>
      </div>
      <div>
        <p>Cook Time: </p>
        <p>{{ recipeData.cook }}</p>
      </div>
      <div>
        <p>Total Time: </p>
        <p>40min</p>
      </div>
      <div>
        <p>Servings: </p>
        <p>{{ recipeData.serv }}</p>
      </div>
    </div>

    <div class="fs-600 custom-margin alt-font">Ingredients</div>
    <div class="flex gap">
      <ul class="bullets">
        <li v-for="n in recipeData.ingr.length" :key="n">
          &#8226;
        </li>
      </ul>
      <ul class="ingredients fs-500"> 
        <li v-for="ingr in recipeData.ingr" :key="ingr">
          {{ ingr.name }}
        </li>
      </ul>
    </div>

    <div class="fs-600 custom-margin alt-font">Directions</div>
    <ol class="steps fs-500"> 
      <li v-for="(step,index) in recipeData.steps" :key="step">
        <div class="bold">Step {{ index +1 }}</div>
        <div>{{ step.name }}</div>
      </li>
    </ol>.
    <br>
    <form v-if="!userHasReviewed" @submit.prevent="submitReview">
      <div class="fs-500">Leave a Review</div>
      <img v-for="n in 5" :key="n" src="../assets/icons/star.png" alt="" class="icon-small" 
      :class="{ 'star-selected' : n<=userRating}" @click="setRating(n)">
      <textarea class="block pad-left" v-model="userComment"></textarea>
      <button type="submit">submit</button>
    </form>
    <div v-else class="fs-600 review alt-font">Reviews</div>
    <br>
    <div v-for="(review,index) in userReviews" :key="index">
      <div class="alt-font fs-400">{{ review.userName }}</div>
      <img v-for="n in review.rating" :key="n" src="../assets/icons/star-filled.png" alt="" class="icon-small star">
      <div>{{ review.comment }}</div>
      
      <br>
      <hr>
      <br>
    </div>
  </main>
  <CollectionModal v-if="showModal" :recipeData="recipeData" @submit="showModal = false"/>
  <div v-if="showModal" class="overlay" @click="showModal = false"></div>
</template>

<style scoped>
.review{
  margin-top:10rem;
}

.custom-margin{
  margin-top:5rem;
}
.recipe-image{
  width:75%;
}

ol,
ul{
  list-style:none;
}

.bullets li{
  color: var(--btn-color)
}

.ingredients li,
.bullets li
{
  font-size: var(--fs-300);
  padding-top:1rem;
}

.steps li{
  font-size: var(--fs-300);
  margin-top:2rem;
}

.fav{
  border:none;
  padding:0;
}

.fav-contain{
  display:flex;
  gap:1rem;
  background:rgb(146, 214, 146);
  width:fit-content;
  padding:.5rem;
  border-radius:.5rem;
  cursor:pointer;
  transition:background .3s;
}

.fav-contain:hover{
  background: rgb(85, 182, 85);
}

.review-contain img{
  width:30px;
  filter: invert(100%) sepia(50%) saturate(7418%) hue-rotate(290deg) brightness(105%) contrast(98%);
}

.star{
  filter: invert(100%) sepia(50%) saturate(7418%) hue-rotate(290deg) brightness(105%) contrast(98%);
}
.star-selected {
  filter: invert(39%) sepia(95%) saturate(1350%) hue-rotate(360deg) brightness(100%) contrast(100%);
}

@media print{
  img{
    display:none;
  }
  button{
    display:none;
  }
  form{
    display:none;
  }
  .steps, .ingredients{
    font-size: var(--fs-300);
  }
  li{
    font-size: var(--fs-200);
  }
  .time-info{
    display:none;
  }
  main{
    width:90%;
  }
}
</style>