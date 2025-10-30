// Media Management System for Thai Exotic Plants

class MediaManager {
    constructor() {
        this.mediaItems = [];
        this.selectedItems = [];
        this.currentFilter = 'all'; // all, image, video
        this.uploadQueue = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    }

    // Initialize media manager
    initialize() {
        this.loadMediaItems();
        this.setupEventListeners();
        this.setupDropZone();
    }

    // Setup event listeners
    setupEventListeners() {
        // File input change
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }

        // Filter buttons
        document.querySelectorAll('.media-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-media');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAll(e.target.checked);
            });
        }

        // Bulk actions
        document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
            this.bulkDelete();
        });

        document.getElementById('bulk-download-btn')?.addEventListener('click', () => {
            this.bulkDownload();
        });
    }

    // Setup drag and drop zone
    setupDropZone() {
        const dropZone = document.querySelector('.border-dashed');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-plant-green', 'bg-green-50');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-plant-green', 'bg-green-50');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Load media items
    async loadMediaItems() {
        try {
            // Try to load from server first
            const response = await fetch('/tables/media_items?limit=1000');
            if (response.ok) {
                const result = await response.json();
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    // Convert DB fields to match frontend format
                    this.mediaItems = result.data.map(item => ({
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        type: item.type,
                        size: item.size || 0,
                        uploadDate: new Date(item.created_at).getTime(),
                        alt: item.alt_text || '',
                        tags: item.tags || []
                    }));
                    // Save to localStorage for offline access
                    localStorage.setItem('thaiPlantsMediaItems', JSON.stringify(this.mediaItems));
                    this.renderMediaGallery();
                    return;
                }
            }

            // Try to load from localStorage if server fails
            const stored = localStorage.getItem('thaiPlantsMediaItems');
            if (stored) {
                // Migrate any legacy blob: URLs to null so they don't break on reload
                const parsed = JSON.parse(stored);
                this.mediaItems = Array.isArray(parsed) ? parsed.map(item => {
                    if (item && typeof item.url === 'string' && item.url.startsWith('blob:')) {
                        // Drop invalid blob URLs from previous sessions
                        return { ...item, url: null };
                    }
                    return item;
                }).filter(item => item.url) : []; // Filter out items with null urls
                this.renderMediaGallery();
                return;
            }

            // If no data at all, start with empty array
            this.mediaItems = [];
            this.renderMediaGallery();
        } catch (error) {
            console.error('Error loading media items:', error);
            // Try localStorage as fallback
            try {
                const stored = localStorage.getItem('thaiPlantsMediaItems');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.mediaItems = Array.isArray(parsed) ? parsed.filter(item => item && item.url && !item.url.startsWith('blob:')) : [];
                } else {
                    this.mediaItems = [];
                }
            } catch (e) {
                this.mediaItems = [];
            }
            this.renderMediaGallery();
        }
    }

    // Save media items to localStorage
    saveMediaItems() {
        try {
            localStorage.setItem('thaiPlantsMediaItems', JSON.stringify(this.mediaItems));
            // Also save to server
            this.syncDataToServer('mediaItems', this.mediaItems);
        } catch (error) {
            console.error('Error saving media items:', error);
        }
    }

    // Sync data to server
    async syncDataToServer(type, data) {
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    data: data
                })
            });
            
            if (response.ok) {
                console.log(`${type} data synced to server successfully`);
            } else {
                console.warn(`Failed to sync ${type} data to server`);
            }
        } catch (error) {
            console.error(`Error syncing ${type} data to server:`, error);
        }
    }

    // Get mock media items for demonstration
    async getMockMediaItems() {
        return [
            {
                id: '1',
                name: 'monstera-thai-constellation.jpg',
                url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
                type: 'image',
                size: 1024000,
                uploadDate: Date.now() - 86400000,
                alt: '몬스테라 타이 컨스텔레이션',
                tags: ['몬스테라', '희귀식물']
            },
            {
                id: '2',
                name: 'philodendron-pink-princess.jpg',
                url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
                type: 'image',
                size: 856000,
                uploadDate: Date.now() - 172800000,
                alt: '필로덴드론 핑크 프린세스',
                tags: ['필로덴드론', '핑크']
            },
            {
                id: '3',
                name: 'aglaonema-red.jpg',
                url: 'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400',
                type: 'image',
                size: 723000,
                uploadDate: Date.now() - 259200000,
                alt: '아글라오네마 레드',
                tags: ['아글라오네마', '관엽식물']
            },
            {
                id: '4',
                name: 'haworthia-cooperi.jpg',
                url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
                type: 'image',
                size: 562000,
                uploadDate: Date.now() - 345600000,
                alt: '하월시아 쿠페리',
                tags: ['하월시아', '다육식물']
            }
        ];
    }

    // Handle file selection
    async handleFileSelection(files) {
        if (!files || files.length === 0) return;

        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        // Show validation errors
        if (errors.length > 0) {
            showNotification(`파일 검증 오류:\n${errors.join('\n')}`, 'error');
        }

        // Process valid files
        if (validFiles.length > 0) {
            await this.uploadFiles(validFiles);
        }
    }

    // Validate file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `파일 크기가 너무 큽니다 (최대 ${this.formatFileSize(this.maxFileSize)})`
            };
        }

        // Check file type
        const isImage = this.allowedImageTypes.includes(file.type);
        const isVideo = this.allowedVideoTypes.includes(file.type);

        if (!isImage && !isVideo) {
            return {
                isValid: false,
                error: '지원되지 않는 파일 형식입니다'
            };
        }

        return { isValid: true };
    }

    // Upload files
    async uploadFiles(files) {
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('upload-progress-fill');
        const statusText = document.getElementById('upload-status');

        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i) / files.length) * 100;

                if (progressFill) progressFill.style.width = progress + '%';
                if (statusText) statusText.textContent = `업로드 중... ${i + 1}/${files.length}`;

                await this.uploadSingleFile(file);
            }

            if (progressFill) progressFill.style.width = '100%';
            if (statusText) statusText.textContent = '업로드 완료!';

            setTimeout(() => {
                if (progressContainer) progressContainer.classList.add('hidden');
            }, 2000);

            showNotification(`${files.length}개 파일이 성공적으로 업로드되었습니다.`, 'success');
            this.renderMediaGallery();

        } catch (error) {
            console.error('Upload error:', error);
            showNotification('파일 업로드 중 오류가 발생했습니다.', 'error');
            if (progressContainer) progressContainer.classList.add('hidden');
        }
    }

    // Upload single file (simulated)
    async uploadSingleFile(file) {
        // Simulate upload process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Convert file to base64 for persistent storage
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                url: e.target.result, // Base64 data URL
                type: file.type.startsWith('image/') ? 'image' : 'video',
                size: file.size,
                uploadDate: Date.now(),
                alt: file.name.split('.')[0],
                tags: []
            };
            
            this.mediaItems.unshift(mediaItem);
            this.saveMediaItems();
        };
        reader.readAsDataURL(file);
        
        return null; // Will be handled by the reader.onload callback
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button styles
        document.querySelectorAll('.media-filter-btn').forEach(btn => {
            btn.classList.remove('bg-plant-green', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });

        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
            activeBtn.classList.add('bg-plant-green', 'text-white');
        }

        this.renderMediaGallery();
    }

    // Render media gallery
    renderMediaGallery() {
        const gallery = document.getElementById('media-gallery');
        if (!gallery) return;

        let filteredItems = this.mediaItems;
        if (this.currentFilter !== 'all') {
            filteredItems = this.mediaItems.filter(item => item.type === this.currentFilter);
        }

        if (filteredItems.length === 0) {
            gallery.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-images text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">미디어 파일이 없습니다.</p>
                    <p class="text-gray-400 text-sm">파일을 업로드하여 갤러리를 만드세요.</p>
                </div>
            `;
            return;
        }

        gallery.innerHTML = `
            <!-- Gallery Controls -->
            <div class="col-span-full mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="select-all-media" class="mr-2">
                            <span class="text-sm">전체 선택</span>
                        </label>
                        <div class="flex space-x-2">
                            <button data-filter="all" class="media-filter-btn bg-plant-green text-white px-3 py-1 rounded text-sm">
                                전체 (${this.mediaItems.length})
                            </button>
                            <button data-filter="image" class="media-filter-btn bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                                이미지 (${this.mediaItems.filter(item => item.type === 'image').length})
                            </button>
                            <button data-filter="video" class="media-filter-btn bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                                동영상 (${this.mediaItems.filter(item => item.type === 'video').length})
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button id="bulk-download-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition duration-200 disabled:opacity-50" disabled>
                            <i class="fas fa-download mr-2"></i>다운로드
                        </button>
                        <button id="bulk-delete-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition duration-200 disabled:opacity-50" disabled>
                            <i class="fas fa-trash mr-2"></i>삭제
                        </button>
                    </div>
                </div>
            </div>

            ${filteredItems.map(item => this.renderMediaItem(item)).join('')}
        `;

        // Re-setup event listeners for new elements
        this.setupGalleryEventListeners();
    }

    // Render individual media item
    renderMediaItem(item) {
        const isSelected = this.selectedItems.includes(item.id);
        
        return `
            <div class="media-item relative bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-plant-green' : ''}" 
                 data-id="${item.id}">
                <!-- Selection checkbox -->
                <div class="absolute top-2 left-2 z-10">
                    <input type="checkbox" class="media-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
                </div>

                <!-- Media preview -->
                <div class="media-preview aspect-square cursor-pointer" onclick="mediaManager.viewMedia('${item.id}')">
                    ${item.type === 'image' ? `
                        <img src="${item.url}" alt="${item.alt}" class="w-full h-full object-cover">
                    ` : `
                        <div class="relative w-full h-full bg-gray-900">
                            <video class="w-full h-full object-cover">
                                <source src="${item.url}" type="video/mp4">
                            </video>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="bg-black bg-opacity-50 rounded-full p-3">
                                    <i class="fas fa-play text-white text-xl"></i>
                                </div>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Media info -->
                <div class="p-3">
                    <div class="text-sm font-medium text-gray-900 truncate" title="${item.name}">
                        ${item.name}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${this.formatFileSize(item.size)} • ${new Date(item.uploadDate).toLocaleDateString('ko-KR')}
                    </div>
                    
                    ${item.tags && item.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${item.tags.slice(0, 2).map(tag => `
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>
                            `).join('')}
                            ${item.tags.length > 2 ? `
                                <span class="text-xs text-gray-400">+${item.tags.length - 2}</span>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Actions -->
                    <div class="flex justify-between items-center mt-3">
                        <button onclick="mediaManager.copyUrl('${item.id}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm" title="URL 복사">
                            <i class="fas fa-link mr-1"></i>복사
                        </button>
                        <div class="flex space-x-2">
                            <button onclick="mediaManager.editMedia('${item.id}')" 
                                    class="text-gray-600 hover:text-gray-800" title="편집">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="mediaManager.deleteMedia('${item.id}')" 
                                    class="text-red-600 hover:text-red-800" title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listeners for gallery items
    setupGalleryEventListeners() {
        // Media checkboxes
        document.querySelectorAll('.media-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.dataset.id;
                if (e.target.checked) {
                    this.selectedItems.push(itemId);
                } else {
                    this.selectedItems = this.selectedItems.filter(id => id !== itemId);
                }
                this.updateBulkActionButtons();
                this.updateSelectAllCheckbox();
            });
        });

        // Filter buttons
        document.querySelectorAll('.media-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-media');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAll(e.target.checked);
            });
        }

        // Bulk action buttons
        document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
            this.bulkDelete();
        });

        document.getElementById('bulk-download-btn')?.addEventListener('click', () => {
            this.bulkDownload();
        });
    }

    // Update bulk action buttons
    updateBulkActionButtons() {
        const deleteBtn = document.getElementById('bulk-delete-btn');
        const downloadBtn = document.getElementById('bulk-download-btn');
        
        const hasSelection = this.selectedItems.length > 0;
        
        if (deleteBtn) {
            deleteBtn.disabled = !hasSelection;
        }
        if (downloadBtn) {
            downloadBtn.disabled = !hasSelection;
        }
    }

    // Update select all checkbox
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-media');
        if (selectAllCheckbox) {
            const allItems = this.getCurrentFilteredItems();
            const allSelected = allItems.length > 0 && allItems.every(item => this.selectedItems.includes(item.id));
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = this.selectedItems.length > 0 && !allSelected;
        }
    }

    // Get currently filtered items
    getCurrentFilteredItems() {
        if (this.currentFilter === 'all') {
            return this.mediaItems;
        }
        return this.mediaItems.filter(item => item.type === this.currentFilter);
    }

    // Select all items
    selectAll(selected) {
        const filteredItems = this.getCurrentFilteredItems();
        
        if (selected) {
            // Add all filtered items to selection
            filteredItems.forEach(item => {
                if (!this.selectedItems.includes(item.id)) {
                    this.selectedItems.push(item.id);
                }
            });
        } else {
            // Remove all filtered items from selection
            this.selectedItems = this.selectedItems.filter(id => 
                !filteredItems.some(item => item.id === id)
            );
        }
        
        this.updateBulkActionButtons();
        this.renderMediaGallery();
    }

    // View media in modal
    viewMedia(itemId) {
        const item = this.mediaItems.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content max-w-4xl">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-thai-green">${item.name}</h2>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="text-center mb-6">
                    ${item.type === 'image' ? `
                        <img src="${item.url}" alt="${item.alt}" class="max-w-full max-h-96 mx-auto rounded-lg">
                    ` : `
                        <video controls class="max-w-full max-h-96 mx-auto rounded-lg">
                            <source src="${item.url}" type="video/mp4">
                        </video>
                    `}
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold mb-2">파일 정보</h4>
                        <dl class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-gray-500">파일명:</dt>
                                <dd class="font-medium">${item.name}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-500">크기:</dt>
                                <dd>${this.formatFileSize(item.size)}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-500">업로드일:</dt>
                                <dd>${new Date(item.uploadDate).toLocaleString('ko-KR')}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-500">형식:</dt>
                                <dd class="uppercase">${item.type}</dd>
                            </div>
                        </dl>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-2">URL</h4>
                        <div class="flex items-center space-x-2">
                            <input type="text" value="${item.url}" readonly 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <button onclick="mediaManager.copyUrl('${item.id}')" 
                                    class="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition duration-200">
                                복사
                            </button>
                        </div>
                        
                        ${item.tags ? `
                            <h4 class="font-semibold mt-4 mb-2">태그</h4>
                            <div class="flex flex-wrap gap-1">
                                ${item.tags.map(tag => `
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">${tag}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 mt-6">
                    <button onclick="mediaManager.downloadMedia('${item.id}')" 
                            class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                        <i class="fas fa-download mr-2"></i>다운로드
                    </button>
                    <button onclick="mediaManager.editMedia('${item.id}'); closeModal();" 
                            class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                        <i class="fas fa-edit mr-2"></i>편집
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Copy media URL to clipboard
    async copyUrl(itemId) {
        const item = this.mediaItems.find(i => i.id === itemId);
        if (!item) return;

        try {
            await navigator.clipboard.writeText(item.url);
            showNotification('URL이 클립보드에 복사되었습니다.', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            showNotification('URL 복사에 실패했습니다.', 'error');
        }
    }

    // Edit media metadata
    editMedia(itemId) {
        const item = this.mediaItems.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-thai-green">미디어 편집</h2>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="edit-media-form" class="space-y-4">
                    <div>
                        <label class="form-label">파일명</label>
                        <input type="text" name="name" value="${item.name}" class="form-input">
                    </div>
                    
                    <div>
                        <label class="form-label">대체 텍스트</label>
                        <input type="text" name="alt" value="${item.alt || ''}" class="form-input" 
                               placeholder="이미지 설명을 입력하세요">
                    </div>
                    
                    <div>
                        <label class="form-label">태그</label>
                        <input type="text" name="tags" value="${item.tags ? item.tags.join(', ') : ''}" 
                               class="form-input" placeholder="태그를 쉼표로 구분하여 입력하세요">
                    </div>
                </form>
                
                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="closeModal()" 
                            class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                        취소
                    </button>
                    <button type="button" onclick="mediaManager.saveMediaEdit('${itemId}')" 
                            class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                        저장
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Save media edit
    async saveMediaEdit(itemId) {
        const form = document.getElementById('edit-media-form');
        const formData = new FormData(form);

        const itemIndex = this.mediaItems.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        this.mediaItems[itemIndex] = {
            ...this.mediaItems[itemIndex],
            name: formData.get('name'),
            alt: formData.get('alt'),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
        };

        // Save to localStorage and sync to server
        this.saveMediaItems();

        showNotification('미디어 정보가 업데이트되었습니다.', 'success');
        closeModal();
        this.renderMediaGallery();
    }

    // Delete single media item
    async deleteMedia(itemId) {
        if (!confirm('이 미디어를 삭제하시겠습니까?')) return;

        // If itemId is numeric, delete from server
        if (typeof itemId === 'number' || (typeof itemId === 'string' && /^\d+$/.test(itemId))) {
            try {
                const response = await fetch(`/api/media-items/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.warn('Failed to delete from server, continuing with local delete');
                }
            } catch (error) {
                console.error('Error deleting from server:', error);
            }
        }

        // Delete from local state
        this.mediaItems = this.mediaItems.filter(item => item.id !== itemId);
        this.selectedItems = this.selectedItems.filter(id => id !== itemId);

        // Save changes to localStorage
        localStorage.setItem('thaiPlantsMediaItems', JSON.stringify(this.mediaItems));

        showNotification('미디어가 삭제되었습니다.', 'success');
        this.renderMediaGallery();
    }

    // Download media
    downloadMedia(itemId) {
        const item = this.mediaItems.find(i => i.id === itemId);
        if (!item) return;

        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.name;
        link.click();
    }

    // Bulk delete
    async bulkDelete() {
        if (this.selectedItems.length === 0) return;

        if (!confirm(`선택된 ${this.selectedItems.length}개 미디어를 삭제하시겠습니까?`)) return;

        // Filter numeric IDs for server deletion
        const numericIds = this.selectedItems.filter(id =>
            typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))
        ).map(id => parseInt(id, 10));

        // Delete from server if there are numeric IDs
        if (numericIds.length > 0) {
            try {
                const response = await fetch('/api/media-items/bulk-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ids: numericIds })
                });

                if (!response.ok) {
                    console.warn('Failed to bulk delete from server, continuing with local delete');
                }
            } catch (error) {
                console.error('Error bulk deleting from server:', error);
            }
        }

        // Delete from local state
        this.mediaItems = this.mediaItems.filter(item => !this.selectedItems.includes(item.id));
        const deletedCount = this.selectedItems.length;
        this.selectedItems = [];

        // Save changes to localStorage
        localStorage.setItem('thaiPlantsMediaItems', JSON.stringify(this.mediaItems));

        showNotification(`${deletedCount}개 미디어가 삭제되었습니다.`, 'success');
        this.renderMediaGallery();
    }

    // Bulk download
    async bulkDownload() {
        if (this.selectedItems.length === 0) return;
        
        showNotification(`${this.selectedItems.length}개 파일 다운로드를 시작합니다.`, 'info');
        
        for (const itemId of this.selectedItems) {
            const item = this.mediaItems.find(i => i.id === itemId);
            if (item) {
                this.downloadMedia(itemId);
                // Add small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Global instance
let mediaManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    mediaManager = new MediaManager();
    
    // Initialize only if we're on the media management page
    if (document.getElementById('media-gallery')) {
        mediaManager.initialize();
    }
});