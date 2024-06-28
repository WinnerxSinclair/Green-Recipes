<script setup>
import {db} from '../firebase'
import { getDocs, query, orderBy, collection, getDoc, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import {ref, onMounted} from 'vue'

const adminRecipes = ref([])
const i = ref(0);

onMounted(() => {
  fetchAdminRecipes();
});

const fetchAdminRecipes = async () =>{
  const docsQuery = query(collection(db, 'AdminRecipes'), orderBy('creationDate'));
  try{
    const docSnaps = await getDocs(docsQuery);
    const docs = docSnaps.docs;

    if(!docs.empty){
      const tempRecipes = docs.map(doc => ({
        title: doc.data().title,
        desc:  doc.data().desc,
        img: doc.data().img,
        ingr: doc.data().ingr,
        steps: doc.data().steps,
        slug:doc.data().slug,

      }));
      adminRecipes.value = tempRecipes;
    }
  }catch(error){
    console.log(error);
  }
}

function changeView(index){
  i.value = index;
}

async function submitRecipe(index){
  const recipeRef = doc(db, 'AdminRecipes', adminRecipes.value[index].slug);
  try{
    const docSnap = await getDoc(recipeRef);
    if(docSnap.exists()){
      const recipeData = docSnap.data();
      await setDoc(doc(db, 'Recipes', recipeData.slug), recipeData);
      await setDoc(doc(db, "reviews", recipeData.slug),{});
      await deleteDoc(recipeRef);
      adminRecipes.value.splice(index,1);
    }else{
      console.log('lol')
    }
  }catch(error){
    console.log(error)
  }
}

async function denyRecipe(index){
  const recipeRef = doc(db, 'AdminRecipes', adminRecipes.value[index].slug)
  try{
    const docSnap = await getDoc(recipeRef);
    if(docSnap.exists()){
      await deleteDoc(recipeRef);
      adminRecipes.value.splice(index,1);
    }
  }catch(error){
    console.log(error)
  }
}
</script>

<template>
  <main class="grid-split">
    <div class="left pad-left">
      <div v-for="(recipe,index) in adminRecipes" :key="recipe" class="flex align-c margin-bot gap">
        <div @click="changeView(index)" class="click">{{ recipe.title }}</div>
        <button class="approve-btn" @click="submitRecipe(index)">Approve</button>
        <button class="deny-btn" @click="denyRecipe(index)">Deny</button>
      </div>
    </div>
    <div v-if="adminRecipes.length" class="right b-l pad-left">
      <div>{{ adminRecipes[i].title }}</div>
      <div>{{ adminRecipes[i].desc }}</div>
      <img :src="adminRecipes[i].img" alt="">
      <div v-for="ingr in adminRecipes[i].ingr" :key="ingr">{{ ingr.name }}</div>
      <div v-for="step in adminRecipes[i].steps" :key="ingr">{{ step.name }}</div>
    </div>
  </main>
</template>

<style scoped>
.grid-split{
  display:grid;
  grid-template-columns: 40% 60%;
  grid-template-rows:1fr;
}
.b-l{
  border-left:1px solid black;
}
main{
  height:100vh;
}
img{
  height:200px;
  max-width:400px;
}
.approve-btn{
  background:rgb(11, 220, 11);
}
.deny-btn{
  background:red;
}
.approve-btn,.deny-btn{
  color:white;
  padding:0 1em;

}
</style>