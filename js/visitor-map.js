(function () {
    var MAP_SRC =
        'https://mapmyvisitors.com/map.js?cl=0e1633&w=a&t=tt&d=Q2xlWwZtn0GJcZ543ENSGeSFiuYOrvksAjWzM4bkNSM&co=0b4975&cmo=3acc3a&cmn=ff5353&ct=cdd4d9';

    function holder() {
        return document.getElementById('mapmyvisitors-holder');
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

    function loadVisitorMap() {
        var mount = holder();
        if (!mount) {
            return;
        }

        if (document.getElementById('mapmyvisitors')) {
            resizeWidget();
            window.setTimeout(resizeWidget, 150);
            window.setTimeout(resizeWidget, 600);
            return;
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'mapmyvisitors';
        script.src = MAP_SRC;
        script.onload = function () {
            resizeWidget();
            window.setTimeout(resizeWidget, 150);
            window.setTimeout(resizeWidget, 600);
            window.setTimeout(resizeWidget, 1500);
        };
        mount.appendChild(script);
    }

    function initVisitorMap() {
        var panel = document.getElementById('visitorMapPanel');
        if (!panel) {
            return;
        }

        panel.addEventListener('shown.bs.collapse', loadVisitorMap);

        if (panel.classList.contains('show')) {
            loadVisitorMap();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVisitorMap);
    } else {
        initVisitorMap();
    }
})();
