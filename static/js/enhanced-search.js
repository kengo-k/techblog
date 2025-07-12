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
    const debouncedSearch = debounce(performSearch, 600);
    searchInput.addEventListener('input', debouncedSearch);
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
    } else if (selectedTag || selectedMonth) {
        // Only show all data if filters are applied
        results = searchData;
    } else {
        // No query and no filters - show nothing
        results = [];
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
        const url = new URL(post.permalink).pathname;
        const excerpt = getSearchExcerpt(post.content, query, 120);
        const tags = extractTags(post);
        
        return `
            <article class="mb-6 pb-4 border-b border-gray-100 last:border-b-0">
                <div class="max-w-none">
                    <a href="${post.permalink}" class="block group">
                        <h3 class="text-lg font-medium text-gray-900 hover:underline mb-1 group-hover:text-gray-700">
                            ${title}
                        </h3>
                        <div class="text-gray-500 text-sm mb-2">${url}</div>
                        <p class="text-gray-700 text-sm line-height-relaxed mb-2">
                            ${excerpt}
                        </p>
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <span>${formatDate(post.permalink)}</span>
                            ${tags.slice(0, 2).map(tag => `<span class="bg-gray-100 px-2 py-1 rounded">${tag}</span>`).join('')}
                        </div>
                    </a>
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

// Get search excerpt with highlighted search term (Google-style)
function getSearchExcerpt(content, query, maxLength = 120) {
    if (!content) return '';
    
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (!query) {
        return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    
    // Find the first occurrence of the query
    const lowerContent = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index === -1) {
        // If no match found, return first part
        return plainText.substring(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    
    // Calculate excerpt bounds around the search term
    const halfLength = Math.floor((maxLength - query.length) / 2);
    let start = Math.max(0, index - halfLength);
    let end = Math.min(plainText.length, index + query.length + halfLength);
    
    // Adjust if we're at the beginning or end
    if (start === 0) {
        end = Math.min(plainText.length, maxLength);
    } else if (end === plainText.length) {
        start = Math.max(0, plainText.length - maxLength);
    }
    
    // Try to break at word boundaries
    if (start > 0) {
        const nextSpace = plainText.indexOf(' ', start);
        if (nextSpace !== -1 && nextSpace - start < 20) {
            start = nextSpace + 1;
        }
    }
    
    if (end < plainText.length) {
        const prevSpace = plainText.lastIndexOf(' ', end);
        if (prevSpace !== -1 && end - prevSpace < 20) {
            end = prevSpace;
        }
    }
    
    let excerpt = plainText.substring(start, end);
    
    // Add ellipsis
    if (start > 0) excerpt = '...' + excerpt;
    if (end < plainText.length) excerpt += '...';
    
    return highlightText(excerpt, query);
}

// Get excerpt with highlighted search term (legacy function for compatibility)
function getExcerpt(content, query, maxLength = 150) {
    return getSearchExcerpt(content, query, maxLength);
}

// Format date from permalink (full date)
function formatDate(permalink) {
    const match = permalink.match(/(\d{4})(\d{2})\/(\d{2})/);
    if (match) {
        const year = match[1];
        const month = match[2];
        const day = match[3];
        const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');
        
        if (isEnglish) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
        } else {
            return `${year}年${parseInt(month)}月${parseInt(day)}日`;
        }
    }
    return '';
}

// Escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}