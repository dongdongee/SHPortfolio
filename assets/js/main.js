/**
 * =========================================================
 * GSAP Plugin
 * =========================================================
 */

if (
    typeof gsap !== 'undefined' &&
    typeof ScrollTrigger !== 'undefined'
) {
    gsap.registerPlugin(ScrollTrigger);
}


/**
 * =========================================================
 * Main Title Motion
 *
 * SVG 글자를 한 글자씩 분리
 * → 오른쪽에서 왼쪽으로 등장
 * → 글자마다 서로 다른 속도
 * =========================================================
 */

class MainTitleMotion {
    constructor() {
        this.targets = [
            document.querySelector('#title'),
            document.querySelector('#desc')
        ];

        this.splits = [];
        this.timeline = null;
    }

    init() {
        if (
            typeof gsap === 'undefined' ||
            typeof SplitType === 'undefined'
        ) {
            return;
        }

        this.targets.forEach((target) => {
            if (!target) return;

            const split = new SplitType(target, {
                types: 'chars'
            });

            this.splits.push(split);

            split.chars.forEach((char) => {
                gsap.set(char, {
                    x: gsap.utils.random(100, 400),
                    autoAlpha: 0
                });
            });
        });
    }

    play() {
        const chars = this.splits.flatMap(
            (split) => split.chars
        );

        if (!chars.length) return;

        this.timeline = gsap.timeline({
            delay: 0.2
        });

        chars.forEach((char, index) => {
            this.timeline.to(
                char,
                {
                    x: 0,
                    autoAlpha: 1,

                    // 글자마다 다른 속도
                    duration: gsap.utils.random(
                        0.7,
                        1.6
                    ),

                    ease: 'power4.out'
                },

                // 시작 타이밍도 조금씩 다르게
                index * 0.025
            );
        });
    }

    destroy() {
        if (this.timeline) {
            this.timeline.kill();
        }

        this.splits.forEach((split) => {
            split.revert();
        });

        this.splits = [];
    }
}


/**
 * =========================================================
 * SmoothScroll
 * =========================================================
 */

class SmoothScroll {
    constructor(options = {}) {
        this.options = {
            duration:
                options.duration ?? 1.1,

            smoothWheel:
                options.smoothWheel ?? true,

            wheelMultiplier:
                options.wheelMultiplier ?? 0.9,

            touchMultiplier:
                options.touchMultiplier ?? 1
        };


        this.lenis = null;


        this.scrollbar =
            document.querySelector(
                '.scrollbar'
            );


        this.thumb =
            document.querySelector(
                '.scrollbar__thumb'
            );


        this.hideTimer = null;

        this.isInitialized = false;
    }


    /**
     * Lenis 초기화
     */
    init() {
        if (
            typeof Lenis === 'undefined'
        ) {
            console.warn(
                '[SmoothScroll] Lenis가 로드되지 않았습니다.'
            );

            return;
        }


        if (
            this.isInitialized
        ) {
            return;
        }


        this.lenis =
            new Lenis({
                duration:
                    this.options.duration,

                smoothWheel:
                    this.options.smoothWheel,

                wheelMultiplier:
                    this.options.wheelMultiplier,

                touchMultiplier:
                    this.options.touchMultiplier,

                autoRaf: false
            });


        this.lenis.on(
            'scroll',
            (event) => {

                this.updateScrollbar(
                    event
                );


                this.showScrollbar();


                if (
                    typeof ScrollTrigger !==
                    'undefined'
                ) {
                    ScrollTrigger.update();
                }

            }
        );


        if (
            typeof gsap !== 'undefined'
        ) {
            gsap.ticker.add(
                this.raf
            );

            gsap.ticker.lagSmoothing(
                0
            );
        } else {
            requestAnimationFrame(
                this.rafFallback
            );
        }


        this.updateScrollbar();

        this.isInitialized = true;
    }


    raf = (time) => {
        if (
            !this.lenis
        ) {
            return;
        }


        this.lenis.raf(
            time * 1000
        );
    };


    rafFallback = (time) => {
        if (
            !this.lenis
        ) {
            return;
        }


        this.lenis.raf(
            time
        );


        requestAnimationFrame(
            this.rafFallback
        );
    };


    updateScrollbar(event = null) {
        if (
            !this.scrollbar ||
            !this.thumb
        ) {
            return;
        }


        const viewportHeight =
            window.innerHeight;


        const documentHeight =
            document.documentElement
                .scrollHeight;


        if (
            documentHeight <=
            viewportHeight
        ) {
            this.scrollbar.style.display =
                'none';

            return;
        }


        this.scrollbar.style.display =
            'block';


        const ratio =
            viewportHeight /
            documentHeight;


        const thumbHeight =
            Math.max(
                viewportHeight * ratio,
                48
            );


        let progress = 0;


        if (
            event &&
            typeof event.progress ===
            'number'
        ) {
            progress =
                event.progress;
        } else {
            const maxScroll =
                documentHeight -
                viewportHeight;


            progress =
                maxScroll > 0
                    ? window.scrollY /
                        maxScroll
                    : 0;
        }


        progress =
            Math.max(
                0,
                Math.min(
                    progress,
                    1
                )
            );


        const maxMove =
            viewportHeight -
            thumbHeight;


        this.thumb.style.height =
            `${thumbHeight}px`;


        this.thumb.style.transform =
            `translate3d(
                0,
                ${maxMove * progress}px,
                0
            )`;
    }


    showScrollbar() {
        if (
            !this.scrollbar ||
            document.body.classList.contains(
                'is-intro'
            )
        ) {
            return;
        }


        this.scrollbar.classList.add(
            'is-show'
        );


        clearTimeout(
            this.hideTimer
        );


        this.hideTimer =
            setTimeout(
                () => {

                    this.scrollbar.classList.remove(
                        'is-show'
                    );

                },
                10
            );
    }


    stop() {
        if (
            !this.lenis
        ) {
            return;
        }


        this.lenis.stop();


        if (
            this.scrollbar
        ) {
            this.scrollbar.classList.remove(
                'is-show'
            );
        }
    }


    start() {
        if (
            !this.lenis
        ) {
            return;
        }


        this.lenis.start();

        this.resize();
    }


    resize() {
        if (
            this.lenis
        ) {
            this.lenis.resize();
        }


        this.updateScrollbar();


        if (
            typeof ScrollTrigger !==
            'undefined'
        ) {
            requestAnimationFrame(
                () => {

                    ScrollTrigger.refresh();

                }
            );
        }
    }


    destroy() {
        clearTimeout(
            this.hideTimer
        );


        if (
            typeof gsap !== 'undefined'
        ) {
            gsap.ticker.remove(
                this.raf
            );
        }


        if (
            this.lenis
        ) {
            this.lenis.destroy();

            this.lenis = null;
        }


        this.isInitialized =
            false;
    }
}


/**
 * =========================================================
 * HeroIntro
 * =========================================================
 */

class HeroIntro {
    constructor(options = {}) {
        this.selector =
            options.selector ??
            '.hero__container .hero__title';


        this.heroSelector =
            options.heroSelector ??
            '.hero';


        this.contentSelector =
            options.contentSelector ??
            '#wrap';


        this.onComplete =
            options.onComplete ??
            null;


        this.hero =
            document.querySelector(
                this.heroSelector
            );


        this.content =
            document.querySelector(
                this.contentSelector
            );


        this.timeline = null;
    }


    /**
     * Hero 실행
     */
    play() {
        if (
            typeof gsap === 'undefined'
        ) {
            this.complete();

            return;
        }


        const titles =
            gsap.utils.toArray(
                this.selector
            );


        if (
            !titles.length ||
            !this.hero ||
            !this.content
        ) {
            this.complete();

            return;
        }


        gsap.set(
            this.content,
            {
                autoAlpha: 0
            }
        );


        gsap.set(
            titles,
            {
                yPercent: 100,
                autoAlpha: 0
            }
        );


        this.timeline =
            gsap.timeline({
                onComplete: () => {
                    this.complete();
                }
            });


        titles.forEach(
            (title) => {

                this.timeline.to(
                    title,
                    {
                        yPercent: 0,

                        autoAlpha: 1,

                        duration: 0.52,

                        ease:
                            'power3.out'
                    }
                );


                this.timeline.to(
                    title,
                    {
                        yPercent: -120,

                        autoAlpha: 0,

                        duration: 0.48,

                        ease:
                            'power2.inOut'
                    },

                    '+=0.16'
                );

            }
        );
    }


    /**
     * Hero 종료
     */
    complete() {
        if (
            this.hero
        ) {
            gsap.set(
                this.hero,
                {
                    display: 'none'
                }
            );
        }


        if (
            this.content
        ) {
            gsap.to(
                this.content,
                {
                    autoAlpha: 1,

                    duration: 0.5,

                    ease:
                        'power2.out',

                    /**
                     * #wrap이 나타난 다음
                     * 메인 글자 애니메이션
                     */
                    onComplete: () => {

                        if (
                            typeof this.onComplete ===
                            'function'
                        ) {
                            this.onComplete();
                        }

                    }
                }
            );
        }


        document.body.classList.remove(
            'is-intro'
        );
    }


    destroy() {
        if (
            !this.timeline
        ) {
            return;
        }


        this.timeline.kill();

        this.timeline = null;
    }
}


/**
 * =========================================================
 * MainApp
 * =========================================================
 */

class MainApp {
    constructor() {

        this.smoothScroll =
            new SmoothScroll({
                duration: 1.1,
                smoothWheel: true,
                wheelMultiplier: 0.9,
                touchMultiplier: 1
            });


        /**
         * Main title motion
         */
        this.mainTitleMotion =
            new MainTitleMotion();


        /**
         * Hero
         */
        this.heroIntro =
            new HeroIntro({

                onComplete: () => {

                    /**
                     * Main SVG animation
                     */
                    this.mainTitleMotion.play();


                    /**
                     * Scroll 활성화
                     */
                    this.smoothScroll.start();

                }

            });
    }


    init() {
        this.smoothScroll.init();

        this.smoothScroll.stop();

        this.heroIntro.play();

    this.mainTitleMotion.init();

        window.addEventListener(
            'resize',
            this.handleResize,
            {
                passive: true
            }
        );
    }


    handleResize = () => {

        this.smoothScroll.resize();

    };


    destroy() {
        window.removeEventListener(
            'resize',
            this.handleResize
        );


        this.heroIntro.destroy();

        this.mainTitleMotion.destroy();

        this.smoothScroll.destroy();
    }
}


/**
 * =========================================================
 * App Start
 * =========================================================
 */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const app =
            new MainApp();


        app.init();


        window.mainApp =
            app;
    }
);