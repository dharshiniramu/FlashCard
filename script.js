document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginSection = document.getElementById("loginSection");
  const signupSection = document.getElementById("signupSection");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");
  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");
  const messageContainer = document.getElementById("messageContainer");
  
  let currentUser = null;
  let currentSet = { set_id: null, name: '', words: [] };
  let currentIndex = 0;
  let isDefinitionVisible = false;
  let savedSets = [];

  // Switch between login/signup forms
  if (signupLink) {
    signupLink.addEventListener("click", (e) => {
      e.preventDefault();
      signupSection.style.display = "flex";
      loginSection.style.display = "none";
    });
  }

  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      signupSection.style.display = "none";
      loginSection.style.display = "flex";
    });
  }

  // Handle Signup
  if (signupSubmit) {
    signupSubmit.addEventListener("click", async () => {
      const name = document.getElementById("signupName").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      if (!name || !email || !password) {
        showMessage("All fields are required!", "red");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: name, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          showMessage("Signup successful! Please log in.", "green");
          signupSection.style.display = "none";
          loginSection.style.display = "flex";
        } else {
          showMessage(data.message || "Error signing up", "red");
        }
      } catch (error) {
        showMessage("Error signing up. Try again.", "red");
      }
    });
  }

  // Handle Login
  if (loginSubmit) {
    loginSubmit.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        showMessage("Both fields are required!", "red");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          showMessage("Login successful! Redirecting...", "green");
          currentUser = data.user;
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("token", data.token);
          
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        } else {
          showMessage(data.message || "Invalid credentials", "red");
        }
      } catch (error) {
        showMessage("Error logging in. Try again.", "red");
      }
    });
  }

  // Add word to current set (local only until set is saved)
  if (document.getElementById('addWord')) {
    document.getElementById('addWord').addEventListener('click', () => {
      const word = document.getElementById('word').value.trim();
      const definition = document.getElementById('definition').value.trim();

      if (word && definition) {
        currentSet.words.push({ word, definition });
        showMessage(`Word "${word}" added to current set.`, 'green');
        document.getElementById('word').value = '';
        document.getElementById('definition').value = '';
      } else {
        showMessage('Please enter both word and definition.', 'red');
      }
    });
  }

  // Save the set (with all words)
  if (document.getElementById('saveSet')) {
    document.getElementById('saveSet').addEventListener('click', async () => {
      const setName = document.getElementById('setName').value.trim();
      const user = JSON.parse(localStorage.getItem('user'));

      if (!setName) {
        showMessage('Please enter a set name.', 'red');
        return;
      }

      if (!user) {
        showMessage('User not logged in.', 'red');
        return;
      }

      if (currentSet.words.length === 0) {
        showMessage('Please add at least one word to the set.', 'red');
        return;
      }

      try {
        // First create the set
        const setResponse = await fetch("http://localhost:3000/sets", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ set_name: setName }),
        });

        const setData = await setResponse.json();
        if (!setResponse.ok) {
          showMessage(setData.message || 'Error saving set', 'red');
          return;
        }

        // Then add all words to the set
        const wordsToAdd = currentSet.words;
        const addWordPromises = wordsToAdd.map(word => 
          fetch("http://localhost:3000/words", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
              set_id: setData.set_id, 
              word: word.word, 
              definition: word.definition 
            }),
          })
        );

        const wordResponses = await Promise.all(addWordPromises);
        const allWordsAdded = wordResponses.every(res => res.ok);

        if (allWordsAdded) {
          currentSet.set_id = setData.set_id;
          currentSet.name = setName;
          showMessage(`Set "${setName}" saved with ${wordsToAdd.length} words!`, 'green');
          document.getElementById('setName').value = '';
          updateSavedSetsDropdown();
        } else {
          showMessage('Error saving some words', 'red');
        }
      } catch (error) {
        showMessage('Error saving set', 'red');
      }
    });
  }

  // Load saved sets for dropdown
  async function updateSavedSetsDropdown() {
    try {
      const response = await fetch("http://localhost:3000/sets", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        savedSets = await response.json();
        const dropdown = document.getElementById('savedSetsDropdown');
        dropdown.innerHTML = '<option value="" disabled selected>Select a set</option>';
        
        savedSets.forEach(set => {
          const option = document.createElement('option');
          option.value = set.set_id;
          option.textContent = set.set_name;
          if (set.is_favorite) {
            option.dataset.favorite = true;
          }
          dropdown.appendChild(option);
        });

        // Update favorite icon for selected set if exists
        if (currentSet.set_id) {
          const selectedSet = savedSets.find(set => set.set_id == currentSet.set_id);
          if (selectedSet) {
            const favoriteIcon = document.getElementById('selectedSetFavorite');
            if (favoriteIcon) {
              favoriteIcon.textContent = selectedSet.is_favorite ? '🌟' : '⭐';
              favoriteIcon.classList.toggle('favorited', selectedSet.is_favorite);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sets:', error);
    }
  }

  // Select a saved set
  if (document.getElementById('selectSavedSet')) {
    document.getElementById('selectSavedSet').addEventListener('click', async () => {
      const dropdown = document.getElementById('savedSetsDropdown');
      const selectedId = dropdown.value;

      if (!selectedId) {
        showMessage('Please select a set first.', 'red');
        return;
      }

      try {
        const wordsRes = await fetch(`http://localhost:3000/sets/${selectedId}/words`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (wordsRes.ok) {
          const words = await wordsRes.json();
          const selectedSet = savedSets.find(set => set.set_id == selectedId);
          
          currentSet = {
            set_id: selectedId,
            name: selectedSet.set_name,
            words: words.map(w => ({ word: w.word, definition: w.definition }))
          };
          
          showMessage(`Set "${selectedSet.set_name}" loaded.`, 'green');
        } else {
          showMessage('Error loading set', 'red');
        }
      } catch (error) {
        showMessage('Error loading set', 'red');
      }
    });
  }

  // Delete a saved set - UPDATED VERSION
  if (document.getElementById('deleteSavedSet')) {
    document.getElementById('deleteSavedSet').addEventListener('click', async () => {
      const dropdown = document.getElementById('savedSetsDropdown');
      const selectedId = dropdown.value;

      if (!selectedId) {
        showMessage('Please select a set to delete.', 'red');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/sets/${selectedId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          // Remove the deleted set from the savedSets array
          savedSets = savedSets.filter(set => set.set_id != selectedId);
          
          // Update the dropdown immediately
          const dropdown = document.getElementById('savedSetsDropdown');
          dropdown.innerHTML = '<option value="" disabled selected>Select a set</option>';
          
          savedSets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.set_id;
            option.textContent = set.set_name;
            dropdown.appendChild(option);
          });

          // Reset current set if it was the deleted one
          if (currentSet.set_id == selectedId) {
            currentSet = { set_id: null, name: '', words: [] };
          }

          showMessage('Set deleted successfully', 'green');
        } else {
          const error = await response.json();
          showMessage(error.message || 'Error deleting set', 'red');
        }
      } catch (error) {
        showMessage('Error deleting set', 'red');
      }
    });
  }

  // Initialize dashboard if on dashboard page
  if (window.location.pathname.endsWith('dashboard.html')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Load user's sets
    updateSavedSetsDropdown();
  }

  // Navigation between sections
  function resetSections() {
    document.querySelectorAll('.form-section').forEach(section => {
      section.style.display = 'none';
    });
  }

  if (document.getElementById('createSetButton')) {
    document.getElementById('createSetButton').addEventListener('click', () => {
      resetSections();
      document.getElementById('createSetSection').style.display = 'flex';
      currentSet = { set_id: null, name: '', words: [] };
    });
  }

  if (document.getElementById('selectSetButton')) {
    document.getElementById('selectSetButton').addEventListener('click', () => {
      resetSections();
      document.getElementById('selectSetSection').style.display = 'flex';
    });
  }

  if (document.getElementById('learnModeButton')) {
    document.getElementById('learnModeButton').addEventListener('click', () => {
      resetSections();
      document.getElementById('learnModeSection').style.display = 'flex';
      initializeLearnMode();
    });
  }

  // Learn Mode functionality
  function initializeLearnMode() {
    if (currentSet.words.length === 0) {
      showMessage('No words available in the selected set.', 'red');
      return;
    }
    currentIndex = 0;
    isDefinitionVisible = false;
    displayCard();
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

  if (document.getElementById('showDefinition')) {
    document.getElementById('showDefinition').addEventListener('click', () => {
      isDefinitionVisible = !isDefinitionVisible;
      displayCard();
    });
  }

  if (document.getElementById('nextCard')) {
    document.getElementById('nextCard').addEventListener('click', () => {
      if (currentSet.words.length === 0) return;
      
      currentIndex = (currentIndex + 1) % currentSet.words.length;
      isDefinitionVisible = false;
      displayCard();
    });
  }

  if (document.getElementById('previousCard')) {
    document.getElementById('previousCard').addEventListener('click', () => {
      if (currentSet.words.length === 0) return;
      
      currentIndex = (currentIndex - 1 + currentSet.words.length) % currentSet.words.length;
      isDefinitionVisible = false;
      displayCard();
    });
  }

  // Logout
  if (document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }

  // Toggle favorite
  window.toggleFavorite = async function(icon, setId) {
    if (!setId) {
      showMessage('Please save the set first', 'red');
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/favorites", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ set_id: parseInt(setId) })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update icon based on server response
        if (data.action === 'added') {
          icon.classList.add('favorited');
          icon.textContent = '🌟';
        } else {
          icon.classList.remove('favorited');
          icon.textContent = '⭐';
        }
        showMessage(data.message, 'green');
        
        // Update the set's favorite status in savedSets
        const setIndex = savedSets.findIndex(set => set.set_id == setId);
        if (setIndex !== -1) {
          savedSets[setIndex].is_favorite = data.action === 'added';
        }
      } else {
        throw new Error(data.message || 'Failed to update favorite');
      }
    } catch (error) {
      showMessage(error.message || 'Error updating favorite', 'red');
    }
  };

  // Helper function to show messages
  function showMessage(message, color = 'green') {
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.color = color;
      setTimeout(() => {
        messageContainer.textContent = '';
      }, 3000);
    }
  }
});