// Utility functions for managing items in the shopping list

/**
 * Find an item in the list by name (case-insensitive).
 * @param {Array} items - The list of items.
 * @param {string} name - The name of the item to find.
 * @returns {Object|null} - The found item or null if not found.
 */
export function findItemByName(items, name) {
  return (
    items.find((item) => item.name.toLowerCase() === name.toLowerCase()) || null
  );
}

/**
 * Add or update an item in the list.
 * @param {Array} items - The list of items.
 * @param {string} name - The name of the item to add or update.
 * @param {number} quantity - The quantity to add.
 * @returns {Array} - The updated list of items.
 */
export function addItem(items, name, quantity) {
  const existingIndex = items.findIndex(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex >= 0) {
    const updatedItems = [...items];
    updatedItems[existingIndex] = {
      ...updatedItems[existingIndex],
      qty: updatedItems[existingIndex].qty + quantity,
    };
    return updatedItems;
  }

  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    qty: quantity,
  };
  return [...items, newItem];
}

/**
 * Remove an item from the list by name.
 * @param {Array} items - The list of items.
 * @param {string} name - The name of the item to remove.
 * @returns {Array} - The updated list of items.
 */
export function removeItem(items, name) {
  return items.filter((item) => item.name.toLowerCase() !== name.toLowerCase());
}

/**
 * Increment the quantity of an item by ID.
 * @param {Array} items - The list of items.
 * @param {string} id - The ID of the item to increment.
 * @returns {Array} - The updated list of items.
 */
export function incrementItemQuantity(items, id) {
  return items.map((item) =>
    item.id === id ? { ...item, qty: item.qty + 1 } : item
  );
}

/**
 * Decrement the quantity of an item by ID.
 * @param {Array} items - The list of items.
 * @param {string} id - The ID of the item to decrement.
 * @returns {Array} - The updated list of items.
 */
export function decrementItemQuantity(items, id) {
  return items.map((item) =>
    item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item
  );
}

/**
 * Delete an item by ID.
 * @param {Array} items - The list of items.
 * @param {string} id - The ID of the item to delete.
 * @returns {Array} - The updated list of items.
 */
export function deleteItemById(items, id) {
  return items.filter((item) => item.id !== id);
}

/**
 * Toggle the 'bought' flag of an item by ID.
 * @param {Array} items - The list of items.
 * @param {string} id - The ID of the item to toggle.
 * @returns {Array} - The updated list of items.
 */
export function toggleItemBought(items, id) {
  return items.map((item) =>
    item.id === id ? { ...item, bought: !item.bought } : item
  );
}
