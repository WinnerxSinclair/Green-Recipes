<script setup>
import {collection, onSnapshot, query, where, limit, orderBy, getDocs, startAfter} from "firebase/firestore"
import {db} from "../firebase"
import {ref, onMounted, computed, watch} from 'vue'
import TheRecipe from '../components/TheRecipe.vue'
import algoliasearch from 'algoliasearch/lite';

const myRecipes = ref([])
const lastVisible = ref(null)
let currentPage = ref(1);
const itemsPerPage = 24;
const limitL = 96;
const sortBy = ref("count")
const category = ref(null);
const search = ref(null)

onMounted(() => {
    fetchRecipes(true);
});

const fetchRecipes = async (reset = false) => {
  
    let queryConstraints = [orderBy(sortBy.value, "desc"), limit(limitL)];
    if (category.value !== null) {
      queryConstraints.unshift(where("category", "==", category.value));
    }
    if (!reset && lastVisible.value) {
      queryConstraints.push(startAfter(lastVisible.value));
    }
    const xd = query(collection(db, "Recipes"), ...queryConstraints);
    console.log(queryConstraints)
    try {
        const documentSnapshots = await getDocs(xd);
        const documents = documentSnapshots.docs;
        if (!documents.empty) {
            const newRecipes = documents.map(doc => ({
              category: doc.data().category,
              image: doc.data().img,
              name: doc.data().title,
              slug: doc.data().slug,
              userId: doc.data().userId
            }));
            if (reset) {
              myRecipes.value = newRecipes;
            } else {
              myRecipes.value = [...myRecipes.value, ...newRecipes];
            }
            lastVisible.value = documents[documents.length - 1]; // Update lastVisible for pagination
        }
        console.log(myRecipes.value)
    } catch (error) {
        console.error("Error fetching recipes: ", error);
    }
};

const searchQuery = async() => {
  const algoliaSearch = algoliasearch('J1TOSPFCDI', '05db3c93a1f2557d9a3d72b96084f49d');
  const searchIndex = algoliaSearch.initIndex('RecipeSearchResults');
  category.value = 'search';
  
  try {
    // Specify the 'restrictSearchableAttributes' option
    const searchOptions = {
      restrictSearchableAttributes: ['title'] // Ensure 'title' matches the attribute name in your index
    };
    
    const { hits } = await searchIndex.search(search.value, searchOptions);
    const formattedHits = hits.map(hit => ({
      // Mapping each hit to your desired structure
      category: hit.Category, // Adjust as necessary
      image: hit.img, // Adjust as necessary
      name: hit.title, // Adjust as necessary
      slug: hit.slug, // Adjust as necessary
      userId: hit.userId // Adjust as necessary
    }));
    
    myRecipes.value = formattedHits;
    console.log(myRecipes.value);
  } catch (error) {
    console.error("Error fetching recipes: ", error);
  }
}


watch(sortBy, () => {
  currentPage.value = 1;
  if(search.value){
    searchQuery();
  }else 
    fetchRecipes(true);
})

const changeCategory = (cat) => {
  if(cat != category.value){
    search.value = null;
    category.value = cat;
    currentPage.value = 1;
    fetchRecipes(true);
  }
}

const seeMoreRecipes = () => {
  fetchRecipes();
  currentPage.value = currentPage.value + 1;
};

const onClickHandler = (page) => {
  currentPage.value = page;
  document.documentElement.scrollTo({
    top: 0,
    
  })
};

const paginatedRecipes = computed(() => {
  let start = (currentPage.value - 1) * itemsPerPage;
  let end = start + itemsPerPage;
  return myRecipes.value.slice(start, end);
});
</script>

<template>
  <main class="container">
    <div class="flex align-c search-container">
      <img @click="searchQuery" src="../assets/icons/search.svg" class="icon-small" alt="">
      <input type="text" class="search fs-200" placeholder="search keywords e.g. 'soup'" v-model="search">
    </div>
    <div class="flex-sb">
      <div class="flex gap cat-contain">
        <div @click="changeCategory(null)">All Recipes</div>
        <div @click="changeCategory('entree')">Entrees</div>
        <div @click="changeCategory('breakfast')">Breakfast</div>
        <div @click="changeCategory('dessert')">Desserts</div>
      </div>
     
      <div>Sort by:
      <select v-model="sortBy">
        <option value="count">Popular</option>
        <option value="rating">Rated</option>
        <option value="creationDate">Latest</option>
      </select>
    </div>
    </div>
    <br>
    <div class="recipe-wrapper click">
      <TheRecipe v-for="recipe in paginatedRecipes" :key="recipe.name" :recipe="recipe" />
    </div>
    <div class="flex-c-c column gap">
      <vue-awesome-paginate v-if="limitL > itemsPerPage && myRecipes.length > itemsPerPage "
          :total-items="myRecipes.length"
          :items-per-page="itemsPerPage"
          :max-pages-shown="3"
          v-model="currentPage"
          :on-click="onClickHandler"
          :hide-prev-next-when-ends="true"
        />
      <button v-if="currentPage % 4 == 0 && myRecipes.length >= currentPage * itemsPerPage" @click="seeMoreRecipes" class="btn-color2 btn-pad">See More</button>
    </div>
  </main>
</template>

<style scoped>
main{
  width:80vw;
  margin-top:1rem;
  margin-inline: auto;
}
.recipe-wrapper{
  display:grid;
  gap:1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
}

.search-container{
  width:100%;
  justify-content: flex-end;
  margin-bottom:4rem;
}
.search{
  width:50%;
  border:none;
  border-bottom:2px solid rgba(0, 0, 0, 0.548);
}
.search:focus{
  outline:none;
  border-bottom: 2px solid black;
}

.cat-contain{
  gap:1.5rem;
}
.cat-contain div{
  text-decoration: underline;
  cursor:pointer;
  font-size: var(--fs-300);
  font-family:Oswald;
  font-weight:300;
}
.cat-contain div:hover{
  font-weight:500;
}

</style>