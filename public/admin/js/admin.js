// Casa Ignat CMS - Admin JavaScript

(function() {
    'use strict';

    // Toggle user menu
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userMenu = document.querySelector('.user-menu');

    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });

        document.addEventListener('click', function() {
            userMenu.classList.remove('active');
        });
    }

    // Toggle sidebar on mobile
    const sidebarToggleMobile = document.querySelector('.sidebar-toggle-mobile');
    const sidebar = document.querySelector('.admin-sidebar');

    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close alerts
    const alertCloseButtons = document.querySelectorAll('.alert-close');
    alertCloseButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.style.opacity = '0';
            setTimeout(function() {
                alert.remove();
            }, 300);
        });
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const closeButton = alert.querySelector('.alert-close');
            if (closeButton) {
                closeButton.click();
            }
        }, 5000);
    });

    // Confirm delete actions
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            const message = this.dataset.confirmDelete || 'Sigur doriți să ștergeți acest element?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // Form auto-save (for specific forms)
    const autoSaveForms = document.querySelectorAll('[data-autosave]');
    autoSaveForms.forEach(function(form) {
        let timeout;
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(function(input) {
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    const formData = new FormData(form);
                    const csrfToken = form.querySelector('input[name="_csrf"]')?.value;

                    fetch(form.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    }).then(function(response) {
                        if (response.ok) {
                            showNotification('Salvat automat', 'success');
                        }
                    }).catch(function(error) {
                        console.error('Auto-save error:', error);
                    });
                }, 2000);
            });
        });
    });

    // Show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible`;
        notification.style.position = 'fixed';
        notification.style.top = '1rem';
        notification.style.right = '1rem';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.innerHTML = `
            <button type="button" class="alert-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
            <div class="alert-content">
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(notification);

        notification.querySelector('.alert-close').addEventListener('click', function() {
            notification.style.opacity = '0';
            setTimeout(function() {
                notification.remove();
            }, 300);
        });

        setTimeout(function() {
            notification.querySelector('.alert-close').click();
        }, 3000);
    }

    // Table sorting
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(function(header) {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            const isAscending = this.classList.contains('sort-asc');
            this.classList.toggle('sort-asc', !isAscending);
            this.classList.toggle('sort-desc', isAscending);

            rows.sort(function(a, b) {
                const aValue = a.querySelector(`td[data-sort="${column}"]`)?.textContent || '';
                const bValue = b.querySelector(`td[data-sort="${column}"]`)?.textContent || '';

                if (isAscending) {
                    return bValue.localeCompare(aValue);
                } else {
                    return aValue.localeCompare(bValue);
                }
            });

            rows.forEach(function(row) {
                tbody.appendChild(row);
            });
        });
    });

    // Image preview
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    imageInputs.forEach(function(input) {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    let preview = input.parentElement.querySelector('.image-preview');
                    if (!preview) {
                        preview = document.createElement('img');
                        preview.className = 'image-preview';
                        preview.style.maxWidth = '200px';
                        preview.style.marginTop = '0.5rem';
                        preview.style.borderRadius = '0.375rem';
                        input.parentElement.appendChild(preview);
                    }
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Utility: Format date
    window.formatDate = function(date) {
        return new Date(date).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Utility: Format price
    window.formatPrice = function(price) {
        return new Intl.NumberFormat('ro-RO', {
            style: 'currency',
            currency: 'RON'
        }).format(price);
    };

})();
