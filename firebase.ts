// Firebase has been disabled for this version of the app.
// This file exports dummy objects to maintain file structure if needed, 
// though they should not be used.

export const db = {
  collection: () => ({
    add: async () => console.log("Firebase disabled"),
    orderBy: () => ({
      get: async () => ({ docs: [] })
    })
  })
};

const firebase = {
  analytics: () => {},
  initializeApp: () => {}
};

export default firebase;