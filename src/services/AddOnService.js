import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
export const fetchAddons = async () => {
  var addOns = [];
  // Fetch bases
  const basesRef = collection(db, "customization_options/config/bases");
  const basesSnapshot = await getDocs(basesRef);
  const basesData = basesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    price: doc.data().price || 0,
    type: "base",
  }));
  addOns.push(...basesData);

  // Fetch toppings
  const toppingsRef = collection(db, "customization_options/config/toppings");
  const toppingsSnapshot = await getDocs(toppingsRef);
  const toppingsData = toppingsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    description: doc.data().description || "",
    price: doc.data().price || 0,
    type: "topping",
  }));
  addOns.push(...toppingsData);

  // Fetch boosters
  const boostersRef = collection(db, "customization_options/config/boosters");
  const boostersSnapshot = await getDocs(boostersRef);
  const boostersData = boostersSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    description: doc.data().description || "",
    price: doc.data().price || 0,
    type: "booster",
  }));
  addOns.push(...boostersData);
  return addOns;
};

export const retriveProductAddons = async (product, addOnType) => {
  if (!product || !product.addons) {
    return [];
  }
  // console.log("retriveProductAddons", product, addOnType);  
  return product.addons.filter((addon) => addon.type === `${addOnType}`);
};
