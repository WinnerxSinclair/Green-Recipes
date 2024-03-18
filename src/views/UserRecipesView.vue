<script setup>
import {collection, onSnapshot, deleteDoc, doc, arrayRemove, updateDoc} from "firebase/firestore"
import {db} from "../firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref, onMounted, computed} from 'vue'
import { useRoute } from 'vue-router';
import TheRecipe from '../components/TheRecipe.vue'


const myRecipes = ref([])
const auth = getAuth();
const userId = ref(null); 
const route = useRoute();
const recipeCollection = route.params.collection.replace(/-/g, ' ');
const routeRecipe = route.params.uid;
console.log(recipeCollection)

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId.value = user.uid;
    console.log(userId.value)
    setupRecipeListener();
  } else {
   
  }
});

function setupRecipeListener() {
  const userRecipesPath = `users/${routeRecipe}/${recipeCollection}`;
  onSnapshot(collection(db, userRecipesPath), (querySnapshot) => {
    const tempRecipes = [];
    querySnapshot.forEach((doc) => {
      const recipe = {
        image: doc.data().img,
        name: doc.data().title,
        slug: doc.data().slug,
        id: doc.id,
       
      }
      tempRecipes.push(recipe);
    });
    myRecipes.value = tempRecipes;
  }, (error) => {
    console.error("Error fetching recipes:", error); // Error handling
  });
}

async function deleteRecipe(recipeId, slug) {
  try {
    const userRecipesPath = `users/${routeRecipe}/${recipeCollection}`;
    await deleteDoc(doc(db, userRecipesPath, recipeId));

    const collectionId = slug;
    const userDocRef = doc(db, `users/${userId.value}`);

    await updateDoc(userDocRef, {
  [`recipeCollectionsMap.${collectionId}`]: arrayRemove(recipeCollection)
});
    myRecipes.value = myRecipes.value.filter(recipe => recipe.id !== recipeId);
  } catch (error) {
    console.error("Error deleting recipe:", error);
  }
}
</script>

<template>
  <main class="container">
    <br>
    <div class="grid-wrapper click">
      <TheRecipe v-for="recipe in myRecipes" :key="recipe.name" :recipe="recipe" linkType="user">
        <img src="../assets/icons/redx.svg" alt="" class="icon-small test-slot click" @click.stop="deleteRecipe(recipe.id, recipe.slug)">
      </TheRecipe>
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
  margin-top:5rem;
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