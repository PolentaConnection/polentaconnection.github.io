(function () {
    var MAP_SRC =
        'https://mapmyvisitors.com/map.js?cl=0e1633&w=a&t=tt&d=Q2xlWwZtn0GJcZ543ENSGeSFiuYOrvksAjWzM4bkNSM&co=0b4975&cmo=3acc3a&cmn=ff5353&ct=cdd4d9';

    function tracker() {
        return document.getElementById('mapmyvisitors-tracker');
    }

    function holder() {
        return document.getElementById('mapmyvisitors-holder');
    }

    function loadTrackingScript() {
        if (document.getElementById('mapmyvisitors')) {
            return;
        }

        var mount = tracker();
        if (!mount) {
            return;
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'mapmyvisitors';
        script.src = MAP_SRC;
        mount.appendChild(script);
    }

    function resizeWidget() {
        window.dispatchEvent(new Event('resize'));

        if (typeof window.jQuery === 'undefined') {
            return;
        }

        window.jQuery(window).trigger('resize');

        var mapContainer = document.querySelector('#mapmyvisitors-widget .jvectormap-container');
        if (!mapContainer) {
            return;
        }

        var mapObject = window.jQuery(mapContainer).data('mapObject');
        if (mapObject && typeof mapObject.updateSize === 'function') {
            mapObject.updateSize();
        }
    }

    function showWidgetInPanel() {
        var widget = document.getElementById('mapmyvisitors-widget');
        var panelHolder = holder();
        if (!widget || !panelHolder) {
            return;
        }

        if (widget.parentElement !== panelHolder) {
            panelHolder.appendChild(widget);
        }

        resizeWidget();
        window.setTimeout(resizeWidget, 150);
        window.setTimeout(resizeWidget, 600);
        window.setTimeout(resizeWidget, 1500);
    }

    function initVisitorMap() {
        loadTrackingScript();

        var panel = document.getElementById('visitorMapPanel');
        if (!panel) {
            return;
        }

        panel.addEventListener('shown.bs.collapse', showWidgetInPanel);

        if (panel.classList.contains('show')) {
            showWidgetInPanel();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVisitorMap);
    } else {
        initVisitorMap();
    }
})();
