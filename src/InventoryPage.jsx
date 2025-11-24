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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M480-120q-117 0-198.5-81.5T200-400q0-94 55.5-168.5T401-669q-20-5-39-14.5T328-708q-33-33-42.5-78.5T281-879q47-5 92.5 4.5T452-832q23 23 33.5 52t13.5 61q13-31 31.5-58.5T572-828q11-11 28-11t28 11q11 11 11 28t-11 28q-22 22-39 48.5T564-667q88 28 142 101.5T760-400q0 117-81.5 198.5T480-120Zm0-80q83 0 141.5-58.5T680-400q0-83-58.5-141.5T480-600q-83 0-141.5 58.5T280-400q0 83 58.5 141.5T480-200Zm0-200Z" />
        </svg>
      ),
      bgClass: "bg-amber-100",
      iconClass: "text-amber-600",
    };
  }
  if (n.includes("flour") || n.includes("atta")) {
    return {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M480-120q-117 0-198.5-81.5T200-400q0-77 25.5-155t66-141.5Q332-760 382-800t98-40q49 0 98.5 40t90 103.5Q709-633 734.5-555T760-400q0 117-81.5 198.5T480-120Zm0-80q83 0 141.5-58.5T680-400q0-57-19.5-120t-49-116.5Q582-690 547-725t-67-35q-31 0-66.5 35t-65 88.5Q319-583 299.5-520T280-400q0 83 58.5 141.5T480-200Zm40-40q17 0 28.5-11.5T560-280q0-17-11.5-28.5T520-320q-50 0-85-35t-35-85q0-17-11.5-28.5T360-480q-17 0-28.5 11.5T320-440q0 83 58.5 141.5T520-240Zm-40-240Z" />
        </svg>
      ),
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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z" />
        </svg>
      ),
      bgClass: "bg-sky-100",
      iconClass: "text-sky-600",
    };
  }
  if (n.includes("straw") || n.includes("stick") || n.includes("spoon")) {
    return {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M400-160h160v-44l50-20q65-26 110.5-72.5T786-400H174q20 57 65 103.5T350-224l50 20v44Zm-80 80v-70q-107-42-173.5-130T80-480h80v-320l720-80v60l-460 52v68h460v60H420v160h460q0 112-66.5 200T640-150v70H320Zm0-620h40v-62l-40 5v57Zm-100 0h40v-50l-40 4v46Zm100 220h40v-160h-40v160Zm-100 0h40v-160h-40v160Zm260 80Z" />
        </svg>
      ),
      bgClass: "bg-emerald-100",
      iconClass: "text-emerald-600",
    };
  }
  if (n.includes("tissue") || n.includes("cover") || n.includes("bag")) {
    return {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z" />
        </svg>
      ),
      bgClass: "bg-purple-100",
      iconClass: "text-purple-600",
    };
  }
  if (n.includes("dust") || n.includes("bin")) {
    return {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
        </svg>
      ),
      bgClass: "bg-rose-100",
      iconClass: "text-rose-600",
    };
  }
  if (n.includes("ice") || n.includes("gala")) {
    return {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M440-80v-166L310-118l-56-56 186-186v-80h-80L174-254l-56-56 128-130H80v-80h166L118-650l56-56 186 186h80v-80L254-786l56-56 130 128v-166h80v166l130-128 56 56-186 186v80h80l186-186 56 56-128 130h166v80H714l128 130-56 56-186-186h-80v80l186 186-56 56-130-128v166h-80Z" />
        </svg>
      ),
      bgClass: "bg-cyan-100",
      iconClass: "text-cyan-600",
    };
  }

  // default style
  return {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z" />
      </svg>
    ),
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

// stock level filter helpers
const STOCK_FILTERS = [
  { id: "all", label: "All", className: "text-slate-600" },
  { id: "low", label: "Low", className: "text-red-500" }, // red
  { id: "mid", label: "Medium", className: "text-amber-500" }, // orange
  { id: "high", label: "Good", className: "text-emerald-600" }, // green
];

const matchesStockFilter = (left, filterId) => {
  if (filterId === "low") return left <= 5;
  if (filterId === "mid") return left > 5 && left <= 20;
  if (filterId === "high") return left > 20;
  // "all"
  return true;
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
  const [stockFilter, setStockFilter] = useState("all"); // NEW

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

    return items.filter((it) => {
      const matchesSearch = !term ? true : it.name.toLowerCase().includes(term);

      const left = calcLeft(it);
      const matchesLevel = matchesStockFilter(left, stockFilter);

      return matchesSearch && matchesLevel;
    });
  }, [items, search, stockFilter]);

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
            <p className="text-sm text-gray-500">
              Simple stock list for your shops.
            </p>
          </div>

          {/* ADD NEW ITEM CARD */}
          <details className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
              <span className="text-base font-semibold">Add New Item</span>
              <span className="material-symbols-outlined transition-transform duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                </svg>
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
                    setStockFilter("all");
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

            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search item..."
                className="w-full bg-white border border-transparent rounded-2xl py-2.5 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Stock Level Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STOCK_FILTERS.map((f) => {
                const isActive = stockFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStockFilter(f.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                      isActive
                        ? "bg-slate-50 text-white border-2 border-slate-200 "
                        : "bg-white border-slate-200  text-slate-700"
                    }`}
                  >
                    {f.id !== "all" && (
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          f.id === "low"
                            ? "bg-red-500"
                            : f.id === "mid"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    )}
                    <span className={f.className}>{f.label}</span>
                  </button>
                );
              })}
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
