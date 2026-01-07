// Aplikasi Daftar Tugas
document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const taskForm = document.getElementById('taskForm');
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDate = document.getElementById('taskDate');
    const taskPriority = document.getElementById('taskPriority');
    const taskList = document.getElementById('taskList');
    const emptyTaskMessage = document.getElementById('emptyTaskMessage');
    const searchTask = document.getElementById('searchTask');
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const displayedTasksElement = document.getElementById('displayedTasks');
    const totalFilteredTasksElement = document.getElementById('totalFilteredTasks');
    const titleError = document.getElementById('titleError');
    const dateError = document.getElementById('dateError');
    const titleCount = document.getElementById('titleCount');
    const descCount = document.getElementById('descCount');
    
    // Set tanggal minimum ke hari ini
    const today = new Date().toISOString().split('T')[0];
    taskDate.min = today;
    taskDate.value = today;
    
    // State aplikasi
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = {
        status: 'all',
        priority: 'all',
        search: ''
    };
    
    // Inisialisasi aplikasi
    initApp();
    
    // Fungsi inisialisasi
    function initApp() {
        updateTaskCounters();
        renderTasks();
        
        // Event Listeners
        taskForm.addEventListener('submit', handleAddTask);
        clearFormBtn.addEventListener('click', clearForm);
        searchTask.addEventListener('input', handleSearch);
        filterStatus.addEventListener('change', handleFilterChange);
        filterPriority.addEventListener('change', handleFilterChange);
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        deleteAllBtn.addEventListener('click', deleteAllTasks);
        taskTitle.addEventListener('input', updateTitleCount);
        taskDescription.addEventListener('input', updateDescCount);
        
        // Update counters saat input
        updateTitleCount();
        updateDescCount();
    }
    
    // Fungsi untuk menambah tugas baru
    function handleAddTask(e) {
        e.preventDefault();
        
        // Validasi form dengan notifikasi interaktif
        if (!validateFormWithNotification()) {
            return;
        }
        
        // Konfirmasi sebelum menambahkan tugas
        showConfirmationDialog(
            "Konfirmasi Tambah Tugas",
            `Apakah Anda yakin ingin menambahkan tugas berikut?\n\nJudul: ${taskTitle.value}\nPrioritas: ${getPriorityText(taskPriority.value)}\nDeadline: ${formatDateForDisplay(taskDate.value)}`,
            "Ya, Tambahkan",
            "Batal"
        ).then((confirmed) => {
            if (confirmed) {
                // Buat objek tugas baru
                const newTask = {
                    id: Date.now().toString(),
                    title: taskTitle.value.trim(),
                    description: taskDescription.value.trim(),
                    date: taskDate.value,
                    priority: taskPriority.value,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                // Tambahkan tugas ke array
                tasks.unshift(newTask);
                
                // Simpan ke localStorage
                saveTasks();
                
                // Render ulang daftar tugas
                renderTasks();
                
                // Reset form
                taskForm.reset();
                taskDate.value = today;
                taskPriority.value = 'medium';
                
                // Reset error dan counter
                titleError.classList.add('hidden');
                dateError.classList.add('hidden');
                updateTitleCount();
                updateDescCount();
                
                // Feedback sukses dengan notifikasi interaktif
                showSuccessNotification('Tugas berhasil ditambahkan!', 'Selamat! Tugas Anda telah berhasil disimpan.');
            } else {
                showInfoNotification('Penambahan Dibatalkan', 'Tugas tidak ditambahkan. Anda dapat mengubah data terlebih dahulu.');
            }
        });
    }
    
    // Fungsi validasi form dengan notifikasi interaktif
    function validateFormWithNotification() {
        let errors = [];
        
        // Validasi judul
        if (!taskTitle.value.trim()) {
            errors.push('Judul tugas harus diisi');
            titleError.textContent = 'Judul tugas harus diisi';
            titleError.classList.remove('hidden');
            taskTitle.classList.add('border-red-500');
        } else if (taskTitle.value.trim().length < 3) {
            errors.push('Judul tugas minimal 3 karakter');
            titleError.textContent = 'Judul tugas minimal 3 karakter';
            titleError.classList.remove('hidden');
            taskTitle.classList.add('border-red-500');
        } else {
            titleError.classList.add('hidden');
            taskTitle.classList.remove('border-red-500');
        }
        
        // Validasi tanggal
        const selectedDate = new Date(taskDate.value);
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        
        if (!taskDate.value) {
            errors.push('Tanggal deadline harus diisi');
            dateError.textContent = 'Tanggal deadline harus diisi';
            dateError.classList.remove('hidden');
            taskDate.classList.add('border-red-500');
        } else if (selectedDate < todayObj) {
            errors.push('Tanggal deadline tidak boleh di masa lalu');
            dateError.textContent = 'Tanggal deadline tidak boleh di masa lalu';
            dateError.classList.remove('hidden');
            taskDate.classList.add('border-red-500');
        } else {
            dateError.classList.add('hidden');
            taskDate.classList.remove('border-red-500');
        }
        
        // Jika ada error, tampilkan notifikasi
        if (errors.length > 0) {
            showErrorNotification(
                'Validasi Gagal',
                errors.join('\n'),
                'OK, Saya Mengerti'
            );
            return false;
        }
        
        return true;
    }
    
    // Fungsi merender daftar tugas
    function renderTasks() {
        // Filter tugas berdasarkan kriteria
        const filteredTasks = filterTasks();
        
        // Kosongkan daftar tugas
        taskList.innerHTML = '';
        
        // Tampilkan pesan jika tidak ada tugas
        if (filteredTasks.length === 0) {
            emptyTaskMessage.classList.remove('hidden');
            displayedTasksElement.textContent = '0';
            totalFilteredTasksElement.textContent = '0';
        } else {
            emptyTaskMessage.classList.add('hidden');
            
            // Tampilkan setiap tugas
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
            
            // Update counter
            displayedTasksElement.textContent = filteredTasks.length.toString();
            totalFilteredTasksElement.textContent = tasks.length.toString();
        }
        
        // Update statistik
        updateTaskCounters();
    }
    
    // Fungsi membuat elemen tugas
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition duration-200 ${task.completed ? 'task-completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        // Format tanggal
        const formattedDate = formatDate(task.date);
        const isNearDeadline = isDateNearDeadline(task.date);
        
        // Tentukan kelas prioritas
        const priorityClasses = {
            low: 'priority-low',
            medium: 'priority-medium',
            high: 'priority-high'
        };
        
        const priorityText = getPriorityText(task.priority);
        
        // Buat HTML untuk tugas
        taskElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="custom-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <h3 class="task-title text-lg font-medium text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}">${escapeHtml(task.title)}</h3>
                            <span class="${priorityClasses[task.priority]} priority-badge">${priorityText}</span>
                            ${task.completed ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Selesai</span>' : ''}
                        </div>
                        
                        ${task.description ? `<p class="text-gray-600 mb-3">${escapeHtml(task.description)}</p>` : ''}
                        
                        <div class="flex flex-wrap items-center gap-4 text-sm">
                            <div class="flex items-center text-gray-500">
                                <i class="far fa-calendar-alt mr-2"></i>
                                <span class="${isNearDeadline && !task.completed ? 'deadline-near' : 'deadline-far'}">${formattedDate}</span>
                            </div>
                            <div class="text-gray-500">
                                <i class="far fa-clock mr-1"></i>
                                Dibuat: ${formatDateTime(task.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="ml-4 flex items-center space-x-2">
                    <button class="edit-task p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition duration-200" data-id="${task.id}" title="Edit Tugas">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-task p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition duration-200" data-id="${task.id}" title="Hapus Tugas">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Event listeners untuk elemen tugas
        const checkbox = taskElement.querySelector('.custom-checkbox');
        const deleteBtn = taskElement.querySelector('.delete-task');
        const editBtn = taskElement.querySelector('.edit-task');
        
        checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        
        return taskElement;
    }
    
    // Fungsi toggle status selesai/belum selesai
    function toggleTaskCompletion(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            const newStatus = !task.completed;
            
            showConfirmationDialog(
                "Ubah Status Tugas",
                `Apakah Anda yakin ingin menandai tugas "${task.title}" sebagai ${newStatus ? 'SELESAI' : 'BELUM SELESAI'}?`,
                "Ya, Ubah Status",
                "Batal"
            ).then((confirmed) => {
                if (confirmed) {
                    tasks[taskIndex].completed = newStatus;
                    saveTasks();
                    renderTasks();
                    
                    // Feedback
                    const status = newStatus ? 'selesai' : 'belum selesai';
                    showSuccessNotification('Status Diubah', `Tugas "${task.title}" berhasil ditandai sebagai ${status}.`);
                }
            });
        }
    }
    
    // Fungsi menghapus tugas dengan konfirmasi interaktif
    function deleteTask(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        
        showConfirmationDialog(
            "Hapus Tugas",
            `Apakah Anda yakin ingin menghapus tugas "${task.title}"?\n\nTindakan ini tidak dapat dibatalkan.`,
            "Ya, Hapus",
            "Batal",
            "warning"
        ).then((confirmed) => {
            if (confirmed) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                
                showSuccessNotification('Tugas Dihapus', `Tugas "${task.title}" berhasil dihapus.`);
            } else {
                showInfoNotification('Penghapusan Dibatalkan', 'Tugas tidak dihapus.');
            }
        });
    }
    
    // Fungsi mengedit tugas
    function editTask(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return;
        
        const task = tasks[taskIndex];
        
        showConfirmationDialog(
            "Edit Tugas",
            `Anda akan mengedit tugas: "${task.title}"\n\nKlik "Lanjutkan" untuk mengisi form dengan data tugas ini.`,
            "Lanjutkan",
            "Batal"
        ).then((confirmed) => {
            if (!confirmed) {
                showInfoNotification('Edit Dibatalkan', 'Tugas tidak diedit.');
                return;
            }
            
            // Isi form dengan data tugas
            taskTitle.value = task.title;
            taskDescription.value = task.description;
            taskDate.value = task.date;
            taskPriority.value = task.priority;
            
            // Update counters
            updateTitleCount();
            updateDescCount();
            
            // Hapus tugas dari daftar sementara
            tasks.splice(taskIndex, 1);
            
            // Update UI
            saveTasks();
            renderTasks();
            
            // Focus ke input judul
            taskTitle.focus();
            
            // Update teks tombol submit
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Perubahan';
            
            // Show instruction
            showInfoNotification('Mode Edit Aktif', 'Ubah data tugas di form dan klik "Simpan Perubahan". Klik "Bersihkan Form" untuk membatalkan edit.');
            
            // Ubah event listener sementara
            taskForm.removeEventListener('submit', handleAddTask);
            taskForm.addEventListener('submit', function saveEdit(e) {
                e.preventDefault();
                
                if (!validateFormWithNotification()) return;
                
                // Konfirmasi sebelum menyimpan perubahan
                showConfirmationDialog(
                    "Simpan Perubahan",
                    `Apakah Anda yakin ingin menyimpan perubahan pada tugas ini?`,
                    "Ya, Simpan",
                    "Batal"
                ).then((saveConfirmed) => {
                    if (!saveConfirmed) {
                        showInfoNotification('Penyimpanan Dibatalkan', 'Perubahan tidak disimpan.');
                        return;
                    }
                    
                    // Buat tugas dengan data yang diperbarui
                    const updatedTask = {
                        id: id,
                        title: taskTitle.value.trim(),
                        description: taskDescription.value.trim(),
                        date: taskDate.value,
                        priority: taskPriority.value,
                        completed: task.completed,
                        createdAt: task.createdAt
                    };
                    
                    // Tambahkan kembali ke array
                    tasks.unshift(updatedTask);
                    
                    // Simpan dan render ulang
                    saveTasks();
                    renderTasks();
                    
                    // Reset form
                    taskForm.reset();
                    taskDate.value = today;
                    taskPriority.value = 'medium';
                    
                    // Kembalikan event listener asli
                    taskForm.removeEventListener('submit', saveEdit);
                    taskForm.addEventListener('submit', handleAddTask);
                    
                    // Kembalikan teks tombol
                    submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i> Tambah Tugas';
                    
                    // Feedback
                    showSuccessNotification('Perubahan Disimpan', 'Tugas berhasil diperbarui!');
                });
            });
        });
    }
    
    // Fungsi filter tugas
    function filterTasks() {
        return tasks.filter(task => {
            // Filter berdasarkan status
            if (currentFilter.status !== 'all') {
                if (currentFilter.status === 'completed' && !task.completed) return false;
                if (currentFilter.status === 'pending' && task.completed) return false;
            }
            
            // Filter berdasarkan prioritas
            if (currentFilter.priority !== 'all' && task.priority !== currentFilter.priority) {
                return false;
            }
            
            // Filter berdasarkan pencarian
            if (currentFilter.search) {
                const searchTerm = currentFilter.search.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchTerm);
                const descMatch = task.description.toLowerCase().includes(searchTerm);
                
                if (!titleMatch && !descMatch) return false;
            }
            
            return true;
        });
    }
    
    // Fungsi pencarian
    function handleSearch() {
        currentFilter.search = searchTask.value.trim().toLowerCase();
        renderTasks();
    }
    
    // Fungsi perubahan filter
    function handleFilterChange() {
        currentFilter.status = filterStatus.value;
        currentFilter.priority = filterPriority.value;
        renderTasks();
    }
    
    // Fungsi menghapus semua tugas yang selesai
    function clearCompletedTasks() {
        const completedTasks = tasks.filter(task => task.completed);
        const completedCount = completedTasks.length;
        
        if (completedCount === 0) {
            showInfoNotification('Tidak Ada Tugas Selesai', 'Tidak ada tugas yang selesai untuk dihapus.');
            return;
        }
        
        // Buat daftar tugas yang akan dihapus
        let taskListText = completedTasks.map(task => `• ${task.title}`).join('\n');
        if (taskListText.length > 200) {
            taskListText = taskListText.substring(0, 200) + '...';
        }
        
        showConfirmationDialog(
            "Hapus Tugas Selesai",
            `Anda akan menghapus ${completedCount} tugas yang sudah selesai:\n\n${taskListText}\n\nTindakan ini tidak dapat dibatalkan.`,
            `Ya, Hapus ${completedCount} Tugas`,
            "Batal",
            "warning"
        ).then((confirmed) => {
            if (confirmed) {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                
                showSuccessNotification('Tugas Selesai Dihapus', `${completedCount} tugas selesai berhasil dihapus.`);
            } else {
                showInfoNotification('Penghapusan Dibatalkan', 'Tugas selesai tidak dihapus.');
            }
        });
    }
    
    // Fungsi menghapus semua tugas
    function deleteAllTasks() {
        if (tasks.length === 0) {
            showInfoNotification('Tidak Ada Tugas', 'Tidak ada tugas untuk dihapus.');
            return;
        }
        
        // Buat daftar semua tugas
        let taskListText = tasks.map(task => `• ${task.title}`).join('\n');
        if (taskListText.length > 200) {
            taskListText = taskListText.substring(0, 200) + '...';
        }
        
        showConfirmationDialog(
            "Hapus Semua Tugas",
            `Anda akan menghapus SEMUA ${tasks.length} tugas:\n\n${taskListText}\n\nTindakan ini tidak dapat dibatalkan!`,
            `Ya, Hapus Semua (${tasks.length})`,
            "Batal",
            "error"
        ).then((confirmed) => {
            if (confirmed) {
                tasks = [];
                saveTasks();
                renderTasks();
                
                showSuccessNotification('Semua Tugas Dihapus', `${tasks.length} tugas berhasil dihapus.`);
            } else {
                showInfoNotification('Penghapusan Dibatalkan', 'Tidak ada tugas yang dihapus.');
            }
        });
    }
    
    // Fungsi membersihkan form dengan konfirmasi
    function clearForm() {
        if (taskTitle.value || taskDescription.value || taskDate.value !== today) {
            showConfirmationDialog(
                "Bersihkan Form",
                "Apakah Anda yakin ingin membersihkan formulir?\n\nSemua data yang belum disimpan akan hilang.",
                "Ya, Bersihkan",
                "Batal"
            ).then((confirmed) => {
                if (confirmed) {
                    // Reset form
                    taskForm.reset();
                    taskDate.value = today;
                    taskPriority.value = 'medium';
                    
                    // Reset error
                    titleError.classList.add('hidden');
                    dateError.classList.add('hidden');
                    taskTitle.classList.remove('border-red-500');
                    taskDate.classList.remove('border-red-500');
                    
                    // Reset counter
                    updateTitleCount();
                    updateDescCount();
                    
                    // Kembalikan event listener jika sedang edit mode
                    const submitBtn = document.getElementById('submitBtn');
                    submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i> Tambah Tugas';
                    
                    // Pastikan event listener adalah handleAddTask
                    taskForm.removeEventListener('submit', handleAddTask);
                    taskForm.addEventListener('submit', handleAddTask);
                    
                    showInfoNotification('Form Dibersihkan', 'Formulir telah dibersihkan. Anda dapat mengisi data baru.');
                }
            });
        } else {
            // Jika form sudah kosong
            showInfoNotification('Form Sudah Kosong', 'Formulir sudah dalam keadaan bersih.');
        }
    }
    
    // Fungsi update counter judul
    function updateTitleCount() {
        const count = taskTitle.value.length;
        titleCount.textContent = `${count}/100 karakter`;
        
        // Ubah warna jika mendekati batas
        if (count > 90) {
            titleCount.classList.add('text-red-500');
            titleCount.classList.remove('text-gray-400');
        } else {
            titleCount.classList.remove('text-red-500');
            titleCount.classList.add('text-gray-400');
        }
    }
    
    // Fungsi update counter deskripsi
    function updateDescCount() {
        const count = taskDescription.value.length;
        descCount.textContent = `${count}/300 karakter`;
        
        // Ubah warna jika mendekati batas
        if (count > 270) {
            descCount.classList.add('text-red-500');
            descCount.classList.remove('text-gray-400');
        } else {
            descCount.classList.remove('text-red-500');
            descCount.classList.add('text-gray-400');
        }
    }
    
    // Fungsi update statistik tugas
    function updateTaskCounters() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        
        totalTasksElement.textContent = total.toString();
        completedTasksElement.textContent = completed.toString();
    }
    
    // Fungsi penyimpanan ke localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // ==============================================
    // FUNGSI NOTIFIKASI INTERAKTIF YANG DITAMBAHKAN
    // ==============================================
    
    // Fungsi untuk menampilkan dialog konfirmasi kustom
    function showConfirmationDialog(title, message, confirmText = "Ya", cancelText = "Tidak", type = "info") {
        return new Promise((resolve) => {
            // Hapus dialog sebelumnya jika ada
            const existingDialog = document.getElementById('customConfirmationDialog');
            if (existingDialog) {
                document.body.removeChild(existingDialog);
            }
            
            // Tentukan ikon berdasarkan tipe
            const iconMap = {
                info: '<i class="fas fa-info-circle text-blue-500 text-4xl"></i>',
                warning: '<i class="fas fa-exclamation-triangle text-yellow-500 text-4xl"></i>',
                error: '<i class="fas fa-times-circle text-red-500 text-4xl"></i>',
                success: '<i class="fas fa-check-circle text-green-500 text-4xl"></i>'
            };
            
            const icon = iconMap[type] || iconMap.info;
            
            // Warna tombol berdasarkan tipe
            const buttonColorMap = {
                info: 'bg-blue-500 hover:bg-blue-600',
                warning: 'bg-yellow-500 hover:bg-yellow-600',
                error: 'bg-red-500 hover:bg-red-600',
                success: 'bg-green-500 hover:bg-green-600'
            };
            
            const confirmButtonColor = buttonColorMap[type] || buttonColorMap.info;
            
            // Buat elemen dialog
            const dialog = document.createElement('div');
            dialog.id = 'customConfirmationDialog';
            dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4';
            dialog.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                    <div class="p-6">
                        <div class="flex items-center mb-4">
                            <div class="mr-4">
                                ${icon}
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                        </div>
                        <div class="mb-6">
                            <p class="text-gray-600 whitespace-pre-line">${message}</p>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button id="cancelBtn" class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition duration-200">
                                ${cancelText}
                            </button>
                            <button id="confirmBtn" class="px-5 py-2.5 ${confirmButtonColor} text-white font-medium rounded-lg transition duration-200">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Tambahkan ke body
            document.body.appendChild(dialog);
            
            // Event listeners untuk tombol
            document.getElementById('confirmBtn').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(true);
            });
            
            document.getElementById('cancelBtn').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(false);
            });
            
            // Tutup dialog saat klik di luar
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    document.body.removeChild(dialog);
                    resolve(false);
                }
            });
            
            // Tambahkan animasi
            setTimeout(() => {
                const modalContent = dialog.querySelector('div.bg-white');
                modalContent.classList.add('scale-100', 'opacity-100');
                modalContent.classList.remove('scale-95', 'opacity-0');
            }, 10);
        });
    }
    
    // Fungsi untuk menampilkan notifikasi sukses
    function showSuccessNotification(title, message) {
        showNotification(title, message, 'success');
    }
    
    // Fungsi untuk menampilkan notifikasi error
    function showErrorNotification(title, message, buttonText = "OK") {
        showNotification(title, message, 'error', buttonText);
    }
    
    // Fungsi untuk menampilkan notifikasi info
    function showInfoNotification(title, message) {
        showNotification(title, message, 'info');
    }
    
    // Fungsi notifikasi umum
    function showNotification(title, message, type = "info", buttonText = "OK") {
        // Hapus notifikasi sebelumnya jika ada
        const existingNotification = document.getElementById('customNotification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // Tentukan ikon berdasarkan tipe
        const iconMap = {
            info: '<i class="fas fa-info-circle text-blue-500"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            error: '<i class="fas fa-times-circle text-red-500"></i>',
            success: '<i class="fas fa-check-circle text-green-500"></i>'
        };
        
        const icon = iconMap[type] || iconMap.info;
        
        // Buat elemen notifikasi
        const notification = document.createElement('div');
        notification.id = 'customNotification';
        notification.className = 'fixed top-6 right-6 z-50 max-w-md w-full';
        notification.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl border-l-4 ${type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : type === 'warning' ? 'border-yellow-500' : 'border-blue-500'} transform transition-all duration-300 translate-x-0 opacity-100">
                <div class="p-5">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 text-2xl mr-4">
                            ${icon}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800 text-lg">${title}</h4>
                            <p class="text-gray-600 mt-1">${message}</p>
                        </div>
                        <button class="ml-4 text-gray-400 hover:text-gray-600" id="closeNotification">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button id="notificationOkBtn" class="px-4 py-2 ${type === 'success' ? 'bg-green-500 hover:bg-green-600' : type === 'error' ? 'bg-red-500 hover:bg-red-600' : type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium rounded-lg transition duration-200">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Tambahkan ke body
        document.body.appendChild(notification);
        
        // Event listeners
        document.getElementById('closeNotification').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        document.getElementById('notificationOkBtn').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        // Hapus otomatis setelah 5 detik
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
    
    // ==============================================
    // FUNGSI UTILITAS
    // ==============================================
    
    // Fungsi utilitas: format tanggal
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
    
    // Fungsi utilitas: format tanggal untuk display
    function formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    // Fungsi utilitas: format tanggal dan waktu
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Fungsi utilitas: cek apakah deadline dekat (<= 2 hari)
    function isDateNearDeadline(dateString) {
        const today = new Date();
        const deadline = new Date(dateString);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 2 && diffDays >= 0;
    }
    
    // Fungsi utilitas: escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Fungsi utilitas: dapatkan teks prioritas
    function getPriorityText(priority) {
        const priorityTexts = {
            low: 'Rendah',
            medium: 'Sedang',
            high: 'Tinggi'
        };
        return priorityTexts[priority] || 'Sedang';
    }
});