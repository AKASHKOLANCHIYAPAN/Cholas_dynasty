/**
 * Cholas Dynasty - Main Application Logic
 * Handles data fetching, animations, booking flow, and interactive elements
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        tours: [],
        currentStep: 1,
        selectedTour: null,
        bookingData: {}
    };

    // DOM Elements
    const elements = {
        loader: document.getElementById('pageLoader'),
        navbar: document.getElementById('navbar'),
        navToggle: document.getElementById('navToggle'),
        navLinks: document.getElementById('navLinks'),
        toursGrid: document.getElementById('toursGrid'),
        tourSelect: document.getElementById('tourSelect'),
        tourModal: document.getElementById('tourModal'),
        modalContent: document.getElementById('tourModalContent'),
        modalClose: document.getElementById('modalClose'),
        mapDestinations: document.querySelectorAll('.map-dest-item'),
        mapDots: document.querySelectorAll('.map-dot'),
        statNumbers: document.querySelectorAll('.stat-number'),
        floatElements: document.querySelectorAll('.float-up, .float-left, .float-right')
    };

    // Initialize Application
    async function init() {
        await loadTourData();
        setupNavigation();
        setupScrollEffects();
        setupMapInteractions();
        setupBookingForm();
        
        // Remove loader after a slight delay for smooth entry
        setTimeout(() => {
            elements.loader.classList.add('hidden');
            document.body.style.overflow = 'visible';
        }, 800);
    }

    // Load Data
    async function loadTourData() {
        try {
            const response = await fetch('data/tours.json');
            if (!response.ok) throw new Error('Data not found');
            state.tours = await response.json();
            renderTours();
        } catch (error) {
            console.error('Error loading tours:', error);
            elements.toursGrid.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--gold); grid-column: 1/-1;">
                    <p>The royal scrolls are currently unavailable. Please try again later.</p>
                </div>
            `;
        }
    }

    // Format Currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Render Tours
    function renderTours() {
        if (!state.tours.length) return;

        elements.toursGrid.innerHTML = state.tours.map((tour, index) => `
            <div class="tour-card float-up" style="transition-delay: ${index * 0.1}s" onclick="openTourModal('${tour.id}')">
                <div class="tour-card-image">
                    <img src="${tour.heroImage}" alt="${tour.title}" loading="lazy">
                    <div class="tour-card-image-overlay"></div>
                    <div class="tour-card-badge">${tour.dynasty} Trail</div>
                    <div class="tour-card-days">${tour.days} Days / ${tour.nights} Nights</div>
                </div>
                <div class="tour-card-body">
                    <div class="tour-card-dynasty">${tour.dynasty} Dynasty</div>
                    <h3 class="tour-card-title">${tour.title}</h3>
                    <p class="tour-card-tagline">${tour.tagline}</p>
                    
                    <div class="tour-card-destinations">
                        ${tour.destinations.slice(0, 3).map(dest => `<span class="tour-card-dest-tag">${dest}</span>`).join('')}
                        ${tour.destinations.length > 3 ? `<span class="tour-card-dest-tag">+${tour.destinations.length - 3}</span>` : ''}
                    </div>

                    <div class="tour-card-footer">
                        <div class="tour-card-price">
                            <span class="tour-card-price-original">${formatPrice(tour.originalPrice)}</span>
                            <div>
                                <span class="tour-card-price-current">${formatPrice(tour.price)}</span>
                                <span class="tour-card-price-per">/ pax</span>
                            </div>
                        </div>
                        <button class="tour-card-btn">Explore</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-trigger intersection observer for new elements
        observeElements();
    }

    // Navigation & Scroll
    function setupNavigation() {
        // Mobile Toggle
        elements.navToggle.addEventListener('click', () => {
            elements.navToggle.classList.toggle('active');
            elements.navLinks.classList.toggle('active');
            document.body.style.overflow = elements.navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile menu on link click
        elements.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                elements.navToggle.classList.remove('active');
                elements.navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Navbar Scroll Effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                elements.navbar.classList.add('scrolled');
            } else {
                elements.navbar.classList.remove('scrolled');
            }
        });
    }

    // Intersection Observer for Animations & Stats
    function setupScrollEffects() {
        observeElements();

        // Parallax effect for hero
        const heroParticles = document.getElementById('heroParticles');
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight) {
                heroParticles.style.transform = `translateY(${scrolled * 0.4}px)`;
            }
        });
    }

    function observeElements() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Trigger number counter if it's a stat block
                    if (entry.target.classList.contains('stat-item') && !entry.target.dataset.counted) {
                        const numEl = entry.target.querySelector('.stat-number');
                        animateValue(numEl, 0, parseInt(numEl.dataset.count), 2000);
                        entry.target.dataset.counted = 'true';
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.float-up, .float-left, .float-right').forEach(el => {
            observer.observe(el);
        });
    }

    // Number Counter Animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentObj = Math.floor(easeOutQuart * (end - start) + start);
            
            // Format number if >= 1000
            obj.innerHTML = currentObj >= 1000 ? currentObj.toLocaleString() : currentObj;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end >= 1000 ? end.toLocaleString() + '+' : end;
            }
        };
        window.requestAnimationFrame(step);
    }

    // Map Interactions
    function setupMapInteractions() {
        elements.mapDestinations.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const destName = item.querySelector('.map-dest-name').innerText;
                highlightMapDot(destName);
            });
            item.addEventListener('mouseleave', () => {
                resetMapDots();
            });
        });

        elements.mapDots.forEach(dot => {
            dot.addEventListener('mouseenter', () => {
                const destName = dot.dataset.dest;
                highlightListItem(destName);
            });
            dot.addEventListener('mouseleave', () => {
                resetListItems();
            });
        });
    }

    function highlightMapDot(destName) {
        elements.mapDots.forEach(dot => {
            if (dot.dataset.dest === destName) {
                dot.setAttribute('r', '12');
                dot.setAttribute('fill', '#FFF');
                dot.style.filter = 'drop-shadow(0 0 10px #D4AF37)';
            } else {
                dot.setAttribute('fill', 'rgba(212, 175, 55, 0.4)');
            }
        });
    }

    function resetMapDots() {
        elements.mapDots.forEach(dot => {
            dot.setAttribute('fill', '#D4AF37');
            dot.style.filter = 'none';
            // Reset to original animation radii (simplified by just removing static r)
            dot.removeAttribute('r'); 
        });
    }

    function highlightListItem(destName) {
        elements.mapDestinations.forEach(item => {
            if (item.querySelector('.map-dest-name').innerText === destName) {
                item.style.background = 'rgba(212, 175, 55, 0.15)';
                item.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                item.style.transform = 'translateX(10px)';
            } else {
                item.style.opacity = '0.5';
            }
        });
    }

    function resetListItems() {
        elements.mapDestinations.forEach(item => {
            item.style.background = '';
            item.style.borderColor = '';
            item.style.transform = '';
            item.style.opacity = '1';
        });
    }

    // Booking Form Flow
    function setupBookingForm() {
        // Expose functions to global scope for inline onclick handlers
        window.nextStep = (step) => {
            if (step === 2 && !validateStep1()) return;
            if (step === 3 && !validateStep2()) return;
            
            if (step === 3) generateSummary();

            // Update Steps UI
            document.querySelectorAll('.booking-step').forEach(el => {
                const s = parseInt(el.dataset.step);
                el.classList.remove('active', 'completed');
                if (s < step) el.classList.add('completed');
                if (s === step) el.classList.add('active');
            });

            // Update Forms UI
            document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
            document.getElementById(`formStep${step}`).classList.add('active');
            
            state.currentStep = step;
        };

        window.submitBooking = () => {
            const btn = document.querySelector('#formStep3 .btn-primary');
            btn.innerHTML = '<div class="loader-icon" style="width:20px;height:20px;border-width:2px;"></div> Confirming...';
            btn.style.pointerEvents = 'none';

            // Simulate API Call
            setTimeout(() => {
                document.getElementById('formStep3').innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="font-size: 4rem; color: var(--gold); margin-bottom: 20px;">✦</div>
                        <h3 style="font-family: var(--font-display); font-size: 2rem; color: var(--ivory); margin-bottom: 16px;">Royal Journey Confirmed</h3>
                        <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 30px;">
                            Your request to join the <strong>${document.getElementById('tourSelect').options[document.getElementById('tourSelect').selectedIndex].text.split('—')[0]}</strong> has been received.<br>
                            Your personal heritage concierge will contact you shortly to finalize the royal arrangements.
                        </p>
                        <button class="btn-secondary" onclick="location.reload()">Return to Court</button>
                    </div>
                `;
            }, 2000);
        };
    }

    function validateStep1() {
        const title = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const tour = document.getElementById('tourSelect').value;
        const date = document.getElementById('travelDate').value;

        if (!title || !email || !tour || !date) {
            alert('Please complete all royal details to proceed.');
            return false;
        }
        return true;
    }

    function validateStep2() {
        return true; // Optional fields
    }

    function generateSummary() {
        const name = document.getElementById('fullName').value;
        const tourSelect = document.getElementById('tourSelect');
        const tourName = tourSelect.options[tourSelect.selectedIndex].text;
        const date = new Date(document.getElementById('travelDate').value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const guests = document.getElementById('guests').value;
        const tier = document.getElementById('accommodation').options[document.getElementById('accommodation').selectedIndex].text;

        const summaryHtml = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 12px 0; color: var(--text-secondary);">Honored Guest</td><td style="padding: 12px 0; color: var(--ivory); text-align: right; font-weight: 500;">${name}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 12px 0; color: var(--text-secondary);">Dynasty Trail</td><td style="padding: 12px 0; color: var(--gold); text-align: right; font-weight: 600;">${tourName}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 12px 0; color: var(--text-secondary);">Royal Arrival</td><td style="padding: 12px 0; color: var(--ivory); text-align: right;">${date}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 12px 0; color: var(--text-secondary);">Entourage</td><td style="padding: 12px 0; color: var(--ivory); text-align: right;">${guests} Guest(s)</td></tr>
                <tr><td style="padding: 12px 0; color: var(--text-secondary);">Palatial Tier</td><td style="padding: 12px 0; color: var(--ivory); text-align: right;">${tier}</td></tr>
            </table>
        `;
        document.getElementById('bookingSummary').innerHTML = summaryHtml;
    }

    // Modal Operations
    window.openTourModal = (tourId) => {
        const tour = state.tours.find(t => t.id === tourId);
        if (!tour) return;

        elements.modalContent.innerHTML = `
            <button class="modal-close" onclick="closeTourModal()">✕</button>
            <div style="margin-top: 10px;">
                <p class="tour-detail-dynasty" style="margin-bottom: 8px;">${tour.dynasty} Dynasty</p>
                <h2 style="font-family: var(--font-display); font-size: 2.5rem; color: var(--ivory); margin-bottom: 8px;">${tour.title}</h2>
                <p style="font-family: var(--font-accent); font-size: 1.1rem; color: var(--gold); font-style: italic; margin-bottom: 24px;">${tour.tagline}</p>
                
                <div style="display:flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid var(--glass-border);">
                    <div><span style="color:var(--text-muted); font-size: 0.8rem;">DURATION</span><br><span style="color:var(--ivory);">${tour.days} Days</span></div>
                    <div><span style="color:var(--text-muted); font-size: 0.8rem;">PRICE</span><br><span style="color:var(--gold); font-weight:700;">${formatPrice(tour.price)}</span></div>
                    <div><span style="color:var(--text-muted); font-size: 0.8rem;">RATING</span><br><span style="color:var(--gold);">${tour.rating} ★</span></div>
                </div>

                <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 40px;">${tour.description}</p>

                <h3 style="font-family: var(--font-display); font-size: 1.5rem; color: var(--ivory); margin-bottom: 24px; display:flex; align-items:center; gap: 12px;">
                    <span style="color:var(--gold);">✦</span> Royal Itinerary
                </h3>
                
                <div class="itinerary-timeline">
                    ${tour.itinerary.map((day, i) => `
                        <div class="itinerary-item" style="animation: fadeInUp 0.5s ease forwards; animation-delay: ${i * 0.1}s; opacity:0;">
                            <div class="itinerary-dot"></div>
                            <div class="itinerary-day">Day ${day.day}</div>
                            <h4 class="itinerary-title">${day.title}</h4>
                            <p class="itinerary-desc">${day.description}</p>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid var(--glass-border); text-align: center;">
                    <button class="btn-primary" onclick="closeModalAndBook('${tour.id}')">Reserve This Journey</button>
                </div>
            </div>
        `;

        elements.tourModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeTourModal = () => {
        elements.tourModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    window.closeModalAndBook = (tourId) => {
        closeTourModal();
        document.getElementById('tourSelect').value = tourId;
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    };

    // Close modal on outside click
    elements.tourModal.addEventListener('click', (e) => {
        if (e.target === elements.tourModal) closeTourModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.tourModal.classList.contains('active')) {
            closeTourModal();
        }
    });

    // Run Initialization
    init();
});
