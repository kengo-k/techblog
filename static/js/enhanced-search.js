// Enhanced search functionality for Hugo blog
let searchData = null;
let fuseInstance = null;
let selectedTag = null;
let selectedMonth = null;

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const noResults = document.getElementById('noResults');
const tagFilters = document.getElementById('tagFilters');
const monthFilters = document.getElementById('monthFilters');
const clearFilters = document.getElementById('clearFilters');
const clearFiltersBtn = document.querySelector('.clear-filters-btn');

// Initialize search
document.addEventListener('DOMContentLoaded', function() {
    loadSearchData();
    setupEventListeners();
    setupFilterListeners();
});

// Load search data
function loadSearchData() {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                searchData = JSON.parse(xhr.responseText);
                initializeFuse();
            } else {
                console.error('Failed to load search data');
            }
        }
    };
    
    // Try different paths based on current location
    const currentPath = window.location.pathname;
    let jsonPath = '../index.json';
    
    if (currentPath.includes('/en/')) {
        jsonPath = '../index.json';
    } else if (currentPath.includes('/ja/') || currentPath.includes('/search/')) {
        jsonPath = '../index.json';
    }
    
    xhr.open('GET', jsonPath);
    xhr.send();
}

// Initialize Fuse.js
function initializeFuse() {
    const options = {
        keys: ['title', 'content', 'summary'],
        threshold: 0.4,
        distance: 100,
        ignoreLocation: true,
        includeScore: true,
        includeMatches: true
    };
    
    fuseInstance = new Fuse(searchData, options);
}

// Setup filter listeners (for Hugo-generated filters)
function setupFilterListeners() {
    // Tag filter listeners
    document.querySelectorAll('.tag-filter').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const tag = this.dataset.tag;
            selectTagFilter(tag, this);
        });
    });
    
    // Month filter listeners
    document.querySelectorAll('.month-filter').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const month = this.dataset.month;
            selectMonthFilter(month, this);
        });
    });
}

// Extract tags from post (use actual tags from post data)
function extractTags(post) {
    return post.tags || [];
}

// Extract month from permalink
function extractMonth(permalink) {
    const match = permalink.match(/(\d{4})(\d{2})/);
    if (match) {
        return `${match[1]}-${match[2]}`;
    }
    return null;
}

// Format month for display
function formatMonth(month) {
    const [year, monthNum] = month.split('-');
    const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');
    
    if (isEnglish) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    } else {
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return `${year}年${monthNames[parseInt(monthNum) - 1]}`;
    }
}

// Select tag filter
function selectTagFilter(tag, element) {
    // Remove previous selection
    document.querySelectorAll('.tag-filter').forEach(btn => {
        btn.className = 'px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 cursor-pointer tag-filter';
    });
    
    if (selectedTag === tag) {
        selectedTag = null;
    } else {
        selectedTag = tag;
        element.className = 'px-2 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer tag-filter';
    }
    
    updateClearFiltersVisibility();
    performSearch();
}

// Select month filter
function selectMonthFilter(month, element) {
    // Remove previous selection
    document.querySelectorAll('.month-filter').forEach(btn => {
        btn.className = 'flex items-center justify-between py-1 text-left text-sm hover:text-gray-600 cursor-pointer month-filter';
        btn.innerHTML = btn.innerHTML.replace(' font-bold text-blue-600', '');
    });
    
    if (selectedMonth === month) {
        selectedMonth = null;
    } else {
        selectedMonth = month;
        element.className = 'flex items-center justify-between py-1 text-left text-sm font-bold text-blue-600 cursor-pointer month-filter';
    }
    
    updateClearFiltersVisibility();
    performSearch();
}

// Clear all filters
function clearAllFilters() {
    selectedTag = null;
    selectedMonth = null;
    
    // Reset tag buttons
    document.querySelectorAll('.tag-filter').forEach(btn => {
        btn.className = 'px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 cursor-pointer tag-filter';
    });
    
    // Reset month buttons
    document.querySelectorAll('.month-filter').forEach(btn => {
        btn.className = 'flex items-center justify-between py-1 text-left text-sm hover:text-gray-600 cursor-pointer month-filter';
    });
    
    updateClearFiltersVisibility();
    performSearch();
}

// Update clear filters button visibility
function updateClearFiltersVisibility() {
    const hasFilters = selectedTag || selectedMonth;
    clearFilters.style.display = hasFilters ? 'block' : 'none';
}

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(performSearch, 300));
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Perform search
function performSearch() {
    if (!fuseInstance || !searchData) return;
    
    const query = searchInput.value.trim();
    let results = [];
    
    if (query) {
        const fuseResults = fuseInstance.search(query);
        results = fuseResults.map(result => result.item);
    } else {
        results = searchData;
    }
    
    // Apply filters
    if (selectedTag) {
        results = results.filter(post => {
            const tags = extractTags(post);
            return tags.includes(selectedTag);
        });
    }
    
    if (selectedMonth) {
        results = results.filter(post => {
            const month = extractMonth(post.permalink);
            return month === selectedMonth;
        });
    }
    
    // Limit results
    results = results.slice(0, 20);
    
    displayResults(results, query);
}

// Display search results
function displayResults(results, query) {
    if (results.length === 0) {
        searchResults.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    const resultsHTML = results.map(post => {
        const title = highlightText(post.title, query);
        const summary = highlightText(post.summary || '', query);
        const excerpt = getExcerpt(post.content, query);
        const tags = extractTags(post);
        
        return `
            <article class="border-b border-gray-100 pb-6 mb-6 last:border-b-0">
                <div class="flex gap-6">
                    <div class="w-48 flex-shrink-0">
                        <div class="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <a href="${post.permalink}" class="block">
                            <h2 class="text-xl font-medium mb-3 text-gray-900 hover:text-gray-600 transition-colors">
                                ${title}
                            </h2>
                        </a>
                        <p class="text-gray-600 text-sm mb-2 line-clamp-2">${summary}</p>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-2">${excerpt}</p>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div class="flex gap-2">
                                ${tags.slice(0, 3).map(tag => `<span class="bg-gray-100 px-2 py-1 rounded">${tag}</span>`).join('')}
                            </div>
                            <span>${formatDate(post.permalink)}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// Highlight search text
function highlightText(text, query) {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1">$1</mark>');
}

// Get excerpt with highlighted search term
function getExcerpt(content, query, maxLength = 150) {
    if (!content) return '';
    
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (!query) {
        return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    
    // Find the first occurrence of the query
    const lowerContent = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index === -1) {
        return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    
    // Extract around the found term
    const start = Math.max(0, index - 50);
    const end = Math.min(plainText.length, index + query.length + 100);
    let excerpt = plainText.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < plainText.length) excerpt += '...';
    
    return highlightText(excerpt, query);
}

// Format date from permalink
function formatDate(permalink) {
    const match = permalink.match(/(\d{4})(\d{2})/);
    if (match) {
        const year = match[1];
        const month = match[2];
        const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');
        
        if (isEnglish) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        } else {
            return `${year}年${parseInt(month)}月`;
        }
    }
    return '';
}

// Escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}