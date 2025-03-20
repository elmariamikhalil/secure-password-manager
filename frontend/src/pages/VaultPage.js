// src/pages/EnhancedVaultPage.js

import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSearch,
  FaSpinner,
  FaFilter,
  FaSort,
  FaTimes,
  FaExclamationCircle,
} from "react-icons/fa";
import EnhancedVaultItem from "../components/vault/EnhancedVaultItem";
import VaultItemForm from "../components/vault/VaultItemForm";
import ShareItemForm from "../components/vault/ShareItemForm";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/Toast";
import {
  getVaultItems,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  shareVaultItem,
  generateNewPassword,
} from "../services/vault.service";
import { isVaultAccessible } from "../services/auth.service";

const VaultPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Check if vault is accessible
  const [vaultAccessible, setVaultAccessible] = useState(false);

  // Get toast notifications
  const toast = useToast();

  // Category filters
  const categories = [
    { id: "all", name: "All Items" },
    { id: "favorites", name: "Favorites" },
    { id: "login", name: "Logins" },
    { id: "secure_note", name: "Secure Notes" },
    { id: "card", name: "Payment Cards" },
    { id: "identity", name: "Identities" },
  ];

  // Sorting options
  const sortOptions = [
    { id: "name", name: "Name" },
    { id: "updatedAt", name: "Last Updated" },
    { id: "createdAt", name: "Date Created" },
  ];

  useEffect(() => {
    // Check if encryption key is available
    const accessible = isVaultAccessible();
    setVaultAccessible(accessible);

    if (accessible) {
      fetchItems();
    }
  }, []);

  // Fetch vault items from API
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getVaultItems();
      setItems(data);
      setFilteredItems(data);
      setError(null);
      toast.success("Vault items loaded successfully");
    } catch (error) {
      console.error("Failed to fetch vault items:", error);
      setError("Failed to load your vault items. Please try again.");
      toast.error("Failed to load vault items");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...items];

    // Apply category filter
    if (filter === "favorites") {
      result = result.filter((item) => item.metadata?.favorite);
    } else if (filter !== "all") {
      result = result.filter((item) => item.itemType === filter);
    }

    // Apply search term
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const searchable = [
          item.url,
          item.username,
          item.metadata?.name,
          item.metadata?.domain,
          item.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(searchLower);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;

      if (sortBy === "name") {
        valueA = a.metadata?.name || new URL(a.url).hostname;
        valueB = b.metadata?.name || new URL(b.url).hostname;
      } else {
        valueA = new Date(a[sortBy]);
        valueB = new Date(b[sortBy]);
      }

      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredItems(result);
  }, [searchTerm, filter, sortBy, sortOrder, items]);

  // Handle adding a new item
  const handleAddItem = () => {
    setCurrentItem(null);
    setShowAddEditModal(true);
  };

  // Handle editing an item
  const handleEditItem = (item) => {
    setCurrentItem(item);
    setShowAddEditModal(true);
  };

  // Handle deleting an item
  const handleDeleteClick = (itemId) => {
    const item = items.find((item) => item.id === itemId);
    setCurrentItem(item);
    setShowDeleteModal(true);
  };

  // Handle sharing an item
  const handleShareClick = (item) => {
    setCurrentItem(item);
    setShowShareModal(true);
  };

  // Save an item (create or update)
  const handleSaveItem = async (itemData) => {
    try {
      if (currentItem) {
        // Update existing item
        const updated = await updateVaultItem(currentItem.id, itemData, {
          domain: new URL(itemData.url).hostname,
          name: itemData.name || new URL(itemData.url).hostname,
          favorite: itemData.favorite || false,
        });

        setItems(
          items.map((item) =>
            item.id === currentItem.id ? { ...updated, ...itemData } : item
          )
        );

        toast.success("Password updated successfully");
      } else {
        // Create new item
        const newItem = await createVaultItem(
          itemData,
          itemData.type || "login",
          {
            domain: new URL(itemData.url).hostname,
            name: itemData.name || new URL(itemData.url).hostname,
            favorite: itemData.favorite || false,
          }
        );

        setItems([...items, { ...newItem, ...itemData }]);
        toast.success("Password saved successfully");
      }

      setShowAddEditModal(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save password");
    }
  };

  // Confirm delete an item
  const handleConfirmDelete = async () => {
    try {
      await deleteVaultItem(currentItem.id);
      setItems(items.filter((item) => item.id !== currentItem.id));
      setShowDeleteModal(false);
      toast.success("Password deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete password");
    }
  };

  // Share an item with another user
  const handleShareItem = async (email, permissions) => {
    try {
      await shareVaultItem(currentItem.id, email, permissions);
      toast.success(`Password shared with ${email}`);
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing item:", error);
      toast.error("Failed to share password");
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Set error state
  const [error, setError] = useState(null);

  // Render vault not accessible message
  if (!vaultAccessible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <FaExclamationCircle className="text-primary-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-dark-800 mb-4">
              Vault Locked
            </h1>
            <p className="text-dark-600 mb-6">
              Your vault is locked. Please log in again to access your
              passwords.
            </p>
            <a href="/login" className="btn btn-primary">
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-dark-800">
            Your Secure Vault
          </h1>
          <button onClick={handleAddItem} className="btn btn-primary">
            <FaPlus className="mr-2" />
            Add Item
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-dark-400" />
              </div>
              <input
                type="text"
                placeholder="Search your vault..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchTerm("")}
                >
                  <FaTimes className="text-dark-400 hover:text-dark-600" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-select pl-10 pr-8 py-2 appearance-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-dark-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select pl-10 pr-8 py-2 appearance-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSort className="text-dark-400" />
                </div>
                <button
                  onClick={toggleSortOrder}
                  className="absolute inset-y-0 right-10 flex items-center pr-2"
                  title={
                    sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger mb-6">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-primary-600 text-4xl" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="animate-fade-in">
            {filteredItems.map((item, index) => (
              <div key={item.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <EnhancedVaultItem
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteClick}
                  onShare={handleShareClick}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 animate-fade-in">
            {searchTerm || filter !== "all" ? (
              <>
                <p className="text-dark-600 text-lg mb-4">
                  No items match your search or filter
                </p>
                <div className="flex justify-center space-x-4">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="btn btn-outline"
                    >
                      Clear Search
                    </button>
                  )}
                  {filter !== "all" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="btn btn-outline"
                    >
                      Show All Items
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-dark-600 text-lg mb-4">
                  Your vault is empty
                </p>
                <button onClick={handleAddItem} className="btn btn-primary">
                  Add Your First Password
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {showAddEditModal && (
        <VaultItemForm
          item={currentItem}
          onSave={handleSaveItem}
          onClose={() => setShowAddEditModal(false)}
          generatePassword={generateNewPassword}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Item"
        size="sm"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-danger-100 rounded-full flex items-center justify-center">
            <FaExclamationCircle className="text-danger-500 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Delete Confirmation</h3>
          <p className="text-dark-600">
            Are you sure you want to delete "
            {currentItem?.metadata?.name || "this item"}"? This action cannot be
            undone.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button onClick={handleConfirmDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </Modal>

      {/* Share Item Modal */}
      {showShareModal && (
        <ShareItemForm
          item={currentItem}
          onShare={handleShareItem}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default VaultPage;
