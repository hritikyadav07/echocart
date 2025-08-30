// Utility functions for managing suggestions in the shopping list app

/**
 * Get suggestions based on a search query.
 * @param {Array} suggestions - The list of available suggestions.
 * @param {string} query - The search query.
 * @returns {Array} - A filtered list of suggestions matching the query.
 */
export function getSuggestions(suggestions, query) {
  const lowerQuery = query.toLowerCase();
  return suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Add a new suggestion to the list if it doesn't already exist.
 * @param {Array} suggestions - The list of available suggestions.
 * @param {string} newSuggestion - The new suggestion to add.
 * @returns {Array} - The updated list of suggestions.
 */
export function addSuggestion(suggestions, newSuggestion) {
  const lowerNewSuggestion = newSuggestion.toLowerCase();
  if (suggestions.some((s) => s.toLowerCase() === lowerNewSuggestion)) {
    return suggestions;
  }
  return [...suggestions, newSuggestion];
}

/**
 * Remove a suggestion from the list.
 * @param {Array} suggestions - The list of available suggestions.
 * @param {string} suggestionToRemove - The suggestion to remove.
 * @returns {Array} - The updated list of suggestions.
 */
export function removeSuggestion(suggestions, suggestionToRemove) {
  const lowerSuggestionToRemove = suggestionToRemove.toLowerCase();
  return suggestions.filter((s) => s.toLowerCase() !== lowerSuggestionToRemove);
}
