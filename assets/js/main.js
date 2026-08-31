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
 * SmoothScroll
 * ---------------------------------------------------------
 * Lenis + Custom Scrollbar
 *
 * - 기본 브라우저 스크롤바는 CSS에서 숨김
 * - Lenis로 부드러운 스크롤 처리
 * - 실제 스크롤 중에만 커스텀 scrollbar 노출
 * =========================================================
 */
class SmoothScroll {
    constructor(options = {}) {
        this.options = {
            duration: options.duration ?? 1.1,
            smoothWheel: options.smoothWheel ?? true,
            wheelMultiplier: options.wheelMultiplier ?? 0.9,
            touchMultiplier: options.touchMultiplier ?? 1
        };

        this.lenis = null;

        this.scrollbar =
            document.querySelector('.scrollbar');

        this.thumb =
            document.querySelector('.scrollbar__thumb');

        this.hideTimer = null;
        this.isInitialized = false;
    }


    /**
     * Lenis 초기화
     */
    init() {
        if (typeof Lenis === 'undefined') {
            console.warn(
                '[SmoothScroll] Lenis가 로드되지 않았습니다.'
            );

            return;
        }

        if (this.isInitialized) {
            return;
        }

        this.lenis = new Lenis({
            duration: this.options.duration,
            smoothWheel: this.options.smoothWheel,
            wheelMultiplier: this.options.wheelMultiplier,
            touchMultiplier: this.options.touchMultiplier,
            autoRaf: false
        });


        /**
         * 스크롤 이벤트
         */
        this.lenis.on('scroll', (event) => {

            this.updateScrollbar(event);
            this.showScrollbar();

            if (
                typeof ScrollTrigger !== 'undefined'
            ) {
                ScrollTrigger.update();
            }
        });


        /**
         * GSAP ticker와 Lenis 연결
         */
        if (typeof gsap !== 'undefined') {

            gsap.ticker.add(this.raf);

            gsap.ticker.lagSmoothing(0);
        } else {

            requestAnimationFrame(this.rafFallback);
        }


        /**
         * 최초 scrollbar 사이즈 계산
         */
        this.updateScrollbar();

        this.isInitialized = true;
    }


    /**
     * GSAP ticker → Lenis
     */
    raf = (time) => {
        if (!this.lenis) {
            return;
        }

        this.lenis.raf(time * 1000);
    };


    /**
     * GSAP이 없을 경우 fallback
     */
    rafFallback = (time) => {
        if (!this.lenis) {
            return;
        }

        this.lenis.raf(time);

        requestAnimationFrame(
            this.rafFallback
        );
    };


    /**
     * Custom Scrollbar 위치 / 높이
     */
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
            document.documentElement.scrollHeight;


        /**
         * 스크롤이 필요하지 않을 경우
         */
        if (documentHeight <= viewportHeight) {

            this.scrollbar.style.display = 'none';

            return;
        }

        this.scrollbar.style.display = 'block';


        /**
         * thumb 높이
         */
        const ratio =
            viewportHeight / documentHeight;

        const thumbHeight =
            Math.max(
                viewportHeight * ratio,
                48
            );


        /**
         * 현재 scroll progress
         */
        let progress = 0;

        if (
            event &&
            typeof event.progress === 'number'
        ) {
            progress = event.progress;
        } else {

            const maxScroll =
                documentHeight - viewportHeight;

            progress =
                maxScroll > 0
                    ? window.scrollY / maxScroll
                    : 0;
        }


        progress =
            Math.max(
                0,
                Math.min(progress, 1)
            );


        const maxMove =
            viewportHeight - thumbHeight;


        this.thumb.style.height =
            `${thumbHeight}px`;

        this.thumb.style.transform =
            `translate3d(0, ${maxMove * progress}px, 0)`;
    }


    /**
     * 스크롤할 때 scrollbar 표시
     */
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
            setTimeout(() => {

                this.scrollbar.classList.remove(
                    'is-show'
                );

            }, 10);
    }


    /**
     * 스크롤 정지
     */
    stop() {
        if (!this.lenis) {
            return;
        }

        this.lenis.stop();

        if (this.scrollbar) {
            this.scrollbar.classList.remove(
                'is-show'
            );
        }
    }


    /**
     * 스크롤 활성화
     */
    start() {
        if (!this.lenis) {
            return;
        }

        this.lenis.start();

        this.resize();
    }


    /**
     * 문서 높이 재계산
     */
    resize() {
        if (this.lenis) {
            this.lenis.resize();
        }

        this.updateScrollbar();

        if (
            typeof ScrollTrigger !== 'undefined'
        ) {
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        }
    }


    /**
     * 특정 위치 이동
     */
    scrollTo(target, options = {}) {
        if (!this.lenis) {
            return;
        }

        this.lenis.scrollTo(
            target,
            {
                offset:
                    options.offset ?? 0,

                duration:
                    options.duration ??
                    this.options.duration,

                immediate:
                    options.immediate ?? false,

                force:
                    options.force ?? false
            }
        );
    }


    /**
     * 제거
     */
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

        if (this.lenis) {
            this.lenis.destroy();

            this.lenis = null;
        }

        this.isInitialized = false;
    }
}


/**
 * =========================================================
 * HeroIntro
 * ---------------------------------------------------------
 * 중앙 문구 3개 순차 등장
 *
 * 아래 → 중앙
 * → 위로 올라가면서 사라짐
 * → Hero 종료
 * → 실제 페이지 노출
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
        if (typeof gsap === 'undefined') {
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


        /**
         * 실제 페이지 숨김
         */
        gsap.set(
            this.content,
            {
                autoAlpha: 0
            }
        );


        /**
         * Intro Title 초기 상태
         */
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

                /**
                 * 아래 → 중앙
                 */
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


                /**
                 * 중앙 → 위
                 */
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
        if (this.hero) {

            if (
                typeof gsap !== 'undefined'
            ) {
                gsap.set(
                    this.hero,
                    {
                        display: 'none'
                    }
                );
            } else {

                this.hero.style.display =
                    'none';
            }
        }


        /**
         * 실제 페이지 노출
         */
        if (this.content) {

            if (
                typeof gsap !== 'undefined'
            ) {
                gsap.to(
                    this.content,
                    {
                        autoAlpha: 1,

                        duration: 0.5,

                        ease:
                            'power2.out'
                    }
                );
            } else {

                this.content.style.opacity =
                    '1';

                this.content.style.visibility =
                    'visible';
            }
        }


        /**
         * Intro 상태 종료
         */
        document.body.classList.remove(
            'is-intro'
        );


        /**
         * 외부 완료 콜백
         */
        if (
            typeof this.onComplete ===
            'function'
        ) {
            this.onComplete();
        }
    }


    /**
     * 제거
     */
    destroy() {
        if (!this.timeline) {
            return;
        }

        this.timeline.kill();

        this.timeline = null;
    }
}


/**
 * =========================================================
 * MainApp
 * ---------------------------------------------------------
 * 메인 페이지 전체 실행 순서 관리
 *
 * SmoothScroll 초기화
 * → 스크롤 정지
 * → HeroIntro
 * → Hero 종료
 * → 스크롤 활성화
 * =========================================================
 */
class MainApp {
    constructor() {

        /**
         * Smooth Scroll
         */
        this.smoothScroll =
            new SmoothScroll({
                duration: 1.1,
                smoothWheel: true,
                wheelMultiplier: 0.9,
                touchMultiplier: 1
            });


        /**
         * Hero Intro
         */
        this.heroIntro =
            new HeroIntro({
                onComplete: () => {

                    this.smoothScroll.start();
                }
            });
    }


    /**
     * 실행
     */
    init() {

        /**
         * Lenis 초기화
         */
        this.smoothScroll.init();


        /**
         * Hero 동안 스크롤 정지
         */
        this.smoothScroll.stop();


        /**
         * Hero 시작
         */
        this.heroIntro.play();


        /**
         * Resize
         */
        window.addEventListener(
            'resize',
            this.handleResize,
            {
                passive: true
            }
        );
    }


    /**
     * Resize
     */
    handleResize = () => {

        this.smoothScroll.resize();
    };


    /**
     * 제거
     */
    destroy() {

        window.removeEventListener(
            'resize',
            this.handleResize
        );

        this.heroIntro.destroy();
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


        /**
         * 개발 중 콘솔 접근용
         */
        window.mainApp = app;
    }
);