document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginSection = document.getElementById("loginSection");
  const signupSection = document.getElementById("signupSection");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupSubmit = document.getElementById("signupSubmit");
  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");
  const messageContainer = document.getElementById("messageContainer");
  let savedSets = []; // Array to store saved sets
  let currentSet = { name: '', words: [] };
  let currentIndex = 0;
  let isDefinitionVisible = false;

  // Switch to Signup Form
  if (signupLink) {
    signupLink.addEventListener("click", (e) => {
      e.preventDefault();
      signupSection.style.display = "block";
      loginSection.style.display = "none";
    });
  }
  

  // Switch to Login Form
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      signupSection.style.display = "none";
      loginSection.style.display = "block";
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
          loginSection.style.display = "block";
        } else {
          showMessage(data.error, "red");
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
          body: JSON.stringify({ email: email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          showMessage("Login successful! Redirecting...", "green");
          localStorage.setItem("user", JSON.stringify(data)); // Store user session
          setTimeout(() => {
            window.location.href = "dashboard.html"; // Redirect to dashboard
          }, 2000);
        } else {
          showMessage(data.error, "red");
        }
      } catch (error) {
        showMessage("Error logging in. Try again.", "red");
      }
    });
  }

  // Display Messages
  function showMessage(message, color) {
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.style.color = color;
    }
  }
  
  
  document.getElementById('addWord').addEventListener('click', () => {
    const word = document.getElementById('word').value.trim();
    const definition = document.getElementById('definition').value.trim();
    const setId = currentSet.id; // Ensure currentSet has a valid set_id
  
    if (word && definition) {
      // Add word to the current set UI
      currentSet.words.push({ word, definition });
      showMessage(`Word "${word}" added to the set.`);
  
      // Send the word to the backend
      fetch("http://localhost:3000/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set_id: setId, word, definition }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Word Added:", data))
        .catch((error) => console.error("Error:", error));
  
      // Clear input fields
      document.getElementById('word').value = '';
      document.getElementById('definition').value = '';
    } else {
      showMessage('Please enter both word and definition.', 'error');
    }
  });
  
    // Save the set
    /*document.getElementById('saveSet').addEventListener('click', async () => {
      const setName = document.getElementById('setName').value.trim();
  
      if (!setName) {
          showMessage('Please enter a set name.', 'error');
          return;
      }
  
      try {
          // Fetch the logged-in user's ID (Assuming it's available via session or token)
          const userResponse = await fetch('/get-user-id');
          const userData = await userResponse.json();
  
          if (!userData.id) {
              showMessage('User not logged in.', 'error');
              return;
          }
  
          // Send request to save the set in the database
          const response = await fetch('/save-set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: userData.id, set_name: setName })
          });
  
          const data = await response.json();
          showMessage(data.message);
          document.getElementById('setName').value = ''; // Clear input
  
      } catch (error) {
          console.error('Error:', error);
          showMessage('An error occurred while saving the set.', 'error');
      }
  });*/
  
  
  function createSet(userId, setName) {
      fetch("http://localhost:3000/sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId, set_name: setName }),
      })
      .then(response => response.json())
      .then(data => {
          console.log("Set Created:", data);
          showMessage(`Set "${setName}" created successfully!`);
          savedSets.push({ name: setName, words: [] }); // Add set to local storage
          updateDropdown(); // Update dropdown after creation
      })
      .catch(error => console.error("Error:", error));
  }
  // Update dropdown with saved sets
  function updateDropdown() {
    const dropdown = document.getElementById('savedSetsDropdown');
    dropdown.innerHTML = '<option value="" disabled selected>Select a set</option>'; // Clear previous options

    savedSets.forEach((set, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = set.name;
      dropdown.appendChild(option);
    });
  }
  // Show or hide sections
  function showSection(sectionId) {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section) => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'flex';
  }

  //Select a saved set
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


});
document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});
// Define function globally so it works in HTML onclick
window.toggleFavorite = function (icon, setId) {
  const isFavorited = icon.classList.contains("favorited");
  icon.classList.toggle("favorited");
  icon.textContent = isFavorited ? "⭐" : "🌟"; // Toggle star

  if (!isFavorited) {
    // Send a request to save to the database
    fetch("http://localhost:3000/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, set_id: setId }), // Make sure `userId` is available
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  }
};

