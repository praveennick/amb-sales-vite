import React, { useEffect, useMemo, useState } from "react";
import {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import { adminEmails } from "./adminEmails";
import ToastHandler from "./components/common/ToastHandler";

const SHOP_OPTIONS = [
  { id: "The Juice Hut", label: "The Juice Hut" },
  { id: "Bubble Tea N Cotton Candy", label: "Bubble Tea N Cotton Candy" },
  { id: "Coffee N Candy", label: "Coffee N Candy" },
];

const UNIT_OPTIONS = ["pcs", "kg", "g", "L", "ml", "box", "bag", "pack"];

const emptyNewItem = {
  name: "",
  unit: "pcs",
  open: "",
  buy: "",
  waste: "",
  sold: "",
};

// ---------- icon + color helper ----------
const getItemStyles = (name = "") => {
  const n = name.toLowerCase();

  if (n.includes("sugar") || n.includes("salt")) {
    return {
      icon: "nutrition",
      bgClass: "bg-amber-100",
      iconClass: "text-amber-600",
    };
  }
  if (n.includes("flour") || n.includes("atta")) {
    return {
      icon: "egg",
      bgClass: "bg-orange-100",
      iconClass: "text-orange-600",
    };
  }
  if (
    n.includes("glass") ||
    n.includes("cup") ||
    n.includes("bowl") ||
    n.includes("plate")
  ) {
    return {
      icon: "restaurant",
      bgClass: "bg-sky-100",
      iconClass: "text-sky-600",
    };
  }
  if (n.includes("straw") || n.includes("stick") || n.includes("spoon")) {
    return {
      icon: "ramen_dining",
      bgClass: "bg-emerald-100",
      iconClass: "text-emerald-600",
    };
  }
  if (n.includes("tissue") || n.includes("cover") || n.includes("bag")) {
    return {
      icon: "inventory_2",
      bgClass: "bg-purple-100",
      iconClass: "text-purple-600",
    };
  }
  if (n.includes("dust") || n.includes("bin")) {
    return {
      icon: "delete",
      bgClass: "bg-rose-100",
      iconClass: "text-rose-600",
    };
  }
  if (n.includes("ice") || n.includes("gala")) {
    return {
      icon: "ac_unit",
      bgClass: "bg-cyan-100",
      iconClass: "text-cyan-600",
    };
  }

  // default style
  return {
    icon: "inventory_2",
    bgClass: "bg-blue-100",
    iconClass: "text-blue-600",
  };
};

// colour for "Left" quantity
const getLeftTextClass = (left) => {
  if (left <= 5) return "text-red-500";
  if (left <= 20) return "text-amber-500";
  return "text-emerald-600";
};

const InventoryPage = () => {
  const [user] = useAuthState(auth);
  const [shopId, setShopId] = useState(SHOP_OPTIONS[0].id);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newItem, setNewItem] = useState(emptyNewItem);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = user && adminEmails.includes(user.email || "");

  // --------- Helpers ---------
  const calcLeft = (item) => {
    const open = parseFloat(item.open) || 0;
    const buy = parseFloat(item.buy) || 0;
    const waste = parseFloat(item.waste) || 0;
    const sold = parseFloat(item.sold) || 0;
    return open + buy - waste - sold;
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => it.name.toLowerCase().includes(term));
  }, [items, search]);

  const loadItems = async (selectedShopId = shopId) => {
    if (!user || !isAdmin) return;
    setLoading(true);
    try {
      const colRef = collection(db, "inventory", selectedShopId, "items");
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setItems(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
      ToastHandler.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadItems();
    }
  }, [user, isAdmin, shopId]);

  const handleNewItemChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      ToastHandler.error("Item name is required");
      return;
    }
    setAdding(true);
    try {
      const colRef = collection(db, "inventory", shopId, "items");
      const payload = {
        name: newItem.name.trim(),
        unit: newItem.unit,
        open: newItem.open || "0",
        buy: newItem.buy || "0",
        waste: newItem.waste || "0",
        sold: newItem.sold || "0",
      };
      const docRef = await addDoc(colRef, payload);
      setItems((prev) => [...prev, { id: docRef.id, ...payload }]);
      setNewItem(emptyNewItem);
      ToastHandler.success("Item added");
    } catch (err) {
      console.error("Error adding item:", err);
      ToastHandler.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const handleItemFieldChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveItem = async (item) => {
    setSavingId(item.id);
    try {
      const docRef = doc(db, "inventory", shopId, "items", item.id);
      await updateDoc(docRef, {
        name: item.name,
        unit: item.unit,
        open: item.open || "0",
        buy: item.buy || "0",
        waste: item.waste || "0",
        sold: item.sold || "0",
      });
      ToastHandler.success("Item updated");
      setEditingId(null);
    } catch (err) {
      console.error("Error updating item:", err);
      ToastHandler.error("Failed to update item");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const docRef = doc(db, "inventory", shopId, "items", id);
      await deleteDoc(docRef);
      setItems((prev) => prev.filter((i) => i.id !== id));
      ToastHandler.success("Item deleted");
    } catch (err) {
      console.error("Error deleting item:", err);
      ToastHandler.error("Failed to delete item");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <p className="text-sm text-gray-600">
          Please login to view the inventory.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <p className="text-sm text-gray-600">
          Only admins can view and edit this page.
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-slate-100 min-h-screen">
      <div className="mx-auto min-h-screen">
        <main className="p-2 space-y-6 pb-10">
          {/* PAGE TITLE */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-gray-500">
              Simple stock list for your shops.
            </p>
          </div>

          {/* ADD NEW ITEM CARD */}
          <details className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
              <span className="text-base font-semibold">Add New Item</span>
              <span className="material-symbols-outlined transition-transform duration-300">
                add
              </span>
            </summary>
            <div className="p-4 border-t border-slate-200">
              <form className="space-y-4" onSubmit={handleAddItem}>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Item name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. sugar"
                    value={newItem.name}
                    onChange={(e) =>
                      handleNewItemChange("name", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.unit}
                      onChange={(e) =>
                        handleNewItemChange("unit", e.target.value)
                      }
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Open
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.open}
                      onChange={(e) =>
                        handleNewItemChange("open", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Buy
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.buy}
                      onChange={(e) =>
                        handleNewItemChange("buy", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Waste
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.waste}
                      onChange={(e) =>
                        handleNewItemChange("waste", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sold
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.sold}
                      onChange={(e) =>
                        handleNewItemChange("sold", e.target.value)
                      }
                    />
                  </div>
                </div>

                <p className="text-[11px] text-center text-gray-500">
                  Left = Open + Buy - Waste - Sold
                </p>

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm hover:bg-blue-600 disabled:opacity-60"
                >
                  {adding ? "Saving..." : "Add item"}
                </button>
              </form>
            </div>
          </details>

          {/* SHOP SELECT + SEARCH + LIST */}
          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">Stock</h2>
                  <p className="text-xs text-gray-500">
                    Manage your current items.
                  </p>
                </div>
                <select
                  className="rounded-full border border-slate-300 bg-white px-3 py-3 text-sm"
                  value={shopId}
                  onChange={(e) => {
                    setShopId(e.target.value);
                    setItems([]);
                    setEditingId(null);
                    setSearch("");
                    loadItems(e.target.value);
                  }}
                >
                  {SHOP_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search item..."
                className="w-full bg-white border border-transparent rounded-2xl py-2.5 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <p className="text-center text-sm text-gray-500 mt-4">
                Loading...
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-4">
                No items found.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const left = calcLeft(item);
                  const isEditing = editingId === item.id;
                  const styles = getItemStyles(item.name);
                  const leftClass = getLeftTextClass(left);

                  return (
                    <details
                      key={item.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden group"
                    >
                      <summary className="flex justify-between items-center p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div
                            className={`${styles.bgClass} h-[40px] w-[40px] rounded-full flex items-center justify-center`}
                          >
                            <span
                              className={`material-symbols-outlined ${styles.iconClass}`}
                            >
                              {styles.icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm capitalize">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Unit: {item.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-0.5">Left</p>
                          <p className={`text-lg font-bold ${leftClass}`}>
                            {left.toString()}
                          </p>
                        </div>
                      </summary>

                      <div className="px-4 pb-4 border-t border-slate-200 pt-4">
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">
                              Open
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                              value={item.open}
                              disabled={!isEditing}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.id,
                                  "open",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">
                              Buy
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                              value={item.buy}
                              disabled={!isEditing}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.id,
                                  "buy",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">
                              Waste
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                              value={item.waste}
                              disabled={!isEditing}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.id,
                                  "waste",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">
                              Sold
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                              value={item.sold}
                              disabled={!isEditing}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.id,
                                  "sold",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {!isEditing ? (
                            <button
                              type="button"
                              className="flex-1 bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl shadow-sm hover:bg-blue-600"
                              onClick={() => setEditingId(item.id)}
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="flex-1 bg-green-500 text-white text-xs font-semibold py-2 rounded-xl shadow-sm hover:bg-green-600 disabled:opacity-60"
                              disabled={savingId === item.id}
                              onClick={() => handleSaveItem(item)}
                            >
                              {savingId === item.id ? "Saving..." : "Save"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="flex-1 bg-red-500 text-white text-xs font-semibold py-2 rounded-xl shadow-sm hover:bg-red-600"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          <p className="text-[11px] text-center text-gray-400 mt-4">
            Only admins can view & edit this inventory.
          </p>
        </main>
      </div>
    </div>
  );
};

export default InventoryPage;
