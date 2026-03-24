// --- 1. CONFIG & STATE ---
const API_URL = 'https://pokeapi.co/api/v2/pokemon/';
let myPokemon = []; 

// --- 2. SELECTORS ---
const pokemonGrid = document.querySelector('#pokemon-grid');
const summonBtn = document.querySelector('#summon-btn');
const battleBtn = document.querySelector('#battle-btn');
const template = document.querySelector('#pokemon-template');
const emptyMsg = document.querySelector('#empty-msg');
const searchBar = document.querySelector('#search-bar');

// --- 3. THE "SUMMONER" (ASYNC FETCH) ---
async function summonPokemon() {
    summonBtn.textContent = "Summoning...";
    summonBtn.disabled = true;

    try {
        // Generate a random ID between 1 and 151 (Original Gen)
        const randomId = Math.floor(Math.random() * 151) + 1;
        const response = await fetch(`${API_URL}${randomId}`);
        const data = await response.json();

        const newPokemon = {
            id: Date.now(), 
            name: data.name.toUpperCase(),
            type: data.types[0].type.name,
            hp: data.stats[0].base_stat,
            maxHp: data.stats[0].base_stat,
            image: data.sprites.front_default,
            level: 1
        };

        myPokemon.push(newPokemon);
        saveToStorage();
        renderPokemon(newPokemon);
        updateUIState();

    } catch (error) {
        console.error("The portal failed!", error);
    } finally {
        summonBtn.textContent = "Summon New Pokémon";
        summonBtn.disabled = false;
    }
}

// --- 4. RENDERING (TEMPLATES) ---
function renderPokemon(pokemon) {
    const clone = template.content.cloneNode(true);
    
    const card = clone.querySelector('.pokemon-card');
    card.setAttribute('data-id', pokemon.id);

    clone.querySelector('.pokemon-name').textContent = pokemon.name;
    clone.querySelector('.pokemon-type').textContent = `Type: ${pokemon.type}`;
    clone.querySelector('.pokemon-img').src = pokemon.image;
    clone.querySelector('.level-badge').textContent = `Lvl ${pokemon.level}`;
    
    const hpBar = clone.querySelector('.hp-bar');
    hpBar.value = pokemon.hp;
    hpBar.max = pokemon.maxHp;

    pokemonGrid.appendChild(clone);
}

function renderAll() {
    pokemonGrid.innerHTML = '';
    myPokemon.forEach(p => renderPokemon(p));
}

// --- 5. INTERACTION (EVENT DELEGATION) ---
pokemonGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.pokemon-card');
    if (!card) return;
    
    const pokemonId = parseInt(card.getAttribute('data-id'));
    const pokemonIdx = myPokemon.findIndex(m => m.id === pokemonId);

    const actionBtn = e.target.closest('.action-btn');
    if (actionBtn) {
    
        if (actionBtn.classList.contains('banish')) {
            card.remove(); 
            myPokemon.splice(pokemonIdx, 1); 
            saveToStorage();
            updateUIState();
            return;
        }

        if (actionBtn.classList.contains('level-up')) {
            myPokemon[pokemonIdx].level++;
            card.querySelector('.level-badge').textContent = `Lvl ${myPokemon[pokemonIdx].level}`;
            card.style.transform = "scale(1.05)";
            setTimeout(() => card.style.transform = "scale(1)", 200);
            saveToStorage();
            return;
        }

     
        if (actionBtn.classList.contains('rename')) {
            const newName = prompt("Enter new name for your Pokémon:");
            if (newName) {
                myPokemon[pokemonIdx].name = newName.toUpperCase();
                card.querySelector('.pokemon-name').textContent = newName.toUpperCase();
                saveToStorage();
            }
            return;
        }
    }

    card.classList.toggle('selected');
    updateUIState();
});

function updateUIState() {
    emptyMsg.style.display = myPokemon.length > 0 ? 'none' : 'block';

    const selected = document.querySelectorAll('.pokemon-card.selected');
    battleBtn.disabled = selected.length !== 2;
}

// --- 6. SEARCH (FILTER ARRAY) ---
searchBar.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.pokemon-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.pokemon-name').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'flex' : 'none';
    });
});

summonBtn.addEventListener('click', summonPokemon);

function saveToStorage() {
    try {
        localStorage.setItem('myPokemon', JSON.stringify(myPokemon));
    } catch (e) {
        console.warn('Could not save to localStorage', e);
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem('myPokemon');
        if (raw) {
            myPokemon = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Could not load from localStorage', e);
        myPokemon = [];
    }
}

// --- Battle system ---
const arena = document.querySelector('#battle-arena');
const player1El = document.querySelector('#player-1');
const player2El = document.querySelector('#player-2');
const combatLog = document.querySelector('#combat-log');
const closeArenaBtn = document.querySelector('#close-arena');

function startBattle() {
    const selectedCards = document.querySelectorAll('.pokemon-card.selected');
    if (selectedCards.length !== 2) return;

    const p1Id = parseInt(selectedCards[0].getAttribute('data-id'));
    const p2Id = parseInt(selectedCards[1].getAttribute('data-id'));
    const p1 = JSON.parse(JSON.stringify(myPokemon.find(p => p.id === p1Id))); 
    const p2 = JSON.parse(JSON.stringify(myPokemon.find(p => p.id === p2Id)));

    arena.classList.remove('hidden');
    combatLog.innerHTML = '<p>Battle start!</p>';
    renderArenaPlayer(player1El, p1);
    renderArenaPlayer(player2El, p2);

    let attacker = 1;
    const interval = setInterval(() => {
        const attackerP = attacker === 1 ? p1 : p2;
        const defenderP = attacker === 1 ? p2 : p1;
        const damage = Math.floor(Math.random() * 12) + 5; 
        defenderP.hp = Math.max(0, defenderP.hp - damage);

        combatLog.insertAdjacentHTML('beforeend', `<p>${attackerP.name} hits ${defenderP.name} for ${damage} damage!</p>`);
        renderArenaPlayer(player1El, p1);
        renderArenaPlayer(player2El, p2);
        combatLog.scrollTop = combatLog.scrollHeight;

        if (defenderP.hp <= 0) {
            clearInterval(interval);
            const winner = attacker === 1 ? p1 : p2;
            const loser = attacker === 1 ? p2 : p1;
            combatLog.insertAdjacentHTML('beforeend', `<p><strong>${winner.name} wins!</strong></p>`);

            const winnerIdx = myPokemon.findIndex(x => x.id === winner.id);
            const loserIdx = myPokemon.findIndex(x => x.id === loser.id);
            if (winnerIdx > -1) {
                myPokemon[winnerIdx].level = (myPokemon[winnerIdx].level || 1) + 1;
                myPokemon[winnerIdx].hp = Math.min(myPokemon[winnerIdx].maxHp, Math.max(1, winner.hp));
            }
            if (loserIdx > -1) {
                myPokemon[loserIdx].hp = Math.max(1, loser.hp);
            }

            saveToStorage();
            setTimeout(() => {
                arena.classList.add('hidden');
                document.querySelectorAll('.pokemon-card.selected').forEach(c => c.classList.remove('selected'));
                renderAll();
                updateUIState();
            }, 1500);
        }

        attacker = attacker === 1 ? 2 : 1;
    }, 800);
}

function renderArenaPlayer(container, p) {
    container.innerHTML = `
        <div class="arena-card">
            <img src="${p.image}" alt="${p.name}" class="arena-img">
            <div class="arena-info">
                <h4>${p.name}</h4>
                <p>Lvl ${p.level} • ${p.type}</p>
                <progress class="hp-bar" value="${p.hp}" max="${p.maxHp}"></progress>
            </div>
        </div>`;
}

closeArenaBtn.addEventListener('click', () => {
    arena.classList.add('hidden');
    document.querySelectorAll('.pokemon-card.selected').forEach(c => c.classList.remove('selected'));
    updateUIState();
});

battleBtn.addEventListener('click', startBattle);

loadFromStorage();
renderAll();
updateUIState();