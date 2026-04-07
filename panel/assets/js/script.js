(function () {
    function onReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    onReady(function () {
        var panelIds = ['team', 'news', 'tastaturbelegung'];
        var panels = [];
        for (var p = 0; p < panelIds.length; p++) {
            var el = document.getElementById(panelIds[p]);
            if (el) panels.push(el);
        }
        var outMs = 340;
        var busy = false;
        var titleButtons = document.querySelector('.title_buttons');
        if (!titleButtons || !panels.length) return;

        function getVisiblePanel() {
            for (var i = 0; i < panels.length; i++) {
                if (window.getComputedStyle(panels[i]).display !== 'none') return panels[i];
            }
            return null;
        }

        titleButtons.addEventListener('click', function (e) {
            var btn = e.target.closest && e.target.closest('.title_button');
            if (!btn || !titleButtons.contains(btn)) return;

            var target = btn.getAttribute('data-target');
            if (!target || busy) return;

            var next = document.getElementById(target);
            if (!next) return;

            var cur = getVisiblePanel();
            if (cur === next) return;

            busy = true;
            var allBtns = titleButtons.querySelectorAll('.title_button');
            for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('active');
            btn.classList.add('active');

            function showNext() {
                next.style.display = 'flex';
                next.classList.add('info_box--anim-in');
                next.offsetWidth;
                next.classList.remove('info_box--anim-in');
                setTimeout(function () {
                    busy = false;
                }, 400);
            }

            if (!cur) {
                showNext();
                return;
            }

            cur.classList.add('info_box--anim-out');
            setTimeout(function () {
                cur.style.display = 'none';
                cur.classList.remove('info_box--anim-out', 'info_box--anim-in');
                showNext();
            }, outMs);
        });
    });
})();
