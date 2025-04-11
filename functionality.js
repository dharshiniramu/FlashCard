// Functionality for managing saved sets and switching sections

// Save set data to localStorage
function saveToLocalStorage() {
  localStorage.setItem('savedSets', JSON.stringify(savedSets));
}

// Load set data from localStorage
function loadFromLocalStorage() {
  const savedSetsData = localStorage.getItem('savedSets');
  if (savedSetsData) {
    savedSets = JSON.parse(savedSetsData);
    updateDropdown();
  }
}

// Update the message container with success or error messages
function showMessage(message, type = 'success') {
  const messageContainer = document.getElementById('messageContainer');
  messageContainer.textContent = message;
  messageContainer.style.color = type === 'error' ? 'red' : 'green'; // Red for errors, green for success
}

// Add word to the current set
document.getElementById('addWord').addEventListener('click', () => {
  const word = document.getElementById('word').value.trim();
  const definition = document.getElementById('definition').value.trim();

  if (word && definition) {
    currentSet.words.push({ word, definition });
    showMessage(`Word "${word}" added to the set.`);
    document.getElementById('word').value = '';
    document.getElementById('definition').value = '';
  } else {
    showMessage('Please enter both word and definition.', 'error');
  }
});

// Save the set
document.getElementById('saveSet').addEventListener('click', () => {
  const setName = document.getElementById('setName').value.trim();

  if (setName) {
    // Check if the set already exists
    const existingSetIndex = savedSets.findIndex(set => set.name === setName);

    if (existingSetIndex !== -1) {
      // Set already exists, add words to the existing set
      currentSet = savedSets[existingSetIndex];
      showMessage(`Set "${setName}" already exists. Words will be added to the existing set.`);
    } else {
      // New set, save it
      currentSet.name = setName;
      savedSets.push({ ...currentSet }); // Save a copy of the current set
      showMessage(`Set "${setName}" saved.`);
    }

    updateDropdown(); // Update the dropdown with saved sets
    document.getElementById('setName').value = ''; // Clear the input
    currentSet = { name: '', words: [] }; // Reset current set
    saveToLocalStorage(); // Save to local storage
  } else {
    showMessage('Please enter a set name.', 'error');
  }
});

// Update dropdown with saved sets
function updateDropdown() {
  const dropdown = document.getElementById('savedSetsDropdown');
  dropdown.innerHTML = `<option value="" disabled selected>Select a set</option>`; // Clear previous options

  savedSets.forEach((set, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = set.name;
    dropdown.appendChild(option);
  });
}

// Select a saved set
document.getElementById('selectSavedSet').addEventListener('click', () => {
  const dropdown = document.getElementById('savedSetsDropdown');
  const selectedValue = dropdown.value;

  if (selectedValue !== '') {
    const selectedSet = savedSets[selectedValue];
    showMessage(`You selected: ${selectedSet.name}`);
    console.log(selectedSet); // Display selected set details in the console
    currentSet = selectedSet; // Set current set for Learn Mode
  } else {
    showMessage('Please select a set first.', 'error');
  }
});

// Delete a saved set
document.getElementById('deleteSavedSet').addEventListener('click', () => {
  const dropdown = document.getElementById('savedSetsDropdown');
  const selectedValue = dropdown.value;

  if (selectedValue !== '') {
    const deletedSet = savedSets.splice(selectedValue, 1)[0];
    updateDropdown(); // Update dropdown after deletion
    showMessage(`Set "${deletedSet.name}" deleted.`);
    saveToLocalStorage(); // Save to local storage after deletion
  } else {
    showMessage('Please select a set to delete.', 'error');
  }
});

// Function to reset visibility of sections
function resetSections() {
  const sections = document.querySelectorAll('.form-section');
  sections.forEach(section => {
    section.style.display = 'none';
    section.style.justifyContent = 'center'; // Ensure vertical centering
    section.style.alignItems = 'center';    // Ensure horizontal centering
  });
}

// Navigation between sections
document.getElementById('createSetButton').addEventListener('click', () => {
  resetSections();
  document.getElementById('createSetSection').style.display = 'flex';
});

document.getElementById('selectSetButton').addEventListener('click', () => {
  resetSections();
  document.getElementById('selectSetSection').style.display = 'flex';
});

document.getElementById('learnModeButton').addEventListener('click', () => {
  resetSections();
  document.getElementById('learnModeSection').style.display = 'flex';
  initializeLearnMode(); // Initialize Learn Mode when navigating to it
});

// Learn Mode functionality
function initializeLearnMode() {
  if (currentSet.words.length === 0) {
    showMessage('No words available in the selected set. Please select a valid set.', 'error');
    return;
  }
  currentIndex = 0; // Reset to the first card
  isDefinitionVisible = false; // Initially show only the word
  displayCard(); // Display the first card
}

function displayCard() {
  const flashcardWord = document.getElementById('flashcard-word');
  const flashcardDefinition = document.getElementById('flashcard-definition');

  if (currentSet.words.length > 0) {
    const currentCard = currentSet.words[currentIndex];
    flashcardWord.textContent = currentCard.word;
    flashcardDefinition.textContent = currentCard.definition;
    flashcardDefinition.style.display = isDefinitionVisible ? 'block' : 'none';
  } else {
    flashcardWord.textContent = 'No cards available.';
    flashcardDefinition.textContent = '';
  }
}

// Flip the card to show/hide the definition
document.getElementById('showDefinition').addEventListener('click', () => {
  isDefinitionVisible = !isDefinitionVisible; // Toggle visibility
  displayCard();
});

// Navigate to the next card
document.getElementById('nextCard').addEventListener('click', () => {
  if (currentSet.words.length > 0) {
    if (currentIndex < currentSet.words.length - 1) {
      currentIndex = (currentIndex + 1) % currentSet.words.length; // Next card
      isDefinitionVisible = false; // Reset to show only the word
      displayCard();
    } else {
      document.getElementById('flashcard-word').textContent = "No next word";
      document.getElementById('flashcard-definition').style.display = "none"; // Hide definition
    }
  }
});

// Navigate to the previous card
document.getElementById('previousCard').addEventListener('click', () => {
  if (currentSet.words.length > 0) {
    if (currentIndex > 0) {
      currentIndex = (currentIndex - 1 + currentSet.words.length) % currentSet.words.length; // Previous card
      isDefinitionVisible = false; // Reset to show only the word
      displayCard();
    } else {
      document.getElementById('flashcard-word').textContent = "No previous word";
      document.getElementById('flashcard-definition').style.display = "none"; // Hide definition
    }
  }
});

// Load saved sets from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
});
