/* *********************************
 * Project Swiper
 * ********************************* */

function initProjectSwiper() {
    const swiper = document.querySelector('.js-project-swiper');

    if (!swiper) return;

    new Swiper(swiper, {
        effect: 'fade',
        pagination: {
            el: swiper.querySelector('.swiper-pagination'),
            clickable: true,
        },
        loop: false,
    });
}


/* *********************************
 * Progress Bar
 * ********************************* */

function initProgressBar() {
    const progressBars = document.querySelectorAll('.js-progress');

    progressBars.forEach((bar) => {
        const value = Number(bar.dataset.value) || 0;
        const progress = Math.min(100, Math.max(0, value));

        bar.style.setProperty('--progress', `${progress}%`);
    });
}



initProgressBar();
initProjectSwiper();