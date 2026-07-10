(function () {
    var STORAGE_KEY = 'pc-theme';
    var DEFAULT_THEME = 'vscode';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        var select = document.getElementById('theme-select');
        if (select && select.value !== theme) {
            select.value = theme;
        }
    }

    function initTheme() {
        var saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
        applyTheme(saved);

        var select = document.getElementById('theme-select');
        if (!select) return;

        select.addEventListener('change', function () {
            localStorage.setItem(STORAGE_KEY, select.value);
            applyTheme(select.value);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
