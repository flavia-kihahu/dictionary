const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const elements = {
    searchForm: document.getElementById("searchForm"),
    searchInput: document.getElementById("searchInput"),
    content: document.getElementById("content"),
    loading: document.querySelector(".loading"),
    errorMessage: document.getElementById("errorMessage"),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon")
};

function initializeTheme() {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        elements.themeIcon.innerHTML =
            '<i class="bi bi-sun-fill"></i>';
    }
}

elements.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const dark =
        document.body.classList.contains("dark-mode");
    localStorage.setItem(
        "theme",
        dark ? "dark" : "light"
    );
    elements.themeIcon.innerHTML = dark
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
});

function showError(message){
    elements.errorMessage.style.display="block";
    elements.errorMessage.textContent=message;
}

function clearError(){
    elements.errorMessage.style.display="none";
    elements.errorMessage.textContent="";
}

function showLoading(){
    elements.loading.style.display="block";
}

function hideLoading(){
    elements.loading.style.display="none";
}

async function fetchWord(word){
    if(!word.trim()){
        showError("Please enter a word.");
        return null;
    }
    clearError();
    showLoading();
    elements.content.innerHTML="";
    try{
        const response=await fetch(`${API_URL}${encodeURIComponent(word.toLowerCase()
            )}`
        );

        const data = await response.json();
        if(!response.ok){
            showError(
                data.title ||
                `No definition found for "${word}".`
            );
            return null;
        }
        return data[0];
    } catch(error){
        console.error(error);
        showError("Unable to connect to the dictionary.");
        return null;
    }
    finally{
        hideLoading();
    }
}

window.playAudio=function(audioUrl){
    if(!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play()
    .catch(()=>{
        showError("Audio pronunciation unavailable.");
    });
};

window.searchWord=function(word){
    elements.searchInput.value=word;
    performSearch();
};

async function performSearch(){
    const word = elements.searchInput.value.trim();
    if(!word){
        showError("Please enter a word.");
        return;
    }

    const data = await fetchWord(word);
    if(!data) return;
    displayWord(data);
}

elements.searchForm.addEventListener(
    "submit",
    e=>{
        e.preventDefault();
        performSearch();
    }
);

elements.searchInput.addEventListener(
    "keydown",
    e=>{
        if(e.key==="Enter"){
            e.preventDefault();
            performSearch();
        }
    }
);

initializeTheme();

function displayWord(wordData) {
    const phonetic =
        wordData.phonetic ||
        wordData.phonetics.find(p => p.text)?.text ||
        "";

    const audio =
        wordData.phonetics.find(p => p.audio)?.audio ||
        "";
    let html = `
        <div class="word-header">
            <h1 class="word-title">
                ${wordData.word}
            </h1>
            <div class="pronunciation-section">
    <h3 class="pronunciation-title">
        Pronunciation
    </h3>
    <div class="pronunciation">
        <span class="phonetic">
            ${phonetic || "Not available"}
        </span>
        ${
            audio
            ? `
            <button class="audio-btn" onclick="playAudio('${audio}')">
                <i class="bi bi-volume-up-fill"></i>
            </button>
            `
            : ""
        }
    </div>
      </div>
    </div>
    `;
    wordData.meanings.forEach(meaning => {
        html += `
            <section class="definitions-section">
                <h2 class="section-title">
                    ${meaning.partOfSpeech}
                </h2>
        `;
        meaning.definitions.forEach((def, index) => {
            html += `
            <div class="definition-item">
                <div class="definition-number">
                    ${index + 1}
                </div>
                <div class="definition-content">
                    <span class="part-of-speech">
                        ${meaning.partOfSpeech}
                    </span>
                    <p class="definition-text">
                        ${def.definition}
                    </p>
                    ${
                        def.example
                        ? `
                        <div class="example">
                            "${def.example}"
                        </div>
                        `
                        : ""
                    }
            `;
            if (def.synonyms && def.synonyms.length) {
                html += `
                <div class="synonyms-section">
                    <div class="synonyms-title">
                        Synonyms
                    </div>
                    <div class="synonyms-list">
                `;
                def.synonyms
                    .slice(0, 8)
                    .forEach(word => {
                        html += `
                        <span class="synonym-tag" onclick="searchWord('${word}')">
                            ${word}
                        </span>
                        `;
                    });
                html += `
                    </div>
                </div>
                `;
            }
            html += `
                </div>
            </div>
            `;
        });
        html += `</section>`;
    });

    const allSynonyms = [];
    wordData.meanings.forEach(meaning => {
        if (meaning.synonyms) {
            allSynonyms.push(...meaning.synonyms);
        }
    });

    const uniqueSynonyms = [...new Set(allSynonyms)];
    if (uniqueSynonyms.length) {
        html += `
        <section class="definitions-section">
            <h2 class="section-title">
                Synonyms
            </h2>
            <div class="synonyms-list">
        `;
        uniqueSynonyms
            .slice(0, 15)
            .forEach(word => {
                html += `
                <span class="synonym-tag" onclick="searchWord('${word}')">
                    ${word}
                </span>
                `;
            });
        html += `
            </div>
        </section>
        `;
    }

    const antonyms = [];
    wordData.meanings.forEach(meaning => {
        if (meaning.antonyms) {
            antonyms.push(...meaning.antonyms);
        }
    });
    const uniqueAntonyms = [...new Set(antonyms)];
    if (uniqueAntonyms.length) {
        html += `
        <section class="definitions-section">
            <h2 class="section-title">
                Antonyms
            </h2>
            <div class="synonyms-list">
        `;
        uniqueAntonyms
            .slice(0, 15)
            .forEach(word => {
                html += `
                <span class="synonym-tag" onclick="searchWord('${word}')">
                    ${word}
                </span>
                `;
            });
        html += `
            </div>
        </section>
        `;
    }
    elements.content.innerHTML = html;
}