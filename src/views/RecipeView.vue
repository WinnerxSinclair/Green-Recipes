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
 
  const q = query(collection(db,'Recipes'), where("slug", "==", recipeSlug));
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
  if(userId.value){
    const recipeColl = collection(db, 'reviews');
    const recipeDoc = doc(recipeColl, recipeData.value.slug);

    const subRecipeColl = collection(recipeDoc, 'recipereviews')
    console.log('here')
    const userDocRef = doc(subRecipeColl, userId.value);
    console.log('now here')
    const userDoc = await getDoc(userDocRef);
    
    userHasReviewed.value = userDoc.exists();
    console.log(userHasReviewed.value)
  }
}


const addFav = async (userIdd) =>{
  if(!userId.value){
    router.push('../login')
  }
  const collectionRef = collection(db, "users", userIdd, 'Favorites');
  const docRef = await addDoc(collectionRef, recipeData.value);

  const userDocRef = doc(db, `users/${userId.value}`);
  const userDoc = await getDoc(userDocRef);
  const currentCollectionList = userDoc.data().collectionList || [];
  const collectionIndex = currentCollectionList.findIndex(collection => collection.name === 'Favorites');
  currentCollectionList[collectionIndex].img = recipeData.value.img;
  console.log(currentCollectionList)
  await updateDoc(userDocRef, {
    collectionList: currentCollectionList
  });

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
  console.log(favoriteDocRef.value)
  await deleteDoc(favoriteDocRef.value);
  isFavorite.value = false;
  favoriteDocRef.value = null;
}

const goUserCollections = () => {
  router.push(`/${recipeData.value.userId}/${recipeData.value.displayName}/community`)
}

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

const modalOrRedir = () =>{
  if(userId.value){
    showModal.value = true;
  }else{
    router.push('../login')
  }
}
</script>

<template>
  <main v-if="recipeData" class="layout-small margin-top pad">
    
    <h1 class="fs-600">{{ recipeData.title }}</h1>
    
    <div class="margin-bot">Recipe by <a class="link link-hover" @click="goUserCollections">{{ recipeData.displayName }}</a></div>
    <div class="flex align-c margin-bot review-contain">
      <img v-if="avgRating" v-for="n in avgRating" :key="n" src="../assets/icons/star-filled.png" alt="">
      <div v-if="numReviews" class="margin-left">({{ numReviews }})</div>
    </div>
    <div class="flex gap-tiny">
      <div v-if="isFavorite" class="fav-contain" @click="removeFav(userId)" role="button">
        <img src="../assets/icons/heart-full.svg" alt="" class="icon-small icon-white">
      </div>
      <div v-else class="fav-contain" @click="addFav(userId)" role="button">
        <img  src="../assets/icons/heart-outline.svg" alt="" class="icon-small icon-white">
      </div>
      <div @click="modalOrRedir" class="fav" role="button">Add to Collection +</div>
    </div>
    <p class="description">{{ recipeData.description }}</p>
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
    <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
    <div class="alt-bg">
      <div v-if="userReviews.length>0" class="fs-600 review alt-font">Reviews</div>
      <form v-if="!userHasReviewed && userInfo" @submit.prevent="submitReview" class="form-margin">
       <div class="flex align-c margin-top">
        <div class="fs-300 jockey letter-shrink margin-right">Your Rating: </div>
        <img v-for="n in 5" :key="n" src="../assets/icons/star-filled.png" alt="" class="icon-small" 
        :class="{ 'star-selected' : n<=userRating}" @click="setRating(n)"></div>
        <div class="ta-wrap">
          <textarea class="block pad custom-ta" v-model="userComment" placeholder="comment here..."></textarea>
        </div>
        <button type="submit" class="main-btn btn-pad margin-top">Submit</button>
      </form>
      <br>
      <div v-for="(review,index) in userReviews" :key="index">
        <div class="alt-font fs-400">{{ review.userName }}</div>
        <img v-for="n in review.rating" :key="n" src="../assets/icons/star-filled.png" alt="" class="icon-small star">
        <div>{{ review.comment }}</div>
        
        <br>
        <hr>
        <br>
      </div>
    </div>
  </main>
  
  <CollectionModal v-if="showModal" :recipeData="recipeData" @submit="showModal = false"/>
  <div v-if="showModal" class="overlay" @click="showModal = false"></div>
</template>

<style scoped>
@import '../assets/recipe.css';


.ta-wrap{
  border:1px solid black;
  width:400px;
  border-radius:.2rem;

}
.custom-ta{
  border:none;
  outline:none;
  min-height:90px;
  width:100%;
  resize:none;
  background: rgba(255, 254, 224, 0.347);
}
.custom-ta:focus{
  background:white;
}
</style>