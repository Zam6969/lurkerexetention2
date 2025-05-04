async function checkFavoritesForLiveStatus() {
  chrome.storage.local.get(['favorites', 'liveStates', 'openTabs'], async (result) => {
    const favorites = result.favorites || [];
    const liveStates = result.liveStates || {};
    const openTabs = result.openTabs || {};

    const updatedLiveStates = { ...liveStates };
    const updatedOpenTabs = { ...openTabs };

    for (const fav of favorites) {
      const userId = fav.userId;
      const username = fav.username;
      const url = `https://apiv3.fansly.com/api/v1/streaming/channel/${userId}?ngsw-bypass=true`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const streamStatus = data?.response?.stream?.status;

        const wasLive = liveStates[userId] === true;
        const isLive = streamStatus === 2;

        if (isLive && !wasLive) {
          const liveUrl = `https://fansly.com/live/${username}`;

          // Open tab if not already open
          if (!openTabs[userId]) {
            chrome.tabs.create({ url: liveUrl, active: false }, (newTab) => {
              chrome.tabs.update(newTab.id, { muted: true });
              updatedOpenTabs[userId] = newTab.id;
              chrome.storage.local.set({ openTabs: updatedOpenTabs });
            });
          }

          // Only notify if they weren't marked live yet
          chrome.notifications.create(`live_${userId}`, {
            type: 'basic',
            iconUrl: 'icons/icon.png',
            title: `${username} is live!`,
            message: `Click to watch their stream.`,
            priority: 2
          });

          updatedLiveStates[userId] = true;

        } else if (!isLive && wasLive) {
          updatedLiveStates[userId] = false;

          // Close tab if still open
          if (openTabs[userId]) {
            chrome.tabs.remove(openTabs[userId]);
            delete updatedOpenTabs[userId];
          }
        }

      } catch (err) {
        console.error(`Error checking status for ${username}:`, err);
      }
    }

    // Store updated states only once
    chrome.storage.local.set({
      liveStates: updatedLiveStates,
      openTabs: updatedOpenTabs
    });
  });
}

// Run initially
checkFavoritesForLiveStatus();

// Repeat every 2 minutes
setInterval(checkFavoritesForLiveStatus, 2 * 60 * 1000);
