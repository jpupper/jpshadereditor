// Mobile-specific functionality for shader editor
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Handle initial setup
    function setupMobileView() {
        if (isMobile()) {
            // Show code editor by default
            document.getElementById('code-view-btn').classList.add('active');
            document.getElementById('ui-view-btn').classList.remove('active');
            document.getElementById('editor-container').style.display = 'block';
            document.getElementById('ui-container').style.display = 'none';
            
            // In fullscreen mode
            if (document.getElementById('fullscreen-container').style.display === 'flex') {
                // Hide editor initially on mobile fullscreen
                document.getElementById('fullscreen-editor-container').style.display = 'none';
                document.getElementById('toggle-editor').style.display = 'none';
                document.getElementById('open-editor').style.display = 'block';
            }
        }
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        // Refresh CodeMirror instances
        if (window.editor) {
            setTimeout(() => window.editor.refresh(), 100);
        }
        if (window.fullscreenEditor) {
            setTimeout(() => window.fullscreenEditor.refresh(), 100);
        }
        
        setupMobileView();
    });
    
    // Handle resize
    window.addEventListener('resize', function() {
        setupMobileView();
    });
    
    // Initial setup
    setupMobileView();
});