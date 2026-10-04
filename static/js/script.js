
let tracks = [
    {
        title: "Loading...",
        artist: "Please wait...",
        src: "",
        cover: "cover-one"
    }
];

function decryptJioSaavnUrl(encUrl) {
    if (!encUrl) return "";
    try {
        const key = CryptoJS.enc.Utf8.parse("38346591");
        const decrypted = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(encUrl) }, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        let result = decrypted.toString(CryptoJS.enc.Utf8);
        return result.replace("http://", "https://").replace("_96.mp4", "_320.mp4").replace("_96.mp3", "_320.mp3").replace("_160.mp4", "_320.mp4");
    } catch (e) { return ""; }
}

async function fetchSongsFromServer(searchQuery = "bollywood", showSearchResults = false) {
    try {
        const res = await fetch("/api/songs?q=" + encodeURIComponent(searchQuery));
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            tracks = data.results.map((item) => {
                let artists = "Unknown Artist";
                if (item.more_info && item.more_info.artistMap && item.more_info.artistMap.primary_artists && item.more_info.artistMap.primary_artists.length > 0) {
                    artists = item.more_info.artistMap.primary_artists.map(a => a.name).join(", ");
                }
                let songUrl = "";
                if (item.more_info && item.more_info.encrypted_media_url) {
                    songUrl = decryptJioSaavnUrl(item.more_info.encrypted_media_url);
                }

                let cleanTitle = item.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

                return {
                    title: cleanTitle,
                    artist: artists,
                    src: songUrl,
                    image: item.image ? item.image.replace("150x150", "500x500") : ""
                };
            });
            // SHOW SEARCH RECOMMENDATIONS
            if (showSearchResults) {
                const dropdown = document.getElementById("searchResultsDropdown");

                if (dropdown) {
                    dropdown.innerHTML = "";

                    if (tracks.length === 0) {
                        dropdown.innerHTML = `
                <div style="padding:15px;color:#aaa;">
                    No songs found
                </div>
            `;
                    } else {
                        tracks.slice(0, 8).forEach((track, index) => {
                            const item = document.createElement("div");

                            item.className = "search-result-item";
                            item.style.cssText = `
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:10px 14px;
                    cursor:pointer;
                    color:white;
                `;

                            item.innerHTML = `
                    <img src="${track.image || ''}"
                         style="width:42px;height:42px;object-fit:cover;border-radius:6px;background:#333;">

                    <div>
                        <div style="font-size:14px;font-weight:600;">
                            ${track.title}
                        </div>
                        <div style="font-size:12px;color:#aaa;">
                            ${track.artist}
                        </div>
                    </div>
                `;

                            item.addEventListener("click", () => {
                                loadTrack(index);
                                playTrack();
                                dropdown.style.display = "none";
                                searchInput.value = track.title;
                                addSearchHistory(track.title);
                            });

                            dropdown.appendChild(item);
                        });
                    }

                    dropdown.style.display = "block";
                }
            }

            const trendingGrid = document.querySelector("#trending .track-grid");
            if (trendingGrid) {
                trendingGrid.innerHTML = "";

                tracks.forEach((track, i) => {
                    const bgStyle = track.image ? 'style="background-image: url(\'' + track.image + '\'); background-size: cover; background-position: center;"' : "";
                    const cardHTML =
                        '<article class="track-card">' +
                        '<div class="track-cover" ' + bgStyle + '>' +
                        '<button class="cover-play dynamic-play" data-index="' + i + '" aria-label="Play">▶</button>' +
                        '<button class="favorite-btn" aria-label="Add to favorites">♡</button>' +
                        '<button class="add-queue-btn" aria-label="Add to queue">+</button>' +
                        '</div>' +
                        '<div class="track-details">' +
                        '<div>' +
                        '<h3>' + track.title + '</h3>' +
                        '<p>' + track.artist + '</p>' +
                        '</div>' +
                        '</div>' +
                        '</article>';
                    trendingGrid.insertAdjacentHTML("beforeend", cardHTML);
                });

                const dynamicPlayButtons = trendingGrid.querySelectorAll(".dynamic-play");
                dynamicPlayButtons.forEach(button => {
                    button.addEventListener("click", (e) => {
                        const idx = parseInt(e.target.getAttribute("data-index"));
                        loadTrack(idx);
                        playTrack();
                    });
                });

                document.querySelectorAll(".add-queue-btn").forEach((button, index) => {

                    button.addEventListener("click", (event) => {

                        event.stopPropagation();

                        const track = tracks[index];

                        if (!track) {
                            return;
                        }

                        addToQueue(track);

                        button.textContent = "✓";

                        setTimeout(() => {
                            button.textContent = "+";
                        }, 1000);
                    });

                });

                const dynamicFavBtns = trendingGrid.querySelectorAll(".favorite-btn");
                dynamicFavBtns.forEach(button => {
                    const songCard = button.closest(".track-card");
                    const songTitle = songCard.querySelector("h3").textContent.trim();
                    if (typeof updateCardHeart === "function") updateCardHeart(button, songTitle);

                    button.addEventListener("click", (event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        let favorites = getFavorites();
                        if (favorites.includes(songTitle)) {
                            favorites = favorites.filter(song => song !== songTitle);
                        } else {
                            favorites.push(songTitle);
                        }
                        saveFavorites(favorites);
                        if (typeof updateAllCardHearts === "function") updateAllCardHearts();
                        if (typeof updatePlayerLikeButton === "function") updatePlayerLikeButton();
                        if (typeof renderFavorites === "function") renderFavorites();
                    });
                });
            }

            if (currentTrackIndex === 0) { loadTrack(0); } if (typeof renderRecentlyPlayed === "function") renderRecentlyPlayed(); if (typeof renderFavorites === "function") renderFavorites();
        }
    } catch (err) {
        console.error("Error fetching songs:", err);
    }
}



fetchSongsFromServer();

const audio = new Audio();

let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

const mainPlayButton = document.querySelector(".main-play");
const playerTitle = document.querySelector(".player-track strong");
const playerArtist = document.querySelector(".player-track small");
const progressTrack = document.querySelector(".progress-track");
const progressFill = document.querySelector(".progress-fill");
const volumeTrack = document.querySelector(".volume-track");
const volumeFill = document.querySelector(".volume-fill");
const likeButton = document.querySelector(".like-button");
const musicPlayer = document.querySelector(".music-player");

const timeLabels = document.querySelectorAll(".progress-container span");

const previousButton = document.querySelector(
    '[aria-label="Previous"]'
);

const nextButton = document.querySelector(
    '[aria-label="Next"]'
);

const shuffleButton = document.querySelector(
    '[aria-label="Shuffle"]'
);

const repeatButton = document.querySelector(
    '[aria-label="Repeat"]'
);

const coverPlayButtons = document.querySelectorAll(".cover-play");


// FORMAT TIME

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


// UPDATE PLAYER DISPLAY

function updatePlayerDisplay() {
    const track = tracks[currentTrackIndex];

    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;

    const miniCover = document.querySelector(".mini-cover");
    miniCover.className = "mini-cover"; // reset class
    if (track.image) {
        miniCover.style.backgroundImage = `url('${track.image}')`;
        miniCover.style.backgroundSize = "cover";
        miniCover.style.backgroundPosition = "center";
        miniCover.innerHTML = ""; // clear any inner shapes
    }

    updatePlayerLikeButton();
}


// UPDATE PLAY BUTTON

function updatePlayButton() {
    mainPlayButton.textContent = isPlaying ? "Ⅱ" : "▶";

    document.body.classList.toggle(
        "music-playing",
        isPlaying
    );
}


// LOAD TRACK

function loadTrack(index) {
    currentTrackIndex = index;

    const track = tracks[currentTrackIndex];

    audio.src = track.src;
    audio.load();

    updatePlayerDisplay();

    progressFill.style.width = "0%";

    if (timeLabels.length >= 2) {
        timeLabels[0].textContent = "0:00";
        timeLabels[1].textContent = "0:00";
    }
}


// PLAY TRACK

async function playTrack() {
    try {
        await audio.play();

        isPlaying = true;
        updatePlayButton();

        addRecentlyPlayed();

    } catch (error) {
        isPlaying = false;
        updatePlayButton();

        console.error("Unable to play audio:", error);

        alert(
            "Song play nahi ho raha. MP3 file ka naam aur path check karo."
        );
    }
}


// PAUSE TRACK

function pauseTrack() {
    audio.pause();

    isPlaying = false;

    updatePlayButton();
}


// PLAY / PAUSE

mainPlayButton.addEventListener("click", () => {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
});


// NEXT TRACK

function nextTrack() {
    if (isShuffle && tracks.length > 1) {
        let randomIndex;

        do {
            randomIndex = Math.floor(
                Math.random() * tracks.length
            );
        } while (randomIndex === currentTrackIndex);

        currentTrackIndex = randomIndex;

    } else {
        currentTrackIndex =
            (currentTrackIndex + 1) % tracks.length;
    }

    loadTrack(currentTrackIndex);
    playTrack();
}


// PREVIOUS TRACK

function previousTrack() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    currentTrackIndex =
        (currentTrackIndex - 1 + tracks.length) %
        tracks.length;

    loadTrack(currentTrackIndex);
    playTrack();
}


nextButton.addEventListener("click", nextTrack);

previousButton.addEventListener("click", previousTrack);


// TRACK CARD SELECTION

coverPlayButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        loadTrack(index);
        playTrack();
    });
});


// PROGRESS UPDATE

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const percentage =
        (audio.currentTime / audio.duration) * 100;

    progressFill.style.width = `${percentage}%`;

    if (timeLabels.length >= 2) {
        timeLabels[0].textContent =
            formatTime(audio.currentTime);

        timeLabels[1].textContent =
            formatTime(audio.duration);
    }
});


// SEEK TRACK

progressTrack.addEventListener("click", (event) => {
    if (!audio.duration) return;

    const rect = progressTrack.getBoundingClientRect();

    const position = event.clientX - rect.left;

    const percentage = Math.max(
        0,
        Math.min(1, position / rect.width)
    );

    audio.currentTime = percentage * audio.duration;
});


// VOLUME CONTROL

audio.volume = 0.7;

volumeFill.style.width = "70%";

volumeTrack.addEventListener("click", (event) => {
    const rect = volumeTrack.getBoundingClientRect();

    const position = event.clientX - rect.left;

    const percentage = Math.max(
        0,
        Math.min(1, position / rect.width)
    );

    audio.volume = percentage;

    volumeFill.style.width = `${percentage * 100}%`;
});


// SHUFFLE

shuffleButton.addEventListener("click", () => {
    isShuffle = !isShuffle;

    shuffleButton.classList.toggle("control-active", isShuffle);
});


// REPEAT

repeatButton.addEventListener("click", () => {
    isRepeat = !isRepeat;

    audio.loop = isRepeat;

    repeatButton.classList.toggle("control-active", isRepeat);
});


// AUTOMATIC NEXT TRACK + SMART QUEUE

audio.addEventListener("ended", () => {

    if (isRepeat) {
        return;
    }

    if (musicQueue.length > 0) {

        const nextQueuedTrack = musicQueue.shift();

        renderQueue();

        const queueIndex = tracks.findIndex(
            track => track.src === nextQueuedTrack.src
        );

        if (queueIndex !== -1) {

            loadTrack(queueIndex);
            playTrack();

        } else {

            audio.src = nextQueuedTrack.src;

            document.querySelector(".player-track strong").textContent =
                nextQueuedTrack.title;

            document.querySelector(".player-track small").textContent =
                nextQueuedTrack.artist;

            audio.play();

        }

        return;
    }

    nextTrack();

});

// LIKE BUTTON

// LIKE BUTTON WITH LOCAL STORAGE

function getFavorites() {
    return JSON.parse(
        localStorage.getItem("beatnovaFavorites") || "[]"
    );
}

function saveFavorites(favorites) {
    localStorage.setItem(
        "beatnovaFavorites",
        JSON.stringify(favorites)
    );
}

function updatePlayerLikeButton() {
    const currentTitle = tracks[currentTrackIndex].title;
    const favorites = getFavorites();

    const isLiked = favorites.includes(currentTitle);

    likeButton.classList.toggle("liked", isLiked);
    likeButton.textContent = isLiked ? "♥" : "♡";
}

likeButton.addEventListener("click", () => {
    const currentTitle = tracks[currentTrackIndex].title;

    let favorites = getFavorites();

    if (favorites.includes(currentTitle)) {
        favorites = favorites.filter(
            song => song !== currentTitle
        );
    } else {
        favorites.push(currentTitle);
    }

    saveFavorites(favorites);

    updateAllCardHearts();

    updatePlayerLikeButton();

    renderFavorites();
});


// NAVBAR SCROLL EFFECT

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
    navbar.classList.toggle(
        "navbar-scrolled",
        window.scrollY > 40
    );
});


// SCROLL REVEAL

const revealElements = document.querySelectorAll(
    ".content-section, .sponsored-section, .premium-section"
);

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");

                revealObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12
    }
);

revealElements.forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
});


// NAVIGATION ACTIVE STATE

const navLinks = document.querySelectorAll(".nav-links a");

const sections = document.querySelectorAll("main section[id]");

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.id;

                navLinks.forEach((link) => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === `#${id}`
                    );
                });
            }
        });
    },
    {
        rootMargin: "-30% 0px -60% 0px"
    }
);

sections.forEach((section) => {
    sectionObserver.observe(section);
});


// SEARCH / LOGIN PREVIEW







// INITIALIZE

loadTrack(0);
updatePlayButton();


const searchInput = document.getElementById("searchInput");

const trackCards = document.querySelectorAll(".track-card");


// =============================
// SEARCH HISTORY
// =============================

const searchDropdown = document.getElementById("searchResultsDropdown");

function getSearchHistory() {
    return JSON.parse(localStorage.getItem("beatnovaSearchHistory") || "[]");
}

function saveSearchHistory(history) {
    localStorage.setItem("beatnovaSearchHistory", JSON.stringify(history));
}

function renderSearchHistory() {
    if (!searchDropdown) return;

    const history = getSearchHistory();

    searchDropdown.innerHTML = "";

    if (history.length === 0) {
        searchDropdown.innerHTML = `
            <div style="padding: 16px; color: #aaa; font-size: 13px;">
                No recent searches
            </div>
        `;
        searchDropdown.style.display = "block";
        return;
    }

    const header = document.createElement("div");
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        color: #aaa;
        font-size: 12px;
        border-bottom: 1px solid #333;
    `;

    header.innerHTML = `
        <span>RECENT SEARCHES</span>
        <button id="clearSearchHistory" style="
            background: none;
            border: none;
            color: #a78bfa;
            cursor: pointer;
            font-size: 12px;
        ">Clear all</button>
    `;

    searchDropdown.appendChild(header);

    history.forEach(query => {
        const item = document.createElement("div");

        item.className = "search-result-item";
        item.style.cssText = `
            padding: 12px 14px;
            color: #eee;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const icon = document.createElement("span");
        icon.textContent = "◷";

        const text = document.createElement("span");
        text.textContent = query;

        item.appendChild(icon);
        item.appendChild(text);

        item.addEventListener("click", () => {
            searchInput.value = query;
            searchDropdown.style.display = "none";
            searchInput.dispatchEvent(new Event("input"));
        });

        searchDropdown.appendChild(item);
    });

    document.getElementById("clearSearchHistory").addEventListener("click", (event) => {
        event.stopPropagation();
        localStorage.removeItem("beatnovaSearchHistory");
        renderSearchHistory();
    });

    searchDropdown.style.display = "block";
}

function addSearchHistory(query) {
    const cleanQuery = query.trim();

    if (!cleanQuery) return;

    let history = getSearchHistory();

    history = history.filter(
        item => item.toLowerCase() !== cleanQuery.toLowerCase()
    );

    history.unshift(cleanQuery);

    history = history.slice(0, 8);

    saveSearchHistory(history);
}

if (searchInput) {
    let searchTimeout;

    // SEARCH SONGS WHILE TYPING
    searchInput.addEventListener("input", () => {
        const searchValue = searchInput.value.trim();

        clearTimeout(searchTimeout);

        if (searchValue.length === 0) {
            renderSearchHistory();
            return;
        }

        searchTimeout = setTimeout(() => {
            fetchSongsFromServer(searchValue, true);
        }, 400);
    });
    searchInput.addEventListener("focus", () => {
        if (!searchInput.value.trim()) {
            renderSearchHistory();
        }
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            const query = searchInput.value.trim();

            if (query) {
                addSearchHistory(query);
                searchDropdown.style.display = "none";
            }
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) {
            const dropdown = document.getElementById("searchResultsDropdown");
            if (dropdown) dropdown.style.display = "none";
        }
    });
}



// FAVORITE SONG CARDS

const favoriteButtons = document.querySelectorAll(".favorite-btn");


// FAVORITES COLLECTION

const favoritesGrid = document.getElementById("favoritesGrid");
const emptyFavorites = document.getElementById("emptyFavorites");


// RENDER FAVORITES

function renderFavorites() {

    if (!favoritesGrid || !emptyFavorites) return;

    const favorites = getFavorites();

    favoritesGrid.innerHTML = "";

    const favoriteTracks = tracks.filter(track =>
        favorites.includes(track.title)
    );

    if (favoriteTracks.length === 0) {
        emptyFavorites.style.display = "block";
        return;
    }

    emptyFavorites.style.display = "none";

    favoriteTracks.forEach(track => {

        const index = tracks.indexOf(track);

        const card = document.createElement("article");

        card.className = "track-card favorite-card";

        card.innerHTML = `
    <div class="track-cover" ${track.image ? `style="background-image: url('${track.image}'); background-size: cover; background-position: center;"` : ""}>
        <button class="cover-play favorite-play">
            ▶ Play
        </button>
    </div>

    <button class="favorite-remove" title="Remove from favorites">
        ♥
    </button>

    <div class="track-details">
        <h3>${track.title}</h3>
        <p>${track.artist}</p>
    </div>
`;

        card.querySelector(".favorite-play").addEventListener(
            "click",
            () => {
                loadTrack(index);
                playTrack();
            }
        );
        // REMOVE SONG FROM FAVORITES

        card.querySelector(".favorite-remove").addEventListener("click", () => {

            let favorites = getFavorites();

            favorites = favorites.filter(
                song => song !== track.title
            );

            saveFavorites(favorites);

            updateAllCardHearts();

            updatePlayerLikeButton();

            renderFavorites();

        });

        favoritesGrid.appendChild(card);

    });
}




// UPDATE HEART BUTTON

function updateCardHeart(button, songTitle) {

    const favorites = getFavorites();

    const isLiked = favorites.includes(songTitle);

    button.classList.toggle("active", isLiked);

    button.textContent = isLiked ? "♥" : "♡";
}

// UPDATE ALL SONG CARD HEARTS

function updateAllCardHearts() {
    const allFavBtns = document.querySelectorAll(".favorite-btn"); allFavBtns.forEach((button) => {

        const songCard = button.closest(".track-card");

        const songTitle = songCard.querySelector("h3")
            .textContent.trim();

        updateCardHeart(button, songTitle);

    });

}



// INITIALIZE FAVORITE BUTTONS

favoriteButtons.forEach((button) => {

    const songCard = button.closest(".track-card");

    const songTitle = songCard.querySelector("h3")
        .textContent.trim();

    // Page load par heart update karo
    updateCardHeart(button, songTitle);

    // Heart click event
    button.addEventListener("click", (event) => {

        event.preventDefault();

        let favorites = getFavorites();

        if (favorites.includes(songTitle)) {

            favorites = favorites.filter(
                song => song !== songTitle
            );

        } else {

            favorites.push(songTitle);

        }


        // Save favorites
        saveFavorites(favorites);

        // Update heart
        updateCardHeart(button, songTitle);

        // Update player heart
        updatePlayerLikeButton();

        // Update favorites section
        renderFavorites();

    });

});


// PAGE LOAD

renderFavorites();

// RECENTLY PLAYED

const recentlyPlayedGrid = document.getElementById("recentlyPlayedGrid");
const emptyRecentlyPlayed = document.getElementById("emptyRecentlyPlayed");

// GET RECENTLY PLAYED SONGS

function getRecentlyPlayed() {
    return JSON.parse(
        localStorage.getItem("beatnovaRecentlyPlayed") || "[]"
    );
}

// SAVE RECENTLY PLAYED SONGS

function saveRecentlyPlayed(songs) {
    localStorage.setItem(
        "beatnovaRecentlyPlayed",
        JSON.stringify(songs)
    );
}

// ADD SONG TO RECENTLY PLAYED

function addRecentlyPlayed() {
    const currentTrack = tracks[currentTrackIndex];

    let recentlyPlayed = getRecentlyPlayed();

    // Remove duplicate song
    recentlyPlayed = recentlyPlayed.filter(
        title => title !== currentTrack.title
    );

    // Add current song at the beginning
    recentlyPlayed.unshift(currentTrack.title);

    // Keep only the latest 10 songs
    recentlyPlayed = recentlyPlayed.slice(0, 10);

    saveRecentlyPlayed(recentlyPlayed);

    renderRecentlyPlayed();
}

// DISPLAY RECENTLY PLAYED SONGS

function renderRecentlyPlayed() {

    if (!recentlyPlayedGrid || !emptyRecentlyPlayed) return;

    const recentlyPlayed = getRecentlyPlayed();

    recentlyPlayedGrid.innerHTML = "";

    const recentTracks = recentlyPlayed
        .map(title => tracks.find(track => track.title === title))
        .filter(track => track !== undefined);

    if (recentTracks.length === 0) {
        emptyRecentlyPlayed.style.display = "block";
        return;
    }

    emptyRecentlyPlayed.style.display = "none";

    recentTracks.forEach(track => {

        const index = tracks.indexOf(track);

        const card = document.createElement("article");

        card.className = "track-card recent-card";

        card.innerHTML = `
            <div class="track-cover" ${track.image ? `style="background-image: url('${track.image}'); background-size: cover; background-position: center;"` : ""}>
                <button class="cover-play recent-play">
                    ▶ Play
                </button>
            </div>

            <div class="track-details">
                <h3>${track.title}</h3>
                <p>${track.artist}</p>
            </div>
        `;

        card.querySelector(".recent-play").addEventListener(
            "click",
            () => {
                loadTrack(index);
                playTrack();
            }
        );

        // CLEAR LISTENING HISTORY

        const clearHistoryBtn = document.getElementById("clearHistoryBtn");

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener("click", () => {

                const confirmClear = confirm(
                    "Are you sure you want to clear your listening history?"
                );

                if (confirmClear) {
                    saveRecentlyPlayed([]);
                    renderRecentlyPlayed();
                }

            });
        }

        recentlyPlayedGrid.appendChild(card);

    });
}

// SHOW SAVED HISTORY WHEN PAGE LOADS

renderRecentlyPlayed();


// =============================
// CUSTOM PLAYLISTS
// =============================

const playlistNameInput = document.getElementById("playlistNameInput");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const playlistGrid = document.getElementById("playlistGrid");
const emptyPlaylists = document.getElementById("emptyPlaylists");
// =============================
// PREMIUM DELETE PLAYLIST MODAL
// =============================

const deletePlaylistModal =
    document.getElementById("deletePlaylistModal");

const deletePlaylistMessage =
    document.getElementById("deletePlaylistMessage");

const cancelDeletePlaylist =
    document.getElementById("cancelDeletePlaylist");

const confirmDeletePlaylist =
    document.getElementById("confirmDeletePlaylist");

let playlistToDeleteId = null;


// OPEN DELETE MODAL

function openDeletePlaylistModal(playlist) {

    playlistToDeleteId = playlist.id;

    deletePlaylistMessage.textContent =
        `Are you sure you want to delete "${playlist.name}"?`;

    deletePlaylistModal.showModal();
}


// CANCEL DELETE

cancelDeletePlaylist.addEventListener("click", () => {

    playlistToDeleteId = null;

    deletePlaylistModal.close();

});


// CONFIRM DELETE

confirmDeletePlaylist.addEventListener("click", () => {

    if (playlistToDeleteId === null) {
        return;
    }

    const updatedPlaylists = getPlaylists().filter(
        playlist => playlist.id !== playlistToDeleteId
    );

    savePlaylists(updatedPlaylists);

    playlistToDeleteId = null;

    deletePlaylistModal.close();

    renderPlaylists();

});


// RESET WHEN MODAL CLOSES

deletePlaylistModal.addEventListener("close", () => {

    playlistToDeleteId = null;

});

// GET SAVED PLAYLISTS

function getPlaylists() {
    return JSON.parse(
        localStorage.getItem("beatnovaPlaylists") || "[]"
    );
}

// SAVE PLAYLISTS

function savePlaylists(playlists) {
    localStorage.setItem(
        "beatnovaPlaylists",
        JSON.stringify(playlists)
    );
}


// DISPLAY PLAYLISTS

function renderPlaylists() {
    if (!playlistGrid || !emptyPlaylists) return;

    const playlists = getPlaylists();

    playlistGrid.innerHTML = "";

    if (playlists.length === 0) {
        emptyPlaylists.style.display = "block";
        return;
    }

    emptyPlaylists.style.display = "none";

    playlists.forEach((playlist) => {
        const card = document.createElement("article");

        card.className = "playlist-card";

        card.innerHTML = `
            <div class="playlist-icon">♫</div>

            <h3>${playlist.name}</h3>

            <p>${playlist.songs.length} songs</p>

            <div class="playlist-songs">
                ${playlist.songs.map(title => `
                  <div class="playlist-song">
    <span>${title}</span>

    <div class="playlist-song-actions">
        <button class="playlist-play" data-title="${title}">
            ▶
        </button>

        <button class="remove-song-btn" data-title="${title}">
            ✕
        </button>
    </div>
</div>
                `).join("")}
            </div>

            <div class="playlist-actions">
    <button class="add-song-btn">
        + Add Song
    </button>

    <button class="delete-playlist-btn">
        Delete Playlist
    </button>
</div>
        `;

        // ADD SONG BUTTON
        card.querySelector(".add-song-btn").addEventListener("click", () => {
            addSongToPlaylist(playlist.id);
        });

        // PLAY SONG BUTTONS
        card.querySelectorAll(".playlist-play").forEach(button => {
            button.addEventListener("click", () => {
                const title = button.dataset.title;

                const index = tracks.findIndex(
                    track => track.title === title
                );

                if (index !== -1) {
                    loadTrack(index);
                    playTrack();
                }
            });
        });
        // REMOVE SONG FROM PLAYLIST

        card.querySelectorAll(".remove-song-btn").forEach(button => {

            button.addEventListener("click", () => {

                const title = button.dataset.title;

                playlist.songs = playlist.songs.filter(
                    song => song !== title
                );

                savePlaylists(playlists);

                renderPlaylists();

            });

        });


        // DELETE COMPLETE PLAYLIST

        // DELETE COMPLETE PLAYLIST

        card.querySelector(".delete-playlist-btn").addEventListener("click", () => {

            openDeletePlaylistModal(playlist);

        });

        playlistGrid.appendChild(card);
    });
}

// CREATE NEW PLAYLIST

function createPlaylist() {
    const name = playlistNameInput.value.trim();

    if (!name) {
        alert("Please enter a playlist name.");
        playlistNameInput.focus();
        return;
    }

    let playlists = getPlaylists();

    const alreadyExists = playlists.some(
        playlist => playlist.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
        alert("This playlist already exists!");
        return;
    }

    playlists.push({
        id: Date.now(),
        name: name,
        songs: []
    });

    savePlaylists(playlists);

    playlistNameInput.value = "";

    renderPlaylists();
}

// BUTTON CLICK

createPlaylistBtn.addEventListener("click", createPlaylist);

// ENTER KEY SUPPORT

playlistNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        createPlaylist();
    }
});

// LOAD SAVED PLAYLISTS

renderPlaylists();


// ADD SONG TO PLAYLIST

// Music Selection Modal Elements
const musicModal = document.getElementById("musicModal");
const musicModalList = document.getElementById("musicModalList");
const closeMusicModal = document.getElementById("closeMusicModal");

let activePlaylistId = null;


// Open Music Selection Modal
function addSongToPlaylist(playlistId) {
    activePlaylistId = playlistId;

    renderMusicModal();

    musicModal.classList.add("active");
}


// Render Songs Inside Modal
function renderMusicModal() {
    const playlists = getPlaylists();

    const playlist = playlists.find(
        item => item.id === activePlaylistId
    );

    if (!playlist) return;

    musicModalList.innerHTML = "";

    tracks.forEach(track => {
        const alreadyAdded = playlist.songs.includes(track.title);

        const songElement = document.createElement("div");
        songElement.className = "music-modal-song";

        const songInfo = document.createElement("div");
        songInfo.className = "music-modal-song-info";

        const songTitle = document.createElement("h4");
        songTitle.textContent = track.title;

        const songArtist = document.createElement("p");
        songArtist.textContent = track.artist;

        songInfo.appendChild(songTitle);
        songInfo.appendChild(songArtist);

        const addButton = document.createElement("button");
        addButton.className = "add-modal-song";
        addButton.textContent = alreadyAdded ? "Added ✓" : "+ Add";
        addButton.disabled = alreadyAdded;

        addButton.addEventListener("click", () => {
            addSelectedSong(track.title);
        });

        songElement.appendChild(songInfo);
        songElement.appendChild(addButton);

        musicModalList.appendChild(songElement);
    });
}


// Add Selected Song to Playlist
function addSelectedSong(songTitle) {
    const playlists = getPlaylists();

    const playlist = playlists.find(
        item => item.id === activePlaylistId
    );

    if (!playlist) return;

    if (playlist.songs.includes(songTitle)) return;

    playlist.songs.push(songTitle);

    savePlaylists(playlists);

    renderPlaylists();
    renderMusicModal();
}


// Close Modal
closeMusicModal.addEventListener("click", () => {
    musicModal.classList.remove("active");
});


// Close Modal When Clicking Outside
musicModal.addEventListener("click", (event) => {
    if (event.target === musicModal) {
        musicModal.classList.remove("active");
    }
});


// Close Modal With Escape Key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        musicModal.classList.remove("active");
    }
});
// =============================
// FULLSCREEN PLAYER
// =============================

const fullscreenPlayer = document.getElementById("fullscreenPlayer");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const closeFullscreen = document.getElementById("closeFullscreen");

const fullscreenArtwork = document.getElementById("fullscreenArtwork");
const fullscreenTitle = document.getElementById("fullscreenTitle");
const fullscreenArtist = document.getElementById("fullscreenArtist");
const fullscreenLike = document.getElementById("fullscreenLike");

const fullscreenProgressTrack =
    document.getElementById("fullscreenProgressTrack");

const fullscreenProgressFill =
    document.getElementById("fullscreenProgressFill");

const fullscreenCurrentTime =
    document.getElementById("fullscreenCurrentTime");

const fullscreenDuration =
    document.getElementById("fullscreenDuration");

const fullscreenPlay =
    document.getElementById("fullscreenPlay");

const fullscreenPrevious =
    document.getElementById("fullscreenPrevious");

const fullscreenNext =
    document.getElementById("fullscreenNext");

const fullscreenShuffle =
    document.getElementById("fullscreenShuffle");

const fullscreenRepeat =
    document.getElementById("fullscreenRepeat");

const fullscreenVolume =
    document.getElementById("fullscreenVolume");


function updateFullscreenPlayer() {

    if (!fullscreenPlayer) return;

    const track = tracks[currentTrackIndex];

    fullscreenTitle.textContent = track.title;
    fullscreenArtist.textContent = track.artist;

    fullscreenArtwork.className = "fullscreen-artwork";
    if (track.image) {
        fullscreenArtwork.style.backgroundImage = `url('${track.image.replace("300x300bb", "600x600bb")}')`;
        fullscreenArtwork.style.backgroundSize = "cover";
        fullscreenArtwork.style.backgroundPosition = "center";
        fullscreenArtwork.innerHTML = "";
    }

    fullscreenPlay.textContent =
        isPlaying ? "Ⅱ" : "▶";

    fullscreenCurrentTime.textContent =
        formatTime(audio.currentTime);

    fullscreenDuration.textContent =
        formatTime(audio.duration);

    fullscreenProgressFill.style.width =
        audio.duration
            ? `${(audio.currentTime / audio.duration) * 100}%`
            : "0%";

    fullscreenShuffle.classList.toggle(
        "control-active",
        isShuffle
    );

    fullscreenRepeat.classList.toggle(
        "control-active",
        isRepeat
    );

    const currentTitle = track.title;
    const favorites = getFavorites();

    const liked = favorites.includes(currentTitle);

    fullscreenLike.classList.toggle("liked", liked);

    fullscreenLike.textContent =
        liked ? "♥" : "♡";
}


// OPEN FULLSCREEN

if (fullscreenBtn) {

    fullscreenBtn.addEventListener("click", () => {

        fullscreenPlayer.classList.add("active");

        updateFullscreenPlayer();

    });

}


// CLOSE FULLSCREEN

if (closeFullscreen) {

    closeFullscreen.addEventListener("click", () => {

        fullscreenPlayer.classList.remove("active");

    });

}


// FULLSCREEN PLAY / PAUSE

if (fullscreenPlay) {

    fullscreenPlay.addEventListener("click", () => {

        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }

        updateFullscreenPlayer();

    });

}


// FULLSCREEN PREVIOUS

if (fullscreenPrevious) {

    fullscreenPrevious.addEventListener("click", () => {

        previousTrack();

        updateFullscreenPlayer();

    });

}


// FULLSCREEN NEXT

if (fullscreenNext) {

    fullscreenNext.addEventListener("click", () => {

        nextTrack();

        updateFullscreenPlayer();

    });

}


// FULLSCREEN SHUFFLE

if (fullscreenShuffle) {

    fullscreenShuffle.addEventListener("click", () => {

        isShuffle = !isShuffle;

        shuffleButton.classList.toggle(
            "control-active",
            isShuffle
        );

        updateFullscreenPlayer();

    });

}


// FULLSCREEN REPEAT

if (fullscreenRepeat) {

    fullscreenRepeat.addEventListener("click", () => {

        isRepeat = !isRepeat;

        audio.loop = isRepeat;

        repeatButton.classList.toggle(
            "control-active",
            isRepeat
        );

        updateFullscreenPlayer();

    });

}


// FULLSCREEN PROGRESS

if (fullscreenProgressTrack) {

    fullscreenProgressTrack.addEventListener(
        "click",
        (event) => {

            if (!audio.duration) return;

            const rect =
                fullscreenProgressTrack.getBoundingClientRect();

            const position =
                event.clientX - rect.left;

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        1,
                        position / rect.width
                    )
                );

            audio.currentTime =
                percentage * audio.duration;

        }
    );

}


// FULLSCREEN VOLUME

if (fullscreenVolume) {

    fullscreenVolume.addEventListener(
        "input",
        () => {

            audio.volume =
                Number(fullscreenVolume.value);

            volumeFill.style.width =
                `${audio.volume * 100}%`;

        }
    );

}


// FULLSCREEN LIKE

if (fullscreenLike) {

    fullscreenLike.addEventListener("click", () => {

        likeButton.click();

        updateFullscreenPlayer();

    });

}


// UPDATE FULLSCREEN WITH AUDIO

audio.addEventListener("timeupdate", () => {

    if (!fullscreenPlayer) return;

    if (
        fullscreenPlayer.classList.contains("active")
    ) {
        updateFullscreenPlayer();
    }

});


// UPDATE AFTER TRACK CHANGE

const originalLoadTrack = loadTrack;

loadTrack = function (index) {

    originalLoadTrack(index);

    updateFullscreenPlayer();

};

// WELCOME OVERLAY & TEXT-TO-SPEECH
/* =================================
   BEATNOVA SMART QUEUE
================================= */

let musicQueue = [];

const queuePanel = document.getElementById("queuePanel");
const queueBtn = document.getElementById("queueBtn");
const queueCloseBtn = document.getElementById("queueCloseBtn");
const queueList = document.getElementById("queueList");

queueBtn.addEventListener("click", () => {
    queuePanel.classList.add("active");
});

queueCloseBtn.addEventListener("click", () => {
    queuePanel.classList.remove("active");
});

function addToQueue(track) {

    musicQueue.push(track);

    renderQueue();
}

function renderQueue() {

    if (musicQueue.length === 0) {

        queueList.innerHTML = `
            <div class="queue-empty">
                <span>♫</span>
                <p>Your queue is empty</p>
                <small>Add songs to play them next</small>
            </div>
        `;

        return;
    }

    queueList.innerHTML = "";

    musicQueue.forEach((track, index) => {

        const queueItem = document.createElement("div");

        queueItem.className = "queue-item";

        queueItem.innerHTML = `
            <div class="queue-item-cover">
                ${track.cover ? `<img src="${track.cover}" alt="">` : "♫"}
            </div>

            <div class="queue-item-info">
                <strong>${track.title}</strong>
                <small>${track.artist}</small>
            </div>

            <button
                class="queue-remove"
                data-index="${index}">
                ✕
            </button>
        `;

        queueList.appendChild(queueItem);
    });

    document.querySelectorAll(".queue-remove").forEach(button => {

        button.addEventListener("click", () => {

            const index = Number(button.dataset.index);

            musicQueue.splice(index, 1);

            renderQueue();
        });

    });
}


// =============================
// BEATNOVA ARTISTS
// =============================

const artists = [
    "Arijit Singh",
    "Shreya Ghoshal",
    "Atif Aslam",
    "Neha Kakkar",
    "Jubin Nautiyal",
    "Sonu Nigam",
    "Armaan Malik",
    "Darshan Raval",
    "Sunidhi Chauhan",
    "Mohit Chauhan",
    "KK",
    "Vishal Mishra"
];

const artistsGrid = document.getElementById("artistsGrid");

// Load singer photos and display artist cards
async function getArtistImage(name) {
    try {
        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
        );

        if (!response.ok) return "";

        const data = await response.json();

        return data.thumbnail?.source || "";
    } catch (error) {
        return "";
    }
}

async function renderArtists() {
    if (!artistsGrid) return;

    artistsGrid.innerHTML = "";

    artists.forEach((artist) => {
        const card = document.createElement("article");
        card.className = "artist-card";

        card.innerHTML = `
            <div class="artist-image-wrapper">
                <img class="artist-image"
                     src=""
                     alt="${artist}"
                     loading="lazy">
            </div>

            <h3>${artist}</h3>
            <p>Artist</p>

            <button class="artist-play-button" aria-label="Play ${artist}">
                ▶
            </button>
        `;

        const image = card.querySelector(".artist-image");

        getArtistImage(artist).then((imageUrl) => {
            if (imageUrl) {
                image.src = imageUrl;
            } else {
                image.src = "https://placehold.co/300x300/21152f/ffffff?text=♫";
            }
        });

        card.addEventListener("click", () => {
            // Unlock audio for mobile
            audio.play().catch(() => {});
            playArtistSongs(artist, card);
        });

        artistsGrid.appendChild(card);
    });
}

// Fetch and play songs of selected artist
async function playArtistSongs(artist, card) {
    try {
        if (card) {
            card.classList.add("loading");
        }

        const response = await fetch(
            "/api/songs?q=" + encodeURIComponent(artist)
        );

        if (!response.ok) {
            throw new Error("Server response: " + response.status);
        }

        const data = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
            throw new Error("No songs found");
        }

        const artistTracks = data.results
            .map((item) => {

                let artistName = "Unknown Artist";

                if (
                    item.more_info &&
                    item.more_info.artistMap &&
                    item.more_info.artistMap.primary_artists &&
                    item.more_info.artistMap.primary_artists.length > 0
                ) {
                    artistName =
                        item.more_info.artistMap.primary_artists
                            .map((a) => a.name)
                            .join(", ");
                }

                let songUrl = "";

                if (
                    item.more_info &&
                    item.more_info.encrypted_media_url
                ) {
                    songUrl = decryptJioSaavnUrl(
                        item.more_info.encrypted_media_url
                    );
                }

                return {
                    title: (item.title || "Unknown Song")
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, "&"),

                    artist: artistName,

                    src: songUrl,

                    image: item.image
                        ? item.image.replace("150x150", "500x500")
                        : ""
                };
            })
            .filter((track) => track.src);

        if (artistTracks.length === 0) {
            alert("Is singer ke playable songs nahi mile.");
            return;
        }

        tracks = artistTracks;

        currentTrackIndex = 0;

        loadTrack(0);

        await playTrack();

        const player = document.querySelector(".music-player");

        if (player) {
            player.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }

    } catch (error) {
        console.error("Artist playlist error:", error);

        alert("Songs load nahi ho paaye. Dobara try karo.");

    } finally {
        if (card) {
            card.classList.remove("loading");
        }
    }
}

   

// Display artists on page load
renderArtists();

