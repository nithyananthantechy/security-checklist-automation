document.addEventListener('DOMContentLoaded', function() {
    // Back to Top Button
    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };

        backToTopBtn.addEventListener('click', function() {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        });
    }
});

function clearFilters() {
    document.getElementById('priorityFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('taskSearch').value = '';
    filterTasks();
}
