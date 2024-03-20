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

