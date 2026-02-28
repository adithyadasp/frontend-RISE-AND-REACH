const API_URL = 'http://localhost:5000/api/helplines';

let allHelplines = [];

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHelplines();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', filterHelplines);
    document.getElementById('resetBtn').addEventListener('click', resetSearch);
    document.getElementById('helplineForm').addEventListener('submit', addHelpline);
    
    // Allow Enter key to search
    document.getElementById('citySearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterHelplines();
    });
}

// Load all helplines from backend
async function loadHelplines() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch helplines');
        
        allHelplines = await response.json();
        displayHelplines(allHelplines);
    } catch (error) {
        console.error('Error loading helplines:', error);
        document.getElementById('helplinesList').innerHTML = 
            '<p class="no-results">⚠️ Failed to load helplines. Make sure the backend server is running on http://localhost:5000</p>';
    }
}

// Display helplines in the grid
function displayHelplines(helplines) {
    const container = document.getElementById('helplinesList');
    
    if (helplines.length === 0) {
        container.innerHTML = '<p class="no-results">No helplines found. Try a different search!</p>';
        return;
    }

    container.innerHTML = helplines.map(helpline => `
        <div class="helpline-card">
            <h3>${escapeHtml(helpline.name)}</h3>
            <div class="helpline-detail">
                <strong>📍 City:</strong> ${escapeHtml(helpline.city)}
            </div>
            <div class="helpline-detail">
                <strong>� Location:</strong> ${escapeHtml(helpline.location || 'N/A')}
            </div>
            <div class="helpline-detail">
                <strong>📞 Contact:</strong> ${escapeHtml(helpline.contact)}
            </div>
            <span class="category-badge">${escapeHtml(helpline.category)}</span>
            <div class="card-buttons">
                <a href="tel:${escapeHtml(helpline.contact)}" class="contact-link">📞 Call Now</a>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(helpline.location || helpline.city)}" target="_blank" class="map-link">🗺️ View Map</a>
            </div>
        </div>
    `).join('');
}

// Filter helplines by city and category
function filterHelplines() {
    const city = document.getElementById('citySearch').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;

    let filtered = allHelplines;

    if (city) {
        filtered = filtered.filter(h => 
            h.city.toLowerCase().includes(city)
        );
    }

    if (category) {
        filtered = filtered.filter(h => 
            h.category === category
        );
    }

    displayHelplines(filtered);
}

// Reset search filters
function resetSearch() {
    document.getElementById('citySearch').value = '';
    document.getElementById('categoryFilter').value = '';
    displayHelplines(allHelplines);
}

// Add new helpline
async function addHelpline(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        city: document.getElementById('city').value,
        category: document.getElementById('category').value,
        contact: document.getElementById('contact').value,
        location: document.getElementById('location').value
    };

    const messageElement = document.getElementById('formMessage');

    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to add helpline');

        // Success message
        messageElement.textContent = '✅ Helpline added successfully!';
        messageElement.className = 'form-message success';

        // Clear form
        document.getElementById('helplineForm').reset();

        // Reload helplines
        setTimeout(() => {
            loadHelplines();
            messageElement.className = 'form-message';
        }, 2000);

    } catch (error) {
        console.error('Error adding helpline:', error);
        messageElement.textContent = '❌ Failed to add helpline. Please try again.';
        messageElement.className = 'form-message error';
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
const toggleButton = document.getElementById("darkModeToggle");

toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        toggleButton.textContent = "☀ Light Mode";
    } else {
        toggleButton.textContent = "🌙 Dark Mode";
    }
});
