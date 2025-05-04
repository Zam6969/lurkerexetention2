document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('usernameInput');
  const addBtn = document.getElementById('addBtn');
  const favoritesList = document.getElementById('favoritesList');
  const body = document.body; // Get the body element

  // Add new favorite streamer
  addBtn.addEventListener('click', async () => {
    const username = input.value.trim().toLowerCase();
    if (!username) {
      console.log('No username entered');
      return;
    }

    const idUrl = `https://apiv3.fansly.com/api/v1/account?usernames=${username}&ngsw-bypass=true`;

    try {
      const res = await fetch(idUrl);
      const data = await res.json();

      if (!data.response?.length) {
        alert('User not found');
        return;
      }

      const userId = data.response[0].id;
      const entry = { username, userId };

      chrome.storage.local.get(['favorites'], (result) => {
        const favorites = result.favorites || [];
        if (!favorites.some(fav => fav.userId === userId)) {
          favorites.push(entry);
          chrome.storage.local.set({ favorites }, () => {
            addFavoriteToDOM(entry);
            input.value = '';
            console.log(`Added favorite: ${username}`);

            // Expand the body height by 100px for each streamer added
            body.style.height = `${body.offsetHeight + 100}px`;
          });
        } else {
          alert('Streamer already added.');
        }
      });
    } catch (err) {
      console.error('Error fetching user ID:', err);
      alert('Failed to fetch user ID');
    }
  });

  // Add favorite streamers to the DOM
  function addFavoriteToDOM({ username, userId }) {
    const li = document.createElement('li');
    li.textContent = username;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'X';
    delBtn.className = 'delete';
    delBtn.onclick = () => {
      chrome.storage.local.get(['favorites'], (result) => {
        let favorites = result.favorites || [];
        favorites = favorites.filter(f => f.userId !== userId);
        chrome.storage.local.set({ favorites }, () => {
          li.remove();
          console.log(`Removed favorite: ${username}`);

          // Reduce the body height by 100px for each streamer removed
          body.style.height = `${body.offsetHeight - 100}px`;
        });
      });
    };

    li.appendChild(delBtn);
    favoritesList.appendChild(li);
  }

  // Retrieve favorites from local storage and display them
  chrome.storage.local.get(['favorites'], (result) => {
    const favorites = result.favorites || [];
    favorites.forEach(addFavoriteToDOM);
  });
});
