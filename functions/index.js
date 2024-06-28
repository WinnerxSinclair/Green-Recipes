const functions = require('firebase-functions');
const algoliasearch = require('algoliasearch');
const admin = require('firebase-admin');
admin.initializeApp();

const algoliaAppId = functions.config().algolia.app_id;
const algoliaAdminApiKey = functions.config().algolia.admin_api_key;

const algolia = algoliasearch(algoliaAppId, algoliaAdminApiKey);
const algoliaIndex = algolia.initIndex('RecipeSearchResults');

exports.syncFirestoreToAlgolia = functions.firestore
    .document('Recipes/{docId}')
    .onWrite(async (change, context) => {
        const docId = context.params.docId;
        const document = change.after.exists ? change.after.data() : null;

        if (document) {
            // Prepare the document for Algolia
            document.objectID = docId;

            // Add or update the document in Algolia
            await algoliaIndex.saveObject(document);
        } else {
            // Remove the document from Algolia
            await algoliaIndex.deleteObject(docId);
        }
    });

    
    


exports.addItem = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }

    // Destructuring data with validation checks
    const {
        title, description, ingredients, steps, prepTime, cookTime, servings, image, slug, category, selectedCollections, publishToCommunity
    } = data;

    // Additional validation (example for title)
    if (typeof title !== 'string' || title.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid title provided.');
    }

    // Additional checks for other inputs can be added here

    const userId = context.auth.uid;
    console.log(userId)
    
    const db = admin.firestore();
    const userDocRef = db.doc(`users/${userId}`);

    // Fetch the current user document
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User document does not exist');
    }
    let userData = userDoc.data();
    let currentCollectionList = userData.collectionList || [];
    let currentRecipeCollectionsMap = userData.recipeCollectionsMap || {};

    const recipe = {
        title,
        description,
        ingr:ingredients,
        steps,
        prep: prepTime,
        cook: cookTime,
        total: prepTime + cookTime,
        serv: servings,
        img: image,
        slug,
        category,
        userId,
        displayName:userData.username,
        count: 0,
        creationDate: admin.firestore.Timestamp.now()
    };

    // Adding the recipe to the community collection if requested
    if (publishToCommunity) {
        await db.collection('AdminRecipes').doc(slug).set(recipe);
    }

    // Handle updates to selected collections
    console.log(selectedCollections)
    for (const collectionName of selectedCollections) {
        const collectionRef = db.collection(`users/${userId}/${collectionName}`);
        await collectionRef.add(recipe);

        // Update collection image in the collectionList
        const collectionIndex = currentCollectionList.findIndex(collection => collection.name === collectionName);
        if (collectionIndex !== -1) {
            currentCollectionList[collectionIndex].img = recipe.img;
        }
    }

    // Update user document with new collectionList and recipeCollectionsMap
    currentRecipeCollectionsMap[slug] = selectedCollections;
    await userDocRef.update({
        collectionList: currentCollectionList,
        recipeCollectionsMap: currentRecipeCollectionsMap
    });

    return { message: 'Recipe added successfully' };
});

    

  
    