<script setup>
import {collection, getDocs, query, where} from "firebase/firestore"
import {db} from "../firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref, onMounted, computed} from 'vue'
import { useRoute } from 'vue-router';
import TheRecipe from '../components/TheRecipe.vue'

const myRecipes = ref([])
const auth = getAuth();
const userId = ref(null); 
const route = useRoute();
const routeRecipe = route.params.uid;
const routeDName = route.params.displayName;


onAuthStateChanged(auth, (user) => {
  if (user) {
    userId.value = user.uid;
    console.log(userId.value)
    
  } else {
   
  }
});

onMounted(() => {
  setupRecipeListener();
})
async function setupRecipeListener() {
  const recipeQuery = query(collection(db, 'Recipes'), where('userId', '==', routeRecipe));
  const docRefs = await getDocs(recipeQuery);

  try{
    const recDocs = docRefs.docs;
    const newRecipes = recDocs.map(doc => ({
      category: doc.data().category,
      image: doc.data().img,
      name: doc.data().title,
      slug: doc.data().slug,
      userId: doc.data().userId
    }))
    myRecipes.value = newRecipes;
    console.log(myRecipes.value)
  }catch(error){
    console.log(error);
  }
}
</script>

<template>
  <main class="container">
    <h1>{{ routeDName }}'s recipes</h1>
    <br>
    <div class="grid-wrapper click">
      <TheRecipe v-for="recipe in myRecipes" :key="recipe.name" :recipe="recipe" />
    </div>
  </main>
</template>

<style scoped>
.test-slot{
  position:absolute;
  top:3%;
  right:3%;
  z-index:999;
}

main{
  width:90vw;
  margin-top:3rem;
  margin-inline: auto;
}

.labels{
  width:80%;
  margin-inline:auto;
}
.labels div{
  cursor:pointer;
}
</style>