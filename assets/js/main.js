/**
 * SwarBazaar — main.js
 * Micro-interactions, scroll effects, search UX
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --- Navbar scroll shadow --- */
    const nav = document.getElementById('mainNav');
    if (nav) {
        const onScroll = () => {
            nav.classList.toggle('scrolled', window.scrollY > 30);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* --- Fade-up on scroll (IntersectionObserver) --- */
    const fadeEls = document.querySelectorAll('.fade-up');
    if (fadeEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        fadeEls.forEach(el => io.observe(el));
    }

    /* --- Auto-dismiss alerts after 4 s --- */
    document.querySelectorAll('.alert-dismissible').forEach(alert => {
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            if (bsAlert) bsAlert.close();
        }, 4000);
    });

    /* --- Category pill filter (shop page) --- */
    const pills = document.querySelectorAll('.pill-btn');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const cat = pill.dataset.cat;
            const cards = document.querySelectorAll('.song-card-wrapper');
            cards.forEach(card => {
                if (!cat || cat === 'all' || card.dataset.cat === cat) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    /* --- Buy button confirmation --- */
    document.querySelectorAll('.buy-form').forEach(form => {
        form.addEventListener('submit', e => {
            const btn = form.querySelector('button[type="submit"]');
            if (btn && !btn.disabled) {
                btn.textContent  = 'Processing…';
                btn.disabled = true;
            }
        });
    });

    /* --- Tooltips --- */
    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipEls.forEach(el => new bootstrap.Tooltip(el));

    /* --- Delete confirm --- */
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', e => {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });
});
