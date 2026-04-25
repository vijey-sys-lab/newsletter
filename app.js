// ── FIREBASE CONFIG ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, orderBy, limit, where, serverTimestamp, setDoc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJuLSVj8RGQCuqdQno6_HqBK72KurzERE",
  authDomain: "newsletter-643db.firebaseapp.com",
  projectId: "newsletter-643db",
  storageBucket: "newsletter-643db.firebasestorage.app",
  messagingSenderId: "947442503465",
  appId: "1:947442503445:web:7e5c13295883533ace7138",
  measurementId: "G-FPR44MM107"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const SUPER_ADMIN = "vjysupermacy@gmail.com";

// ── PROVIDERS ──
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}
export async function loginWithFacebook() {
  return signInWithPopup(auth, facebookProvider);
}
export async function loginWithTwitter() {
  return signInWithPopup(auth, twitterProvider);
}
export async function logout() {
  return signOut(auth);
}

// ── AUTH STATE ──
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── USER PROFILE ──
export async function saveUser(user) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp()
  }, { merge: true });
}

// ── ARTICLES ──
export async function getArticles(count = 20) {
  const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getArticle(id) {
  const snap = await getDoc(doc(db, "articles", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function publishArticle({ title, excerpt, body, tag, coverImageFile }) {
  let coverURL = "";
  if (coverImageFile) {
    const storageRef = ref(storage, `covers/${Date.now()}_${coverImageFile.name}`);
    await uploadBytes(storageRef, coverImageFile);
    coverURL = await getDownloadURL(storageRef);
  }
  return addDoc(collection(db, "articles"), {
    title,
    excerpt,
    body,
    tag,
    coverURL,
    createdAt: serverTimestamp(),
    author: "Vijey Prasanna"
  });
}

// ── SUBSCRIPTIONS ──
export async function subscribe(email) {
  const q = query(collection(db, "subscribers"), where("email", "==", email));
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error("Already subscribed!");
  return addDoc(collection(db, "subscribers"), {
    email,
    subscribedAt: serverTimestamp()
  });
}

export async function getSubscriberCount() {
  const snap = await getDocs(collection(db, "subscribers"));
  return snap.size;
}

// ── FORMAT DATE ──
export function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ── READ TIME ──
export function readTime(body) {
  const words = body ? body.split(/\s+/).length : 0;
  return Math.ceil(words / 200) + " min read";
}
