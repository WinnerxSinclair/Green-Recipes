<script setup>
import { collection, addDoc, Timestamp,doc, getDoc, updateDoc, setDoc } from "firebase/firestore"; 
import { db, storage } from "../firebase.js"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {ref as storageRef, uploadBytesResumable, getDownloadURL} from 'firebase/storage'
import {ref, computed, onMounted, onUnmounted} from 'vue'

const title = ref('');
const description = ref('');
const prep = ref(null);
const cook = ref(null);
const serv = ref('');
const image = ref('');
const category = ref('')
const userCollections = ref([])
const selectedCollections = ref([]);

const auth = getAuth();
const userId = ref(null); 
const dName = ref(null);

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      userId.value = user.uid;
      dName.value = user.displayName;
      fetchUserCollectionsList();
      // generateAndAddMockData(36);
    } else {
    
    }
  });
  onUnmounted(() => {
    unsubscribe();
  })
})



async function fetchUserCollectionsList() {
  const userDocRef = doc(db,`users/${userId.value}`);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const collectionsList = userDoc.data().collectionList || [];
    userCollections.value = collectionsList;
    // You can now use userCollections to fetch data from each collection
  } else {
    console.log("User document does not exist");
  }
}
let ingredientList = ref([
  {id: 1, name: ''},
  {id: 2, name: ''},
  {id: 3, name: ''},
])

function addIngredient(){
  const newId = ingredientList.value.length + 1;
  ingredientList.value.push({id:newId, name:''})
}

function deleteIngredient(index){
  console.log(index);
  ingredientList.value.splice(index, 1);
}

let stepList = ref([
  {id: 1, name: ''},
  {id: 2, name: ''},
  {id: 3, name: ''},
])


function addStep() {
  const newId = stepList.value.length + 1;
  stepList.value.push({ id: newId, name: '' })
}

function deleteStep(index) {
  stepList.value.splice(index, 1);
}


const onImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const imageRef = storageRef(storage, 'recipe-images/' + file.name);
        await uploadBytesResumable(imageRef, file);
      
      image.value = await getDownloadURL(imageRef);
    }
}

function generateSlug(name, additionalIdentifier) {
  const slugifiedName = name.toLowerCase().replace(/\s+/g, '-');
  return `${slugifiedName}-${additionalIdentifier}`;
}

const slug = computed(() => {
  return generateSlug(title.value, new Date().getTime())
})

const fragTitle = computed(() => {
  return title.value.toLowerCase().split(" ")
})

const addItem = async (userIdd) =>{

    const recipe = {
        title: title.value,
        desc: description.value,
        ingr: ingredientList.value,
        steps: stepList.value,
        prep: prep.value,
        cook: cook.value,
        total: total.value,
        serv: serv.value,
        img: image.value,
        slug: slug.value,
        category: category.value,
        userId: userId.value,
        displayName: dName.value,
        count: 0,
        keyWords: fragTitle.value,
        creationDate: Timestamp.fromDate(new Date())
    };
    const userDocRef = doc(db, `users/${userId.value}`);
    const userDoc = await getDoc(userDocRef);
    const currentCollectionList = userDoc.data().collectionList || [];

    await setDoc(doc(db, "Recipes", slug.value), recipe);
    await setDoc(doc(db, "reviews", slug.value),{});

    for (const collectionName of selectedCollections.value) {
        const collectionRef = collection(db, "users", userIdd, collectionName);
        await addDoc(collectionRef, recipe);

        const collectionIndex = currentCollectionList.findIndex(collection => collection.name === collectionName);
        currentCollectionList[collectionIndex].img = recipe.img;
    }
   
    await updateDoc(userDocRef, {
    collectionList: currentCollectionList
  });
  
    const currentRecipeCollectionsMap = userDoc.data().recipeCollectionsMap || {};

    currentRecipeCollectionsMap[recipe.slug] = selectedCollections.value;

    await updateDoc(userDocRef, {
      recipeCollectionsMap: currentRecipeCollectionsMap
    });

  }





  
  const addMockItem = async (recipeDetails) => {
    
    const {title, description, ingredients, steps, prepTime, cookTime,totalTime, servings, image, category, userIdd, displayName, selectedCollections, userDocRef,userDoc, currentCollectionList} = recipeDetails;

    const recipeSlug = generateSlug(title, new Date().getTime());
    const recipe = {
        title,
        desc: description,
        ingr: ingredients,
        steps,
        prep: prepTime,
        cook: cookTime,
        total: totalTime,
        serv: servings,
        img: image,
        slug: recipeSlug,
        category,
        userId: userIdd,
        displayName,
        count: 0,
        creationDate: Timestamp.fromDate(new Date())
    };

    await setDoc(doc(db, "Recipes", recipeSlug), recipe);
    await setDoc(doc(db, "reviews", recipeSlug),{});
   
    for (const collectionName of selectedCollections) {
        const collectionRef = collection(db, "users", userIdd, collectionName);
        await addDoc(collectionRef, recipe);

        const collectionIndex = currentCollectionList.findIndex(collection => collection.name === collectionName);
        currentCollectionList[collectionIndex].img = recipe.img;
    }
   
    await updateDoc(userDocRef, {
    collectionList: currentCollectionList
  });
  const currentRecipeCollectionsMap = userDoc.data().recipeCollectionsMap || {};

currentRecipeCollectionsMap[recipe.slug] = selectedCollections;

await updateDoc(userDocRef, {
  recipeCollectionsMap: currentRecipeCollectionsMap
});
};


  const generateAndAddMockData = async (numberOfItems) => {
    for (let i = 0; i < numberOfItems; i++) {
      const userDocRef = doc(db, `users/${userId.value}`);
      
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
const currentCollectionList = userData && userData.collectionList !== undefined ? userData.collectionList : [];
        const mockData = {
            title: `Mock Title ${i+72}`,
            description: `Mock Description ${i+72}`,
            ingredients: [{id: 1, name: 'Example Ingredient 1'}, {id: 2, name: 'Example Ingredient 2'}], 
            steps: [{id: 1, name: 'Step 1'}, {id: 2, name: 'Step 2'}],
            prepTime: '10 min',
            cookTime: '20 min',
            totalTime: '30 min',
            servings: '4',
            image: 'https://rainbowplantlife.com/wp-content/uploads/2022/10/pancakes-new-cover-photo-more-zoomed-in-1-of-1.jpg', 
            category: 'breakfast',
            userIdd: userId.value, 
            displayName: dName.value,
            selectedCollections: ['Cobra'],
            userDocRef: userDocRef,
            userDoc: userDoc,
            currentCollectionList: currentCollectionList
        };
        await addMockItem(mockData);
    }
};
</script>

<template>
  <div class="layout-small">
    <form @submit.prevent="addItem(userId)" class="flex column">
      <label>Recipe Title</label>
      <input type="text" v-model="title">

      <label>Description</label>
      <input type="textarea" v-model="description">

      <label>Ingredients</label>
      <div v-for="(item, index) in ingredientList" :key="item.id" class="flex align-c margin-bot">
        <input type="text" v-model="item.name" class="grow">
        <img src="../assets/icons/redx.svg" class="margin-left icon-small click" @click="deleteIngredient(index)">
      </div>
      <button type="button" class="main-btn-full" @click="addIngredient">Add Ingredient</button>

      <br>
      <label class="margin-top">Steps</label>
      <div v-for="(step, index) in stepList" :key="step.id" class="flex align-c margin-bot">
        <input type="text" v-model="step.name" class="grow">
        <img src="../assets/icons/redx.svg" class="margin-left icon-small click" @click="deleteStep(index)">
      </div>
      <button type="button" class="main-btn-full" @click="addStep">Add Step</button>

      <label>Prep Time</label>
      <input type="text" v-model="prep">

      <label>Cook Time</label>
      <input type="text" v-model="cook">

      <label>Servings</label>
      <input type="text" v-model="serv">

      <label>Category</label>
      <select v-model="category">
        <option value="entree">Entree</option>
        <option value="breakfast">Breakfast</option>
        <option value="dessert">Dessert</option>
      </select>

      <label for="iamge">Image</label>
        <input
          class="input"
          type="file"
          @change="onImageChange"
          required>

      <label v-for="(collection, index) in userCollections" :key="index">{{ collection.name }}
        <input type="checkbox" v-model="selectedCollections" :value="collection.name">
      </label>
      <button type="submit" class="main-btn-full margin-top">Add Recipe</button>
    </form>
  </div>
</template>

<style scoped>
@import '../assets/form.css';
.ingredient-wrapper{
  width:90%;
}
.ingredient-wrapper input{
  width:100%;
}
.x-btn{
  line-height:2rem;;
}
</style>