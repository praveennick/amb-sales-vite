import React, { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "./firebase";
import { adminEmails } from "./adminEmails";
import LoadingSpinner from "./components/common/LoadingSpinner/LoadingSpinner";
import ToastHandler from "./components/common/ToastHandler";

const SHOPS = ["The Juice Hut", "Bubble Tea N Cotton Candy", "Coffee N Candy"];

const UNIT_OPTIONS = ["kg", "g", "ltr", "ml", "pcs", "box", "bag", "pkt"];

const emptyItem = {
  name: "",
  unit: "",
  opening: "",
  purchased: "",
  wastage: "",
  sold: "",
};

const InventoryPage = () => {
  const [user] = useAuthState(auth);
  const [selectedShop, setSelectedShop] = useState(SHOPS[0]);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // NEW: per-row edit state
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);

  // NEW: search/filter text
  const [searchText, setSearchText] = useState("");

  const isAdmin = !!user && adminEmails.includes(user.email || "");

  const getShopCollectionRef = useCallback(
    () => collection(db, "inventory", selectedShop, "items"),
    [selectedShop]
  );

  const fetchItems = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const snap = await getDocs(getShopCollectionRef());
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setItems(list);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      ToastHandler.error("Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, [getShopCollectionRef, isAdmin]);

  useEffect(() => {
    if (user !== undefined) {
      setInitialCheckDone(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
      // exit edit mode when shop changes
      setEditingId(null);
      setEditingDraft(null);
    } else if (initialCheckDone) {
      setItems([]);
    }
  }, [fetchItems, isAdmin, selectedShop, initialCheckDone]);

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const parseNumber = (val) => {
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  };

  const calcClosing = (item) => {
    const opening = parseNumber(item.opening);
    const purchased = parseNumber(item.purchased);
    const wastage = parseNumber(item.wastage);
    const sold = parseNumber(item.sold);
    return opening + purchased - wastage - sold;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!newItem.name.trim()) {
      ToastHandler.error("Item name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: newItem.name.trim().toLowerCase(),
        unit: newItem.unit || "",
        opening: parseNumber(newItem.opening),
        purchased: parseNumber(newItem.purchased),
        wastage: parseNumber(newItem.wastage),
        sold: parseNumber(newItem.sold),
        closing: calcClosing(newItem),
        updatedAt: new Date(),
      };

      await addDoc(getShopCollectionRef(), payload);
      ToastHandler.success("Item added.");
      setNewItem(emptyItem);
      await fetchItems();
    } catch (err) {
      console.error("Error adding item:", err);
      ToastHandler.error("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: start editing a row
  const startEdit = (item) => {
    setEditingId(item.id);
    // make a shallow copy so cancel works
    setEditingDraft({
      ...item,
      opening: item.opening ?? "",
      purchased: item.purchased ?? "",
      wastage: item.wastage ?? "",
      sold: item.sold ?? "",
    });
  };

  // NEW: change field while editing
  const handleEditFieldChange = (field, value) => {
    setEditingDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // NEW: cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft(null);
  };

  // existing save logic adapted for editingDraft
  const handleSaveItem = async () => {
    if (!isAdmin || !editingDraft) return;
    setLoading(true);
    try {
      const updated = {
        ...editingDraft,
        opening: parseNumber(editingDraft.opening),
        purchased: parseNumber(editingDraft.purchased),
        wastage: parseNumber(editingDraft.wastage),
        sold: parseNumber(editingDraft.sold),
      };
      updated.closing = calcClosing(updated);
      updated.updatedAt = new Date();

      const ref = doc(db, "inventory", selectedShop, "items", editingDraft.id);
      await updateDoc(ref, updated);
      ToastHandler.success("Saved.");
      await fetchItems();
      cancelEdit();
    } catch (err) {
      console.error("Error saving item:", err);
      ToastHandler.error("Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!isAdmin) return;
    const ok = window.confirm(`Delete "${item.name}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      const ref = doc(db, "inventory", selectedShop, "items", item.id);
      await deleteDoc(ref);
      ToastHandler.success("Item deleted.");
      await fetchItems();
      if (editingId === item.id) {
        cancelEdit();
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      ToastHandler.error("Failed to delete.");
    } finally {
      setLoading(false);
    }
  };

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-sm text-center">
          <p className="text-lg font-semibold text-slate-800">
            Inventory – Admin Only
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Only admin accounts can view and edit stock.
          </p>
        </div>
      </div>
    );
  }

  // NEW: filter items by search
  const filteredItems = items.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return item.name?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header + shop selector */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Select a Shop
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
            >
              {SHOPS.map((shop) => (
                <option key={shop} value={shop}>
                  {shop}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add item card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <h2 className="mb-3 text-base font-semibold text-slate-800">
            Add new item
          </h2>
          <form onSubmit={handleAddItem} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-600">
                Item name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. sugar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newItem.name}
                onChange={(e) => handleNewChange("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Unit
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem.unit}
                  onChange={(e) => handleNewChange("unit", e.target.value)}
                >
                  <option value="">Select</option>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Open
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem.opening}
                  onChange={(e) => handleNewChange("opening", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Buy
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem.purchased}
                  onChange={(e) => handleNewChange("purchased", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Waste
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem.wastage}
                  onChange={(e) => handleNewChange("wastage", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Sold
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem.sold}
                  onChange={(e) => handleNewChange("sold", e.target.value)}
                />
              </div>
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              Left = Open + Buy − Waste − Sold
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              Add item
            </button>
          </form>
        </div>

        {/* Search + list items */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Stock for {selectedShop}
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Tap <span className="font-semibold">Edit</span> to change
                numbers. Left is calculated automatically.
              </p>
            </div>

            {/* Search input */}
            <div className="mt-2 sm:mt-0 w-full sm:w-56">
              <input
                type="text"
                placeholder="Search item..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {loading && items.length === 0 ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">
              No items found. Try a different name.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {filteredItems.map((item) => {
                const isEditing = editingId === item.id;
                const rowData =
                  isEditing && editingDraft?.id === item.id
                    ? editingDraft
                    : item;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {rowData.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Unit: {rowData.unit || "-"}
                        </p>
                      </div>

                      {/* Unit dropdown (only editable in edit mode) */}
                      <select
                        className={`rounded-lg border border-slate-200 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isEditing ? "bg-white" : "bg-slate-100 text-slate-500"
                        }`}
                        value={rowData.unit}
                        disabled={!isEditing}
                        onChange={(e) =>
                          handleEditFieldChange("unit", e.target.value)
                        }
                      >
                        <option value="">unit</option>
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Numbers */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { key: "opening", label: "Open" },
                        { key: "purchased", label: "Buy" },
                        { key: "wastage", label: "Waste" },
                        { key: "sold", label: "Sold" },
                      ].map((field) => (
                        <div className="flex flex-col gap-1" key={field.key}>
                          <span className="font-medium text-slate-600">
                            {field.label}
                          </span>
                          <input
                            type="number"
                            className={`w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isEditing
                                ? "bg-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                            value={rowData[field.key] ?? ""}
                            readOnly={!isEditing}
                            onChange={(e) =>
                              handleEditFieldChange(field.key, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      {/* Left / closing */}
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-600">Left</span>
                        <div className="flex h-[32px] items-center rounded-lg border border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-800">
                          {calcClosing(rowData)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                            disabled={loading}
                            onClick={handleSaveItem}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                            disabled={loading}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                            disabled={loading}
                            onClick={() => handleDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                            disabled={loading}
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                            disabled={loading}
                            onClick={() => handleDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-[10px] text-right text-slate-400">
            Only admins can view & edit this page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
