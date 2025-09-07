// Sample data for subjects
let lastScrollY = window.scrollY;
const subjects = [
    {
        id: 1,
        name: "Data Structures",
        icon: "fa-sitemap",
        description: "Study of various data organization methods",
        units: 5
    },
    {
        id: 2,
        name: "Data Structures Lab",
        icon: "fa-laptop-code",
        description: "Practical application of data structures concepts",
        units: 5
    },
    {
        id: 3,
        name: "Data Modeling & Visualization",
        icon: "fa-chart-pie",
        description: "Concepts of data modeling and visualization techniques",
        units: 5
    },
    {
        id: 4,
        name: "Data Modeling & Visualization Lab",
        icon: "fa-chart-column",
        description: "Hands-on data visualization and modeling projects",
        units: 5
    },
    {
        id: 5,
        name: "PHP & MySQL",
        icon: "fa-database",
        description: "Introduction to server-side scripting with PHP and MySQL",
        units: 5
    },
    {
        id: 6,
        name: "PHP & MySQL Lab",
        icon: "fa-terminal",
        description: "Practical web development projects using PHP and MySQL",
        units: 5
    },
    {
        id: 7,
        name: "Human & Computer Interaction",
        icon: "fa-handshake",
        description: "Study of user experience and human-computer interfaces",
        units: 5
    },
    {
        id: 8,
        name: "Basics of Nutraceuticals & Cosmeceuticals",
        icon: "fa-seedling",
        description: "Fundamentals of nutrition and cosmetics in health",
        units: 5
    },
];

// Dynamic API URL for development and production
const API_URL = (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If running on Live Server (port 5500) or localhost with port, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '5500' || port === '') {
            return 'http://localhost:3000/api';
        }
    }
    
    // For production (Vercel/Railway), use same origin
    return `${window.location.origin}/api`;
})();

console.log('API URL:', API_URL); // Debug log to verify correct URL

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const myUploadsBtn = document.getElementById('myUploadsBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const subjectModal = document.getElementById('subjectModal');
const myUploadsModal = document.getElementById('myUploadsModal');
const closeButtons = document.querySelectorAll('.close');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const subjectsGrid = document.querySelector('.subjects-grid');
const subjectModalTitle = document.getElementById('subjectModalTitle');
const unitTabs = document.querySelector('.unit-tabs');
const unitContent = document.querySelector('.unit-content');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const heroCta = document.getElementById('heroCta');
// Add this line with the other DOM elements
const darkModeToggle = document.getElementById('darkModeToggle');

// Current state
let currentSubject = null;
let currentUser = null;
let token = localStorage.getItem('token');

// Test API connection
async function testAPIConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend connection successful');
            return true;
        } else {
            console.error('❌ Backend responded with error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Cannot connect to backend:', error.message);
        showNotification('Cannot connect to backend server. Please make sure it\'s running on localhost:3000', 'error');
        return false;
    }
}

// Initialize the application
async function init() {
    console.log('🚀 Initializing EduShare...');
    console.log('Frontend URL:', window.location.origin);
    console.log('Backend API URL:', API_URL);
    
    // Test backend connection
    await testAPIConnection();
    
    await checkUserSession();
    renderSubjects();
    updateNavigation();
    setupEventListeners();
    setupIntersectionObserver();
    loadUserPreferences(); // Add this line
}

async function checkUserSession() {
    token = localStorage.getItem('token');
    if (token) {
        // In a real app, you would verify the token with the server
        // For this demo, we'll assume it's valid
        const userEmail = JSON.parse(atob(token.split('.')[1])).email;
        currentUser = { email: userEmail, name: userEmail.split('@')[0] }; // Simplified user object
    }
}

// Render subject cards
function renderSubjects() {
    subjectsGrid.innerHTML = '';
    
    subjects.forEach(subject => {
        const subjectCard = document.createElement('div');
        subjectCard.className = 'subject-card';
        subjectCard.innerHTML = `
            <div class="subject-icon">
                <i class="fas ${subject.icon}"></i>
            </div>
            <h3>${subject.name}</h3>
            <p>${subject.description}</p>
        `;
        
        subjectCard.addEventListener('click', () => openSubjectModal(subject));
        subjectsGrid.appendChild(subjectCard);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Modal triggers
    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    loginBtn.addEventListener('click', () => openModal(loginModal));
    myUploadsBtn.addEventListener('click', () => openMyUploadsModal());
    registerBtn.addEventListener('click', () => {
        if (currentUser) {
            handleLogout();
        } else {
            openModal(registerModal);
        }
    });
    heroCta.addEventListener('click', () => {
        document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Switch between login and register
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openModal(registerModal);
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openModal(loginModal);
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModals();
        if (e.target === registerModal) closeModals();
        if (e.target === subjectModal) closeModals();
        if (e.target === myUploadsModal) closeModals();
    });
    window.addEventListener('scroll', () => {
    // If the user scrolls down, hide the header
    if (lastScrollY < window.scrollY) {
        document.querySelector('.navbar').style.top = '-80px'; // Adjust this value if your header height is different
    } 
    // If the user scrolls up, show the header
    else {
        document.querySelector('.navbar').style.top = '0';
    }

    lastScrollY = window.scrollY;
    });
    
    // Mobile menu toggle
    hamburger.addEventListener('click', toggleMobileMenu);
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                if (navMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });
}

// Setup Intersection Observer for fade-in effect
function setupIntersectionObserver() {
    const sections = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Open modal
function openModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close all modals
function closeModals() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    subjectModal.style.display = 'none';
    myUploadsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Toggle mobile menu
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await performLogin(email, password);
    closeModals();
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        console.log('Registering user with API:', API_URL); // Debug log
        
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        console.log('Register response status:', response.status); // Debug log
        console.log('Register response headers:', response.headers.get('content-type')); // Debug log

        if (!response.ok) {
            // Try to parse error response
            let errorMessage = 'Registration failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
                errorMessage = `Registration failed (${response.status})`;
            }
            showNotification(errorMessage, 'error');
            return;
        }

        const data = await response.json();
        showNotification(data.message, 'success');
        
        // Automatically log the user in after successful registration
        await performLogin(email, password);
        closeModals();
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please make sure the backend server is running on localhost:3000', 'error');
    }
}

// Function to handle the login process, used by both login and register
async function performLogin(email, password) {
    try {
        console.log('Logging in user with API:', API_URL); // Debug log
        
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', response.status); // Debug log

        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                console.error('Failed to parse login error response:', parseError);
                errorMessage = `Login failed (${response.status})`;
            }
            showNotification(errorMessage, 'error');
            return;
        }

        const data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        currentUser = data.user;
        updateNavigation();
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please make sure the backend server is running on localhost:3000', 'error');
    }
}

// Update navigation based on login state
// Replace the existing updateNavigation function with this code.
function updateNavigation() {
    const loginItem = document.getElementById('loginBtn');
    const registerItem = document.getElementById('registerBtn');
    const myUploadsItem = document.getElementById('myUploadsBtn');

    if (currentUser) {
        // Hide login button, show logout button and my uploads
        loginItem.style.display = 'none';
        myUploadsItem.style.display = 'block';
        registerItem.textContent = 'Logout';
        registerItem.className = 'logout-btn';
    } else {
        // Show login button, hide logout button and my uploads
        loginItem.style.display = 'block';
        myUploadsItem.style.display = 'none';
        registerItem.textContent = 'Register';
        registerItem.className = 'register-btn';
    }
}

// Check if current user is admin
function isCurrentUserAdmin() {
    return currentUser && currentUser.email === 'admin@gmail.com';
}

// Open subject modal
async function openSubjectModal(subject) {
    currentSubject = subject;
    subjectModalTitle.textContent = subject.name;
    
    renderUnitTabs(subject);
    await renderUnitContent(0); // Start with syllabus by default
    
    openModal(subjectModal);
}

// Render unit tabs
function renderUnitTabs(subject) {
    unitTabs.innerHTML = '';
    
    // Add Syllabus tab first
    const syllabusTab = document.createElement('div');
    syllabusTab.className = 'unit-tab active'; // Make syllabus active by default
    syllabusTab.textContent = 'Syllabus';
    syllabusTab.addEventListener('click', async () => {
        document.querySelectorAll('.unit-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        syllabusTab.classList.add('active');
        await renderUnitContent(0); // Use 0 for syllabus
    });
    unitTabs.appendChild(syllabusTab);
    
    // Add regular unit tabs
    for (let i = 1; i <= subject.units; i++) {
        const unitTab = document.createElement('div');
        unitTab.className = 'unit-tab';
        unitTab.textContent = `Unit ${i}`;
        unitTab.addEventListener('click', async () => {
            document.querySelectorAll('.unit-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            unitTab.classList.add('active');
            await renderUnitContent(i);
        });
        
        unitTabs.appendChild(unitTab);
    }
}

// Render unit content
async function renderUnitContent(unitNumber) {
    const fileListElement = document.createElement('div');
    fileListElement.className = 'file-list';
    fileListElement.innerHTML = `<h4>Available Materials</h4><p>Loading files...</p>`;

    const isSyllabus = unitNumber === 0;
    const sectionTitle = isSyllabus ? 'Syllabus Materials' : 'Upload Study Material';
    const canUpload = isSyllabus ? (token && isCurrentUserAdmin()) : token;
    
    unitContent.innerHTML = `
        <div class="upload-section">
            <h4>${sectionTitle}</h4>
            ${canUpload ? `
                <form class="upload-form" id="uploadForm">
                    <input type="text" name="title" placeholder="File Title" required>
                    <textarea name="description" placeholder="Description" required></textarea>
                    <input type="file" name="file" accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt" required>
                    <button type="submit">Upload</button>
                </form>
            ` : isSyllabus ? 
                '<p>Only admin@gmail.com can upload syllabus materials</p>' : 
                '<p>Please login to upload study materials</p>'}
        </div>
    `;
    unitContent.appendChild(fileListElement);

    if (canUpload) {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => handleFileUpload(e, unitNumber));
        }
    }

    try {
        console.log('Fetching files from:', `${API_URL}/files`); // Debug log
        const response = await fetch(`${API_URL}/files`);

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
            console.error('Response not ok:', response.status, response.statusText);
            throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
        }

        const files = await response.json();
        console.log('All files from API:', files);
        console.log('Current subject ID:', currentSubject.id);
        console.log('Current unit:', unitNumber);
        
        // Filter files by current subject and unit
        const unitFiles = files.filter(file => {
            const subjectMatch = parseInt(file.subjectId) === parseInt(currentSubject.id);
            const unitMatch = parseInt(file.unit) === parseInt(unitNumber);
            
            console.log(`File: ${file.title}, SubjectId: ${file.subjectId} (match: ${subjectMatch}), Unit: ${file.unit} (match: ${unitMatch})`);
            
            return subjectMatch && unitMatch;
        });

        console.log('Filtered unit files:', unitFiles);

        if (unitFiles.length > 0) {
            const filesHtml = unitFiles.map(file => {
                const downloadPath = file.path.replace(/\\/g, '/');
                const canDelete = token && isCurrentUserAdmin();
                
                return `
                    <div class="file-item">
                        <div class="file-info">
                            <h5>${file.title}</h5>
                            <p>Uploaded by: ${file.uploadedBy} | ${new Date(file.date).toLocaleDateString()}</p>
                            <p class="file-description">${file.description}</p>
                        </div>
                        <div class="file-actions">
                            ${token ? 
                                `<a href="${API_URL}/download/${file.filename}" class="download-link">Download</a>` :
                                '<span class="login-required">Login to download</span>'
                            }
                            ${canDelete ? 
                                `<button class="delete-file-btn" onclick="deleteFileFromUnit('${file.id}', '${file.title}')">Delete</button>` : 
                                ''
                            }
                        </div>
                    </div>
                `;
            }).join('');
            fileListElement.innerHTML = `<h4>Available Materials</h4>${filesHtml}`;
        } else {
            const noFilesMessage = isSyllabus ? 
                'No syllabus materials available yet.' : 
                'No materials available for this unit yet.';
            fileListElement.innerHTML = `<h4>Available Materials</h4><p>${noFilesMessage}</p>`;
        }
    } catch (error) {
        console.error('Error fetching files:', error);
        fileListElement.innerHTML = `<h4>Available Materials</h4><p>Error loading files: ${error.message}</p>`;
    }
}

// Handle file upload
async function handleFileUpload(e, unitNumber) {
    e.preventDefault();
    
    if (!token) {
        showNotification('Please login to upload files', 'error');
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);

    // Add subject and unit information to FormData - ensure they're the correct types
    formData.append('subjectId', parseInt(currentSubject.id));
    formData.append('unit', parseInt(unitNumber));
    
    // Ensure the current user's email is sent for proper file association
    formData.append('uploadedBy', currentUser.email);
    
    console.log('Uploading file with subjectId:', currentSubject.id, 'and unit:', unitNumber); // Debug log
    
    try {
        const response = await fetch(`${API_URL}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message, 'success');
            renderUnitContent(unitNumber); // Refresh the unit content
            form.reset();
        } else {
            showNotification(data.message || 'File upload failed', 'error');
        }
    } catch (error) {
        showNotification('File upload failed. Please try again.', 'error');
        console.error('File upload error:', error);
    }
}

// Delete file from unit view (admin only)
async function deleteFileFromUnit(fileId, fileName) {
    if (!isCurrentUserAdmin()) {
        showNotification('Only admin@gmail.com can delete files', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            showNotification(data.message || 'File deleted successfully', 'success');
            // Refresh current unit content
            const activeTab = document.querySelector('.unit-tab.active');
            const unitNumber = activeTab.textContent === 'Syllabus' ? 0 : parseInt(activeTab.textContent.replace('Unit ', ''));
            await renderUnitContent(unitNumber);
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to delete file', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Failed to delete file. Please try again.', 'error');
    }
}

// Open My Uploads modal
async function openMyUploadsModal() {
    openModal(myUploadsModal);
    await loadUserUploads();
}

// Load user's uploads
async function loadUserUploads() {
    const uploadsContent = document.querySelector('.uploads-content');
    
    if (!uploadsContent) {
        console.error('uploads-content element not found');
        return;
    }
    
    uploadsContent.innerHTML = '<div class="uploads-loading">Loading uploads...</div>';
    
    try {
        console.log('Fetching uploads from:', `${API_URL}/files`); // Debug log
        const response = await fetch(`${API_URL}/files`);

        console.log('Uploads response status:', response.status); // Debug log

        if (!response.ok) {
            console.error('Failed to fetch uploads:', response.status, response.statusText);
            throw new Error(`Failed to fetch uploads: ${response.status} ${response.statusText}`);
        }

        const allFiles = await response.json();
        console.log('All files for uploads:', allFiles); // Debug log
        
        // Admin sees all files, regular users see only their files
        const userUploads = isCurrentUserAdmin() ? 
            allFiles : 
            allFiles.filter(file => file.uploadedBy === currentUser.email);
        
        renderUserUploads(userUploads);
    } catch (error) {
        console.error('Error fetching uploads:', error);
        uploadsContent.innerHTML = `<div class="uploads-loading">Error loading uploads: ${error.message}</div>`;
    }
}

// Render user uploads (admin sees all, users see only their own)
function renderUserUploads(uploads) {
    const uploadsContent = document.querySelector('.uploads-content');
    
    if (!currentUser) {
        uploadsContent.innerHTML = `
            <div class="no-uploads">
                <i class="fas fa-lock"></i>
                <h3>Login Required</h3>
                <p>Please login to view your uploads.</p>
            </div>
        `;
        return;
    }
    
    if (uploads.length === 0) {
        const message = isCurrentUserAdmin() ? 
            'No files have been uploaded to the system yet.' :
            'You haven\'t uploaded any files yet. Start sharing your study materials!';
            
        uploadsContent.innerHTML = `
            <div class="no-uploads">
                <i class="fas fa-file-upload"></i>
                <h3>No uploads yet</h3>
                <p>${message}</p>
            </div>
        `;
        return;
    }

    // Show files based on user type
    const uploadsHtml = uploads.map(upload => {
        const subject = subjects.find(s => s.id === upload.subjectId);
        const subjectName = subject ? subject.name : 'Unknown Subject';
        const fileId = upload._id || upload.id || upload.fileId;
        const downloadPath = upload.path.replace(/\\/g, '/');
        const unitDisplay = upload.unit === 0 ? 'Syllabus' : `Unit ${upload.unit}`;
        const canDelete = isCurrentUserAdmin() || upload.uploadedBy === currentUser.email;
        
        return `
            <div class="upload-item">
                <div class="upload-header">
                    <div class="upload-info">
                        <h4>${upload.title}</h4>
                        <div class="upload-meta">
                            <span><i class="fas fa-book"></i> ${subjectName}</span>
                            <span><i class="fas fa-layer-group"></i> ${unitDisplay}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(upload.date).toLocaleDateString()}</span>
                            ${isCurrentUserAdmin() ? `<span><i class="fas fa-user"></i> ${upload.uploadedBy}</span>` : ''}
                            <span><i class="fas fa-file"></i> ${upload.filename}</span>
                        </div>
                    </div>
                </div>
                <div class="upload-description">${upload.description}</div>
                <div class="upload-actions">
                    <a href="${API_URL}/download/${upload.filename}" class="action-btn download-btn">
                        <i class="fas fa-download"></i> Download
                    </a>
                    ${canDelete ? `
                        <button class="action-btn delete-btn" onclick="deleteUpload('${fileId}', '${upload.title}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    uploadsContent.innerHTML = `<div class="uploads-grid">${uploadsHtml}</div>`;
}

// Delete upload (admin can delete any file, users can only delete their own)
async function deleteUpload(fileId, fileName) {
    if (!fileId || fileId === 'undefined') {
        showNotification('Error: File ID not found. Cannot delete file.', 'error');
        console.error('Invalid file ID:', fileId);
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        console.log('Attempting to delete file with ID:', fileId); // Debug log
        
        const response = await fetch(`${API_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Delete response status:', response.status); // Debug log

        if (response.ok) {
            const data = await response.json();
            showNotification(data.message || 'File deleted successfully', 'success');
            await loadUserUploads(); // Refresh the uploads list
        } else if (response.status === 404) {
            showNotification('Error: Delete endpoint not found. Please check your backend configuration.', 'error');
            console.error('Backend DELETE endpoint missing. Expected: DELETE /api/files/:id');
        } else {
            // Try to get error message from response
            try {
                const errorData = await response.json();
                console.log('Error response:', errorData); // Debug log
                showNotification(errorData.message || 'Failed to delete file', 'error');
            } catch (jsonError) {
                console.log('Could not parse error response as JSON'); // Debug log
                showNotification(`Failed to delete file (Status: ${response.status})`, 'error');
            }
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Network error: Failed to delete file. Please try again.', 'error');
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('token');
    token = null; // Also clear the global token variable
    updateNavigation();
    showNotification('Logged out successfully', 'success');
}

// Show notification
function showNotification(message, type) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';
    notification.style.zIndex = '3000';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    
    if (type === 'success') {
        notification.style.background = '#4caf50';
    } else {
        notification.style.background = '#f44336';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Function to load and apply user's dark mode preference
function loadUserPreferences() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Toggle dark mode and save preference
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
