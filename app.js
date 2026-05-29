// Grab all the player zones from the HTML
const playerZones = document.querySelectorAll('.player-zone');
// Loop through each zone one by one to set up its unique logic
playerZones.forEach(zone => {
  // Find the specific text and buttons inside THIS specific zone
  const lifeTotal = zone.querySelector('.life-total');
  const minusBtn = zone.querySelector('.minus');
  const plusBtn = zone.querySelector('.plus');
  // Set the starting life total for Commander
  let currentLife = 40;
  // Make the Minus Button work
  minusBtn.addEventListener('click', () => {
    currentLife--; // Subtract 1 from the memory
    lifeTotal.textContent = currentLife; // Update the screen
  });
  // Make the Plus Button work
  plusBtn.addEventListener('click', () => {
    currentLife++; // Add 1 to the memory
    lifeTotal.textContent = currentLife; // Update the screen
  });
});

self.addEventListener("install", (event) => {
});

self.addEventListener("fetch", (event) => {
});
