// // firebase.ts
// import { initializeApp } from "firebase/app";
// import { 
//   initializeAuth, 
//   browserLocalPersistence,
//   getAuth,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   updateProfile
// } from "firebase/auth";
// import { 
//   getFirestore, 
//   doc, 
//   setDoc, 
//   serverTimestamp,
//   collection,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   getDocs,
//   onSnapshot
// } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyCss15RCgowAwwUKzdNAhqfA_YikGu9cMs",
//   authDomain: "task-scheduler-c0822.firebaseapp.com",
//   projectId: "task-scheduler-c0822",
//   storageBucket: "task-scheduler-c0822.appspot.com",
//   messagingSenderId: "447336068477",
//   appId: "1:447336068477:web:064a0558edfb3618410814",
// };

// const app = initializeApp(firebaseConfig);
// export const auth = initializeAuth(app, {
//   persistence: browserLocalPersistence
// });
// export const db = getFirestore(app);

// // Auth functions
// export const signUpWithEmail = async (name: string, email: string, password: string) => {
//   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//   await updateProfile(userCredential.user, { displayName: name });

//   // Create user document in Firestore
//   const userDocRef = doc(db, "users", userCredential.user.uid);
//   await setDoc(userDocRef, {
//     uid: userCredential.user.uid,
//     name: name,
//     email: email,
//     createdAt: serverTimestamp(),
//   });

//   return userCredential;
// };

// export const logInWithEmail = async (email: string, password: string) => {
//   return await signInWithEmailAndPassword(auth, email, password);
// };

// export const logOut = async () => {
//   return await signOut(auth);
// };

// // Task/Event functions
// export const addTaskToFirestore = async (task: any) => {
//   const taskCollection = task.isEvent ? 'events' : 'tasks';
//   const docRef = await addDoc(collection(db, taskCollection), {
//     ...task,
//     createdAt: serverTimestamp()
//   });
//   return docRef.id;
// };

// export const updateTaskInFirestore = async (task: any) => {
//   const taskCollection = task.isEvent ? 'events' : 'tasks';
//   const taskRef = doc(db, taskCollection, task.id);
//   await updateDoc(taskRef, task);
// };

// export const deleteTaskFromFirestore = async (taskId: string, isEvent: boolean) => {
//   const taskCollection = isEvent ? 'events' : 'tasks';
//   await deleteDoc(doc(db, taskCollection, taskId));
// };

// export const getTasksFromFirestore = async (userId: string) => {
//   const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
//   const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
  
//   const [tasksSnapshot, eventsSnapshot] = await Promise.all([
//     getDocs(tasksQuery),
//     getDocs(eventsQuery)
//   ]);

//   const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//   return [...tasks, ...events];
// };

// export const setupTasksListener = (userId: string, callback: (tasks: any[]) => void) => {
//   const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
//   const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));

//   const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
//     const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     callback(tasks);
//   });

//   const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
//     const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     callback(events);
//   });

//   return () => {
//     unsubscribeTasks();
//     unsubscribeEvents();
//   };
// };

// firebase.tsimport { initializeApp } from "firebase/app";// src/firebase.ts
import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  browserLocalPersistence,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCss15RCgowAwwUKzdNAhqfA_YikGu9cMs",
  authDomain: "task-scheduler-c0822.firebaseapp.com",
  projectId: "task-scheduler-c0822",
  storageBucket: "task-scheduler-c0822.appspot.com",
  messagingSenderId: "447336068477",
  appId: "1:447336068477:web:064a0558edfb3618410814",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});
export const db = getFirestore(app);

// Auth functions
export const signUpWithEmail = async (name: string, email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });

  const userDocRef = doc(db, "users", userCredential.user.uid);
  await setDoc(userDocRef, {
    uid: userCredential.user.uid,
    name: name,
    email: email,
    createdAt: serverTimestamp(),
  });

  return userCredential;
};

export const logInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logOut = async () => {
  return await signOut(auth);
};

// User profile functions
export const updateUserProfileData = async (userId: string, data: { birthDate?: Date | null }) => {
  try {
    const userProfileRef = doc(db, "userProfiles", userId);
    await setDoc(userProfileRef, data, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserProfileData = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    const profileDoc = await getDoc(doc(db, "userProfiles", uid));

    const userData = userDoc.exists() ? userDoc.data() : {};
    const profileData = profileDoc.exists() ? profileDoc.data() : {};

    return { ...userData, ...profileData };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};


// Task/Event functions
export const addTaskToFirestore = async (task: any) => {
  const taskCollection = task.isEvent ? 'events' : 'tasks';
  const docRef = await addDoc(collection(db, taskCollection), {
    ...task,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateTaskInFirestore = async (task: any) => {
  const taskCollection = task.isEvent ? 'events' : 'tasks';
  const taskRef = doc(db, taskCollection, task.id);
  await updateDoc(taskRef, task);
};

export const deleteTaskFromFirestore = async (taskId: string, isEvent: boolean) => {
  const taskCollection = isEvent ? 'events' : 'tasks';
  await deleteDoc(doc(db, taskCollection, taskId));
};

export const getTasksFromFirestore = async (userId: string) => {
  const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
  const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
  
  const [tasksSnapshot, eventsSnapshot] = await Promise.all([
    getDocs(tasksQuery),
    getDocs(eventsQuery)
  ]);

  const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return [...tasks, ...events];
};

export const setupTasksListener = (userId: string, callback: (tasks: any[]) => void) => {
  const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
  const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));

  let tasks: any[] = [];
  let events: any[] = [];

  const updateCombined = () => {
    callback([...tasks, ...events]);
  };

  const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateCombined();
  });

  const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
    events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateCombined();
  });

  return () => {
    unsubscribeTasks();
    unsubscribeEvents();
  };
};

