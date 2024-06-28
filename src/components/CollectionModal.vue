<script setup>
import { collection, addDoc, Timestamp,doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore"; 
import { db } from "../firebase.js"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref, computed, onUnmounted, defineEmits} from 'vue'
const recipeData = defineProps({
  recipeData:{
    type:Object,
  }
})
const emit = defineEmits(['submit']);
const userCollections = ref({})
const selectedCollections = ref([]);
const existingCollections = ref([])
const newCollection = ref('');
const newColBtn = ref(true)
const rawData = {...recipeData.recipeData};
const auth = getAuth();
const userId = ref(null); 
const user = ref(null);
const collectionNames = ref([]);

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    userId.value = currentUser.uid;
    user.value = currentUser;
    fetchUserCollectionsList()
  } else {
   
  }
});

let unsubscribeUserCollections
async function fetchUserCollectionsList() {
  const userDocRef = doc(db, `users/${userId.value}`);
  unsubscribeUserCollections = onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
     
      collectionNames.value = userData.collectionList.map(col => col.name)
      .filter(name => rawData.userId === userId.value || name !== user.value.displayName);


      const recipeCollectionsMap = userData.recipeCollectionsMap || {};
      if (recipeCollectionsMap[recipeData.recipeData.slug]) {
        selectedCollections.value = recipeCollectionsMap[recipeData.recipeData.slug];
        existingCollections.value = recipeCollectionsMap[recipeData.recipeData.slug];
        console.log(selectedCollections.value);
      }
    } else {
      console.log("User document does not exist");
    }
  });

}
const remainingCollections = computed(() => {
  let test = collectionNames.value.filter(name => !existingCollections.value.includes(name));
  
  return test;
});

onUnmounted(() => {
  if (unsubscribeUserCollections) {
    unsubscribeUserCollections(); 
  }
});

async function addNewCol(){
  const userDocRef = doc(db, `users/${userId.value}`);
  const userDoc = await getDoc(userDocRef);
  for(let coll of userDoc.data().collectionList){
    if(coll.name === newCollection.value){
      return;
    }
  }
  await updateDoc(userDocRef, {
    collectionList: arrayUnion({
      name: newCollection.value,
      img: ''
    })
  })
  newCollection.value = '';
}

const addItem = async () =>{
  if (unsubscribeUserCollections) {
    unsubscribeUserCollections(); 
  }
  const userDocRef = doc(db, `users/${userId.value}`);
  const userDoc = await getDoc(userDocRef);
  const currentCollectionList = userDoc.data().collectionList || [];
 
  const collectionsToAdd = selectedCollections.value.filter(
    (collectionName) => !existingCollections.value.includes(collectionName)
  );
  console.log(collectionsToAdd)
  for (const collectionName of collectionsToAdd) {
    console.log(collectionName)
      const collectionRef = collection(db, "users", userId.value, collectionName);

      await addDoc(collectionRef, rawData);

      const collectionIndex = currentCollectionList.findIndex(collection => collection.name === collectionName);
      currentCollectionList[collectionIndex].img = rawData.img;
      
    }

  await updateDoc(userDocRef, {
    collectionList: currentCollectionList
  });
  const currentRecipeCollectionsMap = userDoc.data().recipeCollectionsMap || {};

// Update the map with the new recipe
  currentRecipeCollectionsMap[rawData.slug] = selectedCollections.value;

// Finally, update the user document with the modified map
  await updateDoc(userDocRef, {
    recipeCollectionsMap: currentRecipeCollectionsMap
  });

  emit('submit');
}
</script>

<template>
  <form @submit.prevent="addItem" class="modal rc pad">
    <h1 class="roboto">Select Collections</h1>
    <div class="flex gap" v-for="(collection, index) in existingCollections" :key="index">
      <label >{{ collection }}</label>
      <input type="checkbox" :value="collection" v-model="selectedCollections" disabled class="checkbox">
    </div>
    <div class="flex gap" v-for="(collection, index) in remainingCollections" :key="index">
      <label >{{ collection }}</label>
      <input type="checkbox" v-model="selectedCollections" :value="collection" class="checkbox">
    </div>
    <br>
    
    <button v-if="newColBtn" type="button" class="border-none" @click="newColBtn = false">+ Create New Collection</button>
    <input v-if="!newColBtn" type="text" v-model="newCollection" placeholder="collection name" class="pad-left">
    <button v-if="!newColBtn" type="button" class="border-none" @click="addNewCol">+ Add New Collection</button>
    <br>
    <button type="submit" class="pad-small testbut margin-top">Update Collections</button>
  </form>
</template>

<style scoped>
.modal{
  position:absolute;
  top:20%;
  left:50%;
  transform:translate(-50%, 0);
  z-index:999;
  background:rgb(220, 248, 252);
  width:clamp(350px, 30%, 40rem);
}
label{
  font-size:var(--fs-300);
  font-family:Oswald;
}
.checkbox{
  margin-top:5px;
}
.testbut{
  background: rgb(140, 140, 243);
}
.testbut:hover{
  background: rgb(93, 93, 231);
}
</style>