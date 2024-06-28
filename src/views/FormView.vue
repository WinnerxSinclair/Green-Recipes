<script setup>
import { collection, addDoc, Timestamp,doc, getDoc, updateDoc, setDoc, onSnapshot, arrayUnion } from "firebase/firestore"; 
import { db, storage, firebaseFunctions } from "../firebase.js"
import { httpsCallable } from 'firebase/functions';
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
const newCollection = ref('')
const commCheck = ref(false);

const auth = getAuth();
const userId = ref(null); 
const dName = ref(null);

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      userId.value = user.uid;
      dName.value = user.displayName;
      fetchUserCollectionsList();
      //  generateAndAddMockData(36);
    } else {
    
    }
  });
  onUnmounted(() => {
    unsubscribe();
  })
})

async function fetchUserCollectionsList() {
  const userDocRef = doc(db,`users/${userId.value}`);
  onSnapshot(userDocRef, (userDoc) =>{
    if (userDoc.exists()) {
    const collectionsList = userDoc.data().collectionList || [];
    userCollections.value = collectionsList;
    
  } else {
    console.log("User document does not exist");
  }
  })

}

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

const addItem = httpsCallable(firebaseFunctions, 'addItem');

async function submitRecipe() {
  const recipeData = {
    title: title.value,
    description: description.value,
    ingredients: ingredientList.value,
    steps: stepList.value,
    prepTime: prep.value,
    cookTime: cook.value,
    servings: serv.value,
    image: image.value,
    slug: slug.value,
    category: category.value,
    selectedCollections: selectedCollections.value,
    publishToCommunity: commCheck.value
  };

  try {
    const result = await addItem(recipeData);
    console.log('Function result:', result.data.message);
  } catch (error) {
    console.error('Error calling addItem function:', error);
  }
}

  const colVariable = ref(false);
</script>

<template>
  <div class="layout-small">
    <form @submit.prevent="submitRecipe" class="flex column testflex">
      <label>Recipe Title</label>
      <input type="text" v-model="title" class="stretch" required>

      <label>Description</label>
      <input type="textarea" v-model="description" class="stretch">

      <label>Ingredients</label>
      <div v-for="(item, index) in ingredientList" :key="item.id" class="flex align-c margin-bot stretch">
        <input type="text" v-model="item.name" class="grow">
        <img src="../assets/icons/redx.svg" class="margin-left icon-small click" @click="deleteIngredient(index)">
      </div>
      <button type="button" class="main-btn-full stretch" @click="addIngredient">Add Ingredient</button>

      <br>
      <label class="margin-top">Steps</label>
      <div v-for="(step, index) in stepList" :key="step.id" class="flex align-c margin-bot stretch">
        <input type="text" v-model="step.name" class="grow">
        <img src="../assets/icons/redx.svg" class="margin-left icon-small click" @click="deleteStep(index)">
      </div>
      <button type="button" class="main-btn-full stretch" @click="addStep">Add Step</button>

      <label>Prep Time</label>
      <input type="text" v-model="prep" class="stretch">

      <label>Cook Time</label>
      <input type="text" v-model="cook" class="stretch">

      <label>Servings</label>
      <input type="text" v-model="serv" class="stretch">

      <label>Category</label>
      <select v-model="category" class="pad-left stretch">
        <option value="entree">Entree</option>
        <option value="breakfast">Breakfast</option>
        <option value="dessert">Dessert</option>
      </select>

      <label for="iamge">Image</label>
        <input
          class="input"
          type="file"
          @change="onImageChange"
          >

      <label>Select Collections <span class="fs-100 light margin-left click">
        <span v-if="!colVariable" @click="colVariable = true">Add New Collection +</span>
        <div v-else class="inline">
          <input type="text" v-model="newCollection" placeholder="collection name">
          <button type="button" @click="addNewCol" class="main-btn c-btn margin-left" :disabled="newCollection===''">Add Collection</button>
        </div>
      </span></label>
      <div class="flex wrap c-gap">
        <label v-for="(collection, index) in userCollections" :key="index" class="smol-label">{{ collection.name }}
          <input type="checkbox" v-model="selectedCollections" :value="collection.name">
        </label>
      </div>

      
      <label class="flex align-c gap">Publish Recipe to Community? 
        <input type="checkbox" v-model="commCheck" class="bigCheck">
      </label>
    
      <button type="submit" class="main-btn-full margin-top stretch">Submit Recipe</button>  
    </form>
  </div>
</template>

<style scoped>

@import '../assets/form.css';

.testflex{
  align-items: flex-start;
}
.stretch{
  align-self:stretch;
}
.ingredient-wrapper{
  width:90%;
}
.ingredient-wrapper input{
  width:100%;
}
.x-btn{
  line-height:2rem;;
}
.smol-label{
  font-size:.8rem;
}
.bigCheck{
  transform:scale(1.5);
  margin-top:5px;
}
.c-gap{
  gap:0 1rem;
}
.c-btn{
  padding: .2em 1em;
  font-weight:400;

}
</style>



<!-- const addMockItem = async (recipeDetails) => {
    
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
}; -->


<!-- const generateAndAddMockData = async (numberOfItems) => {
  for (let i = 0; i < numberOfItems; i++) {
    const userDocRef = doc(db, `users/${userId.value}`);
    const mockTitle = `Mock Title ${i+72}`;
    
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();
  const currentCollectionList = userData && userData.collectionList !== undefined ? userData.collectionList : [];
      const mockData = {
          title: mockTitle,
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
          selectedCollections: ['cobra'],
          userDocRef: userDocRef,
          userDoc: userDoc,
          currentCollectionList: currentCollectionList
      };
      await addMockItem(mockData);
  }
}; -->