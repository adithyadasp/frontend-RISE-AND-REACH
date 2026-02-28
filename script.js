// Determine API URL based on environment
const API_BASE_URL =  'https://backend-wtkt.onrender.com'

const API_URL = `${API_BASE_URL}/helplines`;
const REVIEWS_API_URL = `${API_BASE_URL}/reviews`;
const FAVORITES_KEY = 'helpline_favorites';

let allHelplines = [];
let currentHelplineId = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHelplines();
    displayFavorites();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const helplineForm = document.getElementById('helplineForm');
    const citySearch = document.getElementById('citySearch');
    
    if (searchBtn) searchBtn.addEventListener('click', filterHelplines);
    if (resetBtn) resetBtn.addEventListener('click', resetSearch);
    if (helplineForm) helplineForm.addEventListener('submit', addHelpline);
    if (citySearch) citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterHelplines();
    });
    
    // Setup dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                darkModeToggle.textContent = '☀️ Light Mode';
                localStorage.setItem('darkMode', 'true');
            } else {
                darkModeToggle.textContent = '🌙 Dark Mode';
                localStorage.setItem('darkMode', 'false');
            }
        });
        
        // Restore dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        }
    }

    // Setup review form listeners
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    // Setup star rating
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.dataset.rating;
            document.getElementById('reviewRating').value = rating;
            updateStarDisplay(rating);
        });
        star.addEventListener('mouseover', () => {
            const rating = star.dataset.rating;
            updateStarDisplay(rating);
        });
    });

    const starRating = document.getElementById('starRating');
    if (starRating) {
        starRating.addEventListener('mouseout', () => {
            const currentRating = document.getElementById('reviewRating').value;
            updateStarDisplay(currentRating);
        });
    }
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
            <div id="rating-${helpline.id}" class="rating-display">Loading rating...</div>
            <div class="card-buttons">
                <a href="tel:${escapeHtml(helpline.contact)}" class="contact-link"><i class="fas fa-phone"></i> Call Now</a>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(helpline.location || helpline.city)}" target="_blank" class="map-link"><i class="fas fa-map-marker-alt"></i> View Map</a>
                <button class="favorite-btn ${isFavorited(helpline.id) ? 'active' : ''}" onclick="toggleFavorite(${helpline.id}, ${JSON.stringify(helpline).replace(/"/g, '&quot;')})">
                    <i class="fas fa-heart"></i> ${isFavorited(helpline.id) ? 'Favorited' : 'Add'}
                </button>
                <button class="review-btn" onclick="openReviewModal(${helpline.id}, '${escapeHtml(helpline.name)}')">
                    <i class="fas fa-star"></i> Review
                </button>
            </div>
        </div>
    `).join('');

    // Load ratings for each helpline
    helplines.forEach(helpline => {
        loadAverageRating(helpline.id);
    });
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

// ============= FAVORITES FUNCTIONS =============

// Get favorites from localStorage
function getFavorites() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}

// Save favorites to localStorage
function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// Check if a helpline is favorited
function isFavorited(helplineId) {
    return getFavorites().some(fav => fav.id === helplineId);
}

// Toggle favorite status
function toggleFavorite(helplineId, helplineData) {
    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === helplineId);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
    } else {
        // Add to favorites
        if (typeof helplineData === 'string') {
            helplineData = JSON.parse(helplineData.replace(/&quot;/g, '"'));
        }
        favorites.push({
            id: helplineId,
            ...helplineData
        });
    }
    
    saveFavorites(favorites);
    displayFavorites();
    displayHelplines(allHelplines); // Refresh helplines to update button states
}

// Display favorites
function displayFavorites() {
    const favorites = getFavorites();
    const favoritesList = document.getElementById('favoritesList');
    
    if (!favoritesList) return;
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="no-results">No favorites yet. Add some helplines to your favorites!</p>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(helpline => `
        <div class="helpline-card">
            <h3>${escapeHtml(helpline.name)}</h3>
            <div class="helpline-detail">
                <strong>📍 City:</strong> ${escapeHtml(helpline.city)}
            </div>
            <div class="helpline-detail">
                <strong>📍 Location:</strong> ${escapeHtml(helpline.location || 'N/A')}
            </div>
            <div class="helpline-detail">
                <strong>📞 Contact:</strong> ${escapeHtml(helpline.contact)}
            </div>
            <span class="category-badge">${escapeHtml(helpline.category)}</span>
            <div class="card-buttons">
                <a href="tel:${escapeHtml(helpline.contact)}" class="contact-link"><i class="fas fa-phone"></i> Call Now</a>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(helpline.location || helpline.city)}" target="_blank" class="map-link"><i class="fas fa-map-marker-alt"></i> View Map</a>
                <button class="favorite-btn active" onclick="toggleFavorite(${helpline.id}, ${JSON.stringify(helpline).replace(/"/g, '&quot;')})">
                    <i class="fas fa-heart"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// ============= REVIEWS FUNCTIONS =============

// Load and display average rating for a helpline
async function loadAverageRating(helplineId) {
    try {
        const response = await fetch(`${REVIEWS_API_URL}/${helplineId}`);
        const reviews = await response.json();
        
        if (reviews.length === 0) {
            document.getElementById(`rating-${helplineId}`).innerHTML = 
                '<div class="rating-display">No ratings yet</div>';
            return;
        }

        const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
        const stars = '★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));
        
        document.getElementById(`rating-${helplineId}`).innerHTML = 
            `<strong>${stars}</strong> ${averageRating}/5 (${reviews.length} reviews)`;
    } catch (error) {
        console.error('Error loading rating:', error);
        document.getElementById(`rating-${helplineId}`).innerHTML = 
            '<div class="rating-display">Rating unavailable</div>';
    }
}

// Open review modal
function openReviewModal(helplineId, helplineName) {
    currentHelplineId = helplineId;
    document.getElementById('reviewModal').style.display = 'block';
    document.querySelector('.modal-content h3').textContent = `Review: ${helplineName}`;
    loadAndDisplayReviews(helplineId);
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('reviewForm').reset();
    document.getElementById('reviewRating').value = 0;
    updateStarDisplay(0);
    currentHelplineId = null;
}

// Update star display based on rating
function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        if (star.dataset.rating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Load and display reviews for a helpline
async function loadAndDisplayReviews(helplineId) {
    try {
        const response = await fetch(`${REVIEWS_API_URL}/${helplineId}`);
        const reviews = await response.json();
        
        const reviewsContainer = document.getElementById('reviewsContainer');
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-results">No reviews yet. Be the first to review!</p>';
            return;
        }

        const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
        const stars = '★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));
        
        reviewsContainer.innerHTML = `
            <div class="rating-summary">
                <div class="average-rating">
                    <div class="rating-number">${averageRating}</div>
                    <div class="rating-stars">${stars}</div>
                    <div class="rating-count">${reviews.length} reviews</div>
                </div>
            </div>
            <div class="reviews-list">
                ${reviews.map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-user">${escapeHtml(review.userName)}</div>
                            <div class="review-rating">
                                <span class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                                <span class="rating-number">${review.rating}/5</span>
                            </div>
                        </div>
                        <div class="review-date">${review.date}</div>
                        <div class="review-comment">${escapeHtml(review.comment)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsContainer').innerHTML = 
            '<p class="no-results">Error loading reviews</p>';
    }
}

// Submit a review
async function submitReview(e) {
    e.preventDefault();

    if (!currentHelplineId) {
        alert('Please select a helpline first');
        return;
    }

    const rating = document.getElementById('reviewRating').value;
    if (!rating || rating === '0') {
        alert('Please select a rating');
        return;
    }

    const formData = {
        helplineId: currentHelplineId,
        userName: document.getElementById('reviewName').value || 'Anonymous',
        rating: parseInt(rating),
        comment: document.getElementById('reviewComment').value
    };

    const messageElement = document.getElementById('reviewMessage');

    try {
        const response = await fetch(`${REVIEWS_API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to add review');

        messageElement.textContent = '✅ Thank you! Your review has been added.';
        messageElement.className = 'form-message success';

        document.getElementById('reviewForm').reset();
        document.getElementById('reviewRating').value = 0;
        updateStarDisplay(0);

        setTimeout(() => {
            loadAndDisplayReviews(currentHelplineId);
            loadAverageRating(currentHelplineId);
            messageElement.className = 'form-message';
        }, 1500);

    } catch (error) {
        console.error('Error submitting review:', error);
        messageElement.textContent = '❌ Failed to submit review. Please try again.';
        messageElement.className = 'form-message error';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reviewModal');
    if (event.target == modal) {
        closeReviewModal();
    }
}
