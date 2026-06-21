class PageLoader {
    constructor() {
        this.progress = 0;
        this.duration = 3000;
        this.startTime = null;

        this.loader = document.getElementById('loader');
        this.loaderNumber = document.getElementById('loader-number');
        this.wrap = document.getElementById('wrap');

        if (this.loader) {
            this.bgFill = document.createElement('div');
            this.bgFill.className = 'loader-bg-fill';
            this.loader.appendChild(this.bgFill);
        }

        document.body.classList.add('is-loading');

        this.init();
    }

    init() {
        requestAnimationFrame(this.updateProgress);
    }

    customEasing(x) {
        const base = x < 0.5
            ? 4 * x * x * x
            : 1 - Math.pow(-2 * x + 2, 3) / 2;

        const hesitation = Math.sin(x * Math.PI * 6) * 0.04;

        return base - hesitation;
    }

    updateProgress = (timestamp) => {
        if (!this.startTime) {
            this.startTime = timestamp;
        }

        const elapsedTime = timestamp - this.startTime;

        const timeProgress = Math.min(
            elapsedTime / this.duration,
            1
        );

        const easedProgress = this.customEasing(timeProgress);

        const newPercent = Math.floor(
            easedProgress * 100
        );

        if (newPercent > this.progress) {
            this.progress = Math.min(newPercent, 100);
            this.updateDOM();
        }

        if (timeProgress >= 1) {
            this.progress = 100;
            this.updateDOM();
            this.finishLoading();
            return;
        }

        requestAnimationFrame(this.updateProgress);
    };

    updateDOM() {
        if (this.loaderNumber) {
            this.loaderNumber.textContent = `${this.progress}%`;

            this.loaderNumber.style.transition = 'none';
            this.loaderNumber.style.transform = 'translate(-50%,-50%) scale(1)';
            this.loaderNumber.style.opacity = 1;
            this.loaderNumber.style.filter = 'blur(0)';
        }

        if (this.bgFill) {
            this.bgFill.style.height = `${this.progress}%`;
        }
    }

    initHeroIntroOut() {
        if (typeof gsap === 'undefined') return;

        const titles = document.querySelectorAll('.title');
        const logo = document.querySelector('.logo-target');
        const mainContent = document.querySelector('.main-content');
        const hero = document.querySelector('.hero');

        if (!titles.length) return;

        const tl = gsap.timeline();

        gsap.set(
            [logo, mainContent],
            {
                opacity: 0
            }
        );

        titles.forEach((title) => {
            tl.fromTo(
                title,
                {
                    y: '100%',
                    opacity: 0
                },
                {
                    y: '0%',
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power3.out'
                }
            ).to(
                title,
                {
                    y: '-120%',
                    opacity: 0,
                    duration: 0.55,
                    ease: 'power2.inOut'
                },
                '+=.25'
            );
        });

        tl.to(
            '.hero',
            {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => {
                    if (hero) {
                        hero.style.display = 'none';
                    }
                }
            },
            '-=.15'
        ).to(
            [logo, mainContent],
            {
                opacity: 1,
                duration: 0.8,
                stagger: 0.08,
                ease: 'power2.out'
            },
            '-=0.8'
        );
    }

    finishLoading() {
        if (this.loaderNumber) {
            this.loaderNumber.style.transition =
                'opacity .6s cubic-bezier(.25,1,.5,1), transform .6s cubic-bezier(.25,1,.5,1), filter .6s ease';

            this.loaderNumber.style.opacity = '0';
            this.loaderNumber.style.transform = 'translate(-50%,-50%) scale(.9)';
            this.loaderNumber.style.filter = 'blur(10px)';
        }

        setTimeout(() => {
            if (this.wrap) {
                this.wrap.classList.add('is-loaded');

                setTimeout(() => {
                    this.initHeroIntroOut();
                }, 300);
            }

            setTimeout(() => {
                if (this.loader) {
                    if (this.loader.hasAttribute('data-transition')) {
                        this.loader.classList.add('hidden');
                    } else {
                        this.loader.style.transition = 'opacity .8s ease-out';
                        this.loader.style.opacity = '0';
                    }

                    setTimeout(() => {
                        this.loader.style.display = 'none';

                        document.body.classList.remove('is-loading');
                    }, 3000);
                }
            }, 1500);
        }, 600);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PageLoader();
});