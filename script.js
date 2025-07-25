document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const taskCount = document.getElementById('task-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const taskSearch = document.getElementById('task-search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortNewestBtn = document.getElementById('sort-newest');
    const sortOldestBtn = document.getElementById('sort-oldest');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editTaskTitle = document.getElementById('edit-task-title');
    const editTaskDescription = document.getElementById('edit-task-description');
    const editTaskDueDate = document.getElementById('edit-task-due-date');
    const editTaskPriority = document.getElementById('edit-task-priority');
    const editTaskId = document.getElementById('edit-task-id');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentSort = 'newest';
    
    // Initialize the app
    init();
    
    function init() {
        renderTasks();
        updateTaskCount();
        setupEventListeners();
        updateActiveFilter();
        updateActiveSort();
    }
    
    function setupEventListeners() {
        // Form submission
        taskForm.addEventListener('submit', handleAddTask);
        editForm.addEventListener('submit', handleEditTask);
        
        // Task actions
        taskList.addEventListener('click', handleTaskActions);
        
        // Filtering
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                updateActiveFilter();
                renderTasks();
            });
        });
        
        // Sorting
        sortNewestBtn.addEventListener('click', () => {
            currentSort = 'newest';
            updateActiveSort();
            renderTasks();
        });
        
        sortOldestBtn.addEventListener('click', () => {
            currentSort = 'oldest';
            updateActiveSort();
            renderTasks();
        });
        
        // Search
        taskSearch.addEventListener('input', debounce(() => {
            renderTasks();
        }, 300));
        
        // Clear completed
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        // Modal
        closeModalBtn.addEventListener('click', closeModal);
        cancelEditBtn.addEventListener('click', closeModal);
    }
    
    function handleAddTask(e) {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now().toString(),
            title,
            description: taskDescriptionInput.value.trim(),
            dueDate: taskDueDateInput.value,
            priority: taskPriorityInput.value,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        
        // Reset form
        taskForm.reset();
        taskTitleInput.focus();
    }
    
    function handleEditTask(e) {
        e.preventDefault();
        const taskId = editTaskId.value;
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title: editTaskTitle.value.trim(),
                description: editTaskDescription.value.trim(),
                dueDate: editTaskDueDate.value,
                priority: editTaskPriority.value
            };
            
            saveTasks();
            renderTasks();
            closeModal();
        }
    }
    
    function handleTaskActions(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (e.target.closest('.complete-btn')) {
            // Toggle task status
            tasks[taskIndex].status = tasks[taskIndex].status === 'active' ? 'completed' : 'active';
            saveTasks();
            renderTasks();
            updateTaskCount();
        } else if (e.target.closest('.edit-btn')) {
            // Open edit modal
            openEditModal(tasks[taskIndex]);
        } else if (e.target.closest('.delete-btn')) {
            // Delete task
            if (confirm('Are you sure you want to delete this task?')) {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
                updateTaskCount();
            }
        }
    }
    
    function openEditModal(task) {
        editTaskId.value = task.id;
        editTaskTitle.value = task.title;
        editTaskDescription.value = task.description || '';
        editTaskDueDate.value = task.dueDate || '';
        editTaskPriority.value = task.priority || 'medium';
        
        editModal.classList.remove('hidden');
    }
    
    function closeModal() {
        editModal.classList.add('hidden');
    }
    
    function clearCompletedTasks() {
        tasks = tasks.filter(task => task.status !== 'completed');
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    function renderTasks() {
        // Filter tasks based on current filter and search
        let filteredTasks = filterTasks(tasks, currentFilter);
        filteredTasks = searchTasks(filteredTasks, taskSearch.value.trim());
        
        // Sort tasks
        filteredTasks = sortTasks(filteredTasks, currentSort);
        
        // Clear the task list
        taskList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
            taskList.appendChild(emptyState);
            clearCompletedBtn.classList.add('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        // Create and append task items
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
        
        // Show/hide clear completed button
        const hasCompletedTasks = tasks.some(task => task.status === 'completed');
        clearCompletedBtn.classList.toggle('hidden', !hasCompletedTasks);
    }
    
    function createTaskElement(task) {
        const template = document.getElementById('task-template');
        const clone = template.content.cloneNode(true);
        const taskItem = clone.querySelector('.task-item');
        
        taskItem.dataset.id = task.id;
        
        // Set task status
        if (task.status === 'completed') {
            taskItem.classList.add('task-completed');
            clone.querySelector('.complete-icon').classList.add('hidden');
            clone.querySelector('.completed-icon').classList.remove('hidden');
        }
        
        // Set task content
        clone.querySelector('.task-title').textContent = task.title;
        clone.querySelector('.task-description').textContent = task.description || '';
        
        // Set priority
        const priorityElement = clone.querySelector('.task-priority');
        priorityElement.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        priorityElement.classList.add(`priority-${task.priority}`);
        
        // Format dates
        const createdAtDate = new Date(task.createdAt);
        clone.querySelector('.task-created-at').textContent = formatDate(createdAtDate);
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            clone.querySelector('.task-due-date').textContent = formatDate(dueDate);
            
            // Add overdue styling if due date is in the past
            if (dueDate < new Date() && task.status !== 'completed') {
                clone.querySelector('.task-due-date').classList.add('text-red-500');
            }
        } else {
            clone.querySelector('.task-due-date').textContent = 'No due date';
        }
        
        return clone;
    }
    
    function filterTasks(tasks, filter) {
        switch (filter) {
            case 'active':
                return tasks.filter(task => task.status === 'active');
            case 'completed':
                return tasks.filter(task => task.status === 'completed');
            default:
                return [...tasks];
        }
    }
    
    function searchTasks(tasks, searchTerm) {
        if (!searchTerm) return tasks;
        
        const lowerCaseSearch = searchTerm.toLowerCase();
        return tasks.filter(task => 
            task.title.toLowerCase().includes(lowerCaseSearch) || 
            (task.description && task.description.toLowerCase().includes(lowerCaseSearch))
        );
    }
    
    function sortTasks(tasks, sortBy) {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }
    
    function updateTaskCount() {
        const activeCount = tasks.filter(task => task.status === 'active').length;
        const completedCount = tasks.filter(task => task.status === 'completed').length;
        taskCount.textContent = activeCount + completedCount;
    }
    
    function updateActiveFilter() {
        filterButtons.forEach(btn => {
            btn.classList.remove('bg-green-100', 'bg-yellow-100', 'bg-purple-100');
            
            if (btn.dataset.filter === currentFilter) {
                if (currentFilter === 'all') btn.classList.add('bg-green-100');
                if (currentFilter === 'active') btn.classList.add('bg-yellow-100');
                if (currentFilter === 'completed') btn.classList.add('bg-purple-100');
            }
        });
    }
    
    function updateActiveSort() {
        if (currentSort === 'newest') {
            sortNewestBtn.classList.add('active');
            sortOldestBtn.classList.remove('active');
        } else {
            sortOldestBtn.classList.add('active');
            sortNewestBtn.classList.remove('active');
        }
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
});