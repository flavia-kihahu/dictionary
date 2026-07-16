const API_URL = 'https://api.dictionaryapi.dev/api/v1/entries/en/';

const elements = {
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  content: document.getElementById('content'),
  errorMessage: document.getElementById('errorMessage'),
  loading: document.querySelector('.loading'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon')
};

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    elements.themeIcon.innerHTML = '<i class="bi bi-sun"></i>';
  }
}

elements.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  elements.themeIcon.innerHTML = isDarkMode ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
});

function clearError() {
  elements.errorMessage.style.display = 'none';
  elements.errorMessage.textContent = '';
}

function showError(message) {
  elements.errorMessage.style.display = 'block';
  elements.errorMessage.textContent = message;
}

async function fetchWord(word) {
  if (!word.trim()) {
    showError('Please enter a word to search');
    return null;
  }
  clearError();
  elements.loading.style.display = 'block';
  elements.content.innerHTML = '';
  try {
    const response = await fetch(`${API_URL}${word.toLowerCase()}`);
    if (!response.ok) {
      if (response.status === 404) {
        showError(`Sorry we couldn't find the word "${word}". Please check the spelling and try again.`);
      } else {
        showError('An error occurred while fetching the word. Please try again later.');
      }
      return null;
    }
    const data = await response.json();
    return data[0];
  } catch (error) {
    showError('Failed to fetch data. Please check your internet connection and try again.');
    console.error('Fetch error:', error);
    return null;
  } finally {
    elements.loading.style.display = 'none';
  }
}

function displayWord(wordData) {
  if (!wordData) return;
  let html = '<div class="word-header">';
  html += `<h1 class="word-title">${wordData.word}</h1>`;
  if (wordData.phonetic) {
    html += `<div class="pronunciation"><span>${wordData.phonetic}</span>`;

    if (wordData.phonetics && wordData.phonetics.some(p => p.audio)) {
      const audioUrl = wordData.phonetics.find(p => p.audio)?.audio;
      if (audioUrl) {
        html += `<button class="audio-btn" onclick="playAudio('${audioUrl}')" title="Play pronunciation"><i class="bi bi-volume-up"></i></button>`;
      }
    }

    html += '</div>';
  }
  html += '</div>';

  if (wordData.meanings && wordData.meanings.length > 0) {
    wordData.meanings.forEach(meaning => {
      html += '<div class="definitions-section">';
      html += `<h2 class="section-title">${meaning.partOfSpeech}</h2>`;
      
      if (meaning.definitions) {
        html += '<h3 style="font-size: 14px; font-weight: 600; color: #999; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Meaning</h3>';
        meaning.definitions.forEach((def, index) => {
          html += '<div class="definition-item">';
          html += `<div class="definition-text">• ${def.definition}</div>`;
          
          if (def.example) {
            html += `<div class="example">"${def.example}"</div>`;
          }
          
          if (def.synonyms && def.synonyms.length > 0) {
            html += '<div style="margin-top: 12px;">';
            html += `<strong style="color: #999; font-size: 12px;">Synonyms:</strong> `;
            html += def.synonyms.slice(0, 3).map(syn => 
              `<span class="synonym-tag" onclick="searchWord('${syn}')">${syn}</span>`
            ).join(' ');
            html += '</div>';
          }
          
          html += '</div>';
        });
      }

      // Synonyms for this part of speech
      if (meaning.synonyms && meaning.synonyms.length > 0) {
        html += '<div class="synonyms-section">';
        html += '<div class="synonyms-title">Synonyms</div>';
        html += '<div class="synonyms-list">';
        meaning.synonyms.slice(0, 8).forEach(synonym => {
          html += `<span class="synonym-tag" onclick="searchWord('${synonym}')">${synonym}</span>`;
        });
        html += '</div></div>';
      }

      html += '</div>';
    });
  }

  // Antonyms
  const allAntonyms = [];
  if (wordData.meanings) {
    wordData.meanings.forEach(meaning => {
      if (meaning.antonyms) {
        allAntonyms.push(...meaning.antonyms);
      }
    });
  }

  if (allAntonyms.length > 0) {
    html += '<div class="definitions-section">';
    html += '<h2 class="section-title">Antonyms</h2>';
    html += '<div class="synonyms-list">';
    allAntonyms.slice(0, 8).forEach(antonym => {
      html += `<span class="synonym-tag" onclick="searchWord('${antonym}')">${antonym}</span>`;
    });
    html += '</div></div>';
  }

  // Source URLs
  if (wordData.sourceUrls && wordData.sourceUrls.length > 0) {
    html += '<div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.1);">';
    html += '<p style="font-size: 12px; color: #999; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Source</p>';
    wordData.sourceUrls.forEach(url => {
      html += `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #20c997; text-decoration: none; font-size: 14px; display: inline-block; margin-right: 20px; transition: all 0.3s; border-bottom: 1px solid #20c997;">Read more →</a>`;
    });
    html += '</div>';
  }

  elements.content.innerHTML = html;
}

window.playAudio = function(audioUrl) {
  if (!audioUrl) return;
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
    showError('Could not play audio pronunciation.');
  });
};

window.searchWord = function(word) {
  elements.searchInput.value = word;
  performSearch();
};

async function performSearch() {
  const word = elements.searchInput.value.trim();
  const wordData = await fetchWord(word);
  if (wordData) {
    displayWord(wordData);
  }
}

elements.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  performSearch();
});

initializeTheme();