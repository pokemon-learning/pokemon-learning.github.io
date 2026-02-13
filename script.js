// Load Pokémon JSON
fetch('pokemon.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('cards-container');
    let allPokemon = data;

    // --- Create Filter Dropdowns ---
    const filtersContainer = document.createElement('div');
    filtersContainer.style.marginBottom = '20px';
    filtersContainer.style.display = 'flex';
    filtersContainer.style.justifyContent = 'center';
    filtersContainer.style.gap = '10px';
    document.body.insertBefore(filtersContainer, container);

    // Type filter
    const typeSelect = document.createElement('select');
    typeSelect.innerHTML = `<option value="">All Types</option>`;
    // Get unique types
    const typesSet = new Set();
    allPokemon.forEach(p => p.types.forEach(t => typesSet.add(t)));
    [...typesSet].sort().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
    filtersContainer.appendChild(typeSelect);

    // Generation filter
    const genSelect = document.createElement('select');
    genSelect.innerHTML = `<option value="">All Generations</option>`;
    // Get unique generations
    const gensSet = new Set(allPokemon.map(p => p.generation));
    [...gensSet].sort((a,b) => a-b).forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = `Generation ${g}`;
      genSelect.appendChild(opt);
    });
    filtersContainer.appendChild(genSelect);

    // --- Display Cards Function ---
    function displayCards(pokemonList) {
      container.innerHTML = '';
      pokemonList.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-inner">
            <div class="card-front">
              <img src="${p.image}" alt="${p.name}">
              <h3>${p.name}</h3>
            </div>
            <div class="card-back">
              <p><strong>Type:</strong> ${p.types.join(', ')}</p>
              <p><strong>Generation:</strong> ${p.generation}</p>
              <p><strong>#${p.number}</strong></p>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }

    displayCards(allPokemon);

    // --- Filter Function ---
    function filterPokemon() {
      const query = searchInput.value.toLowerCase();
      const selectedType = typeSelect.value;
      const selectedGen = genSelect.value;

      const filtered = allPokemon.filter(p => {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesType = selectedType === "" || p.types.includes(selectedType);
        const matchesGen = selectedGen === "" || p.generation == selectedGen;
        return matchesName && matchesType && matchesGen;
      });

      displayCards(filtered);
    }

    // --- Search & Filter Event Listeners ---
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', filterPokemon);
    typeSelect.addEventListener('change', filterPokemon);
    genSelect.addEventListener('change', filterPokemon);
  });
