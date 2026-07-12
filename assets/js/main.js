/**
 * =========================================================
 * GSAP Plugin
 * ---------------------------------------------------------
 * ScrollTrigger가 로드된 경우에만 플러그인을 등록한다.
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
 * Lenis를 사용해 브라우저의 기본 스크롤을 부드럽게 보간한다.
 *
 * GSAP ScrollTrigger와 동일한 RAF 흐름을 사용하기 위해
 * Lenis의 autoRaf는 사용하지 않고 GSAP ticker에 연결한다.
 *
 * 실행 흐름
 * init()
 * → Lenis 생성
 * → ScrollTrigger 연결
 * → GSAP ticker 연결
 *
 * stop()
 * → Loader 및 Hero Intro 동안 스크롤 정지
 *
 * start()
 * → Hero Intro 종료 후 스크롤 활성화
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
        this.isInitialized = false;
    }

    /**
     * Lenis 초기화
     */
    init() {
        /**
         * Lenis가 로드되지 않은 경우
         * 브라우저의 기본 스크롤을 사용한다.
         */
        if (typeof Lenis === 'undefined') {
            console.warn('[SmoothScroll] Lenis가 로드되지 않았습니다.');
            return;
        }

        /**
         * 중복 초기화 방지
         */
        if (this.isInitialized) {
            return;
        }

        this.lenis = new Lenis({
            duration: this.options.duration,
            smoothWheel: this.options.smoothWheel,
            wheelMultiplier: this.options.wheelMultiplier,
            touchMultiplier: this.options.touchMultiplier,

            /**
             * RAF는 GSAP ticker가 담당한다.
             */
            autoRaf: false
        });

        /**
         * Lenis의 스크롤 위치가 갱신될 때마다
         * ScrollTrigger에도 현재 위치를 전달한다.
         */
        if (
            typeof ScrollTrigger !== 'undefined' &&
            typeof gsap !== 'undefined'
        ) {
            this.lenis.on('scroll', ScrollTrigger.update);

            /**
             * GSAP ticker의 매 프레임마다 Lenis를 갱신한다.
             */
            gsap.ticker.add(this.raf);

            /**
             * 브라우저 탭 비활성화 등으로 프레임이 밀렸을 때
             * 누적된 시간을 한꺼번에 보정하지 않도록 설정한다.
             */
            gsap.ticker.lagSmoothing(0);
        }

        this.isInitialized = true;
    }

    /**
     * GSAP ticker → Lenis RAF 연결
     *
     * GSAP은 초 단위,
     * Lenis는 밀리초 단위를 사용하므로 1000을 곱한다.
     */
    raf = (time) => {
        if (!this.lenis) {
            return;
        }

        this.lenis.raf(time * 1000);
    };

    /**
     * Lenis 스크롤 활성화
     */
    start() {
        if (!this.lenis) {
            return;
        }

        this.lenis.start();
    }

    /**
     * Lenis 스크롤 정지
     */
    stop() {
        if (!this.lenis) {
            return;
        }

        this.lenis.stop();
    }

    /**
     * 특정 요소 또는 위치로 스크롤
     *
     * 사용 예시:
     * window.portfolioApp.smoothScroll.scrollTo('#work');
     */
    scrollTo(target, options = {}) {
        if (!this.lenis) {
            return;
        }

        this.lenis.scrollTo(target, {
            offset: options.offset ?? 0,
            duration: options.duration ?? this.options.duration,
            immediate: options.immediate ?? false,
            force: options.force ?? false,
            lock: options.lock ?? false,
            onComplete: options.onComplete ?? null
        });
    }

    /**
     * Lenis가 문서 높이를 다시 계산하도록 한다.
     */
    resize() {
        if (!this.lenis) {
            return;
        }

        this.lenis.resize();
    }

    /**
     * Lenis와 GSAP ticker 연결 제거
     */
    destroy() {
        if (!this.lenis) {
            return;
        }

        if (typeof gsap !== 'undefined') {
            gsap.ticker.remove(this.raf);
        }

        this.lenis.destroy();

        this.lenis = null;
        this.isInitialized = false;
    }
}


/**
 * =========================================================
 * PageLoader
 * ---------------------------------------------------------
 * 로딩 퍼센트와 로더 화면을 담당한다.
 *
 * 실행 흐름
 * 0% → 100%
 * → 페이지 노출
 * → Hero Intro 시작
 * → 로더 퇴장
 *
 * 스크롤 잠금 해제는 여기서 처리하지 않는다.
 * Hero Intro가 끝난 뒤 PortfolioApp에서 해제한다.
 * =========================================================
 */
class PageLoader {
    constructor(options = {}) {
        this.progress = 0;
        this.duration = options.duration ?? 3000;
        this.startTime = null;

        this.onComplete = options.onComplete ?? null;

        this.loader = document.getElementById('loader');
        this.loaderNumber = document.getElementById('loader-number');
        this.wrap = document.getElementById('wrap');

        this.bgFill = null;

        this.createBackgroundFill();

        /**
         * JS가 실행된 직후 스크롤 잠금
         */
        document.body.classList.add('is-loading');
    }

    /**
     * 로더의 배경 채움 요소 생성
     */
    createBackgroundFill() {
        if (!this.loader) {
            return;
        }

        /**
         * 이미 생성된 요소가 있다면 중복 생성하지 않는다.
         */
        const existingFill = this.loader.querySelector(
            '.loader-bg-fill'
        );

        if (existingFill) {
            this.bgFill = existingFill;
            return;
        }

        this.bgFill = document.createElement('div');
        this.bgFill.className = 'loader-bg-fill';

        this.loader.appendChild(this.bgFill);
    }

    /**
     * 로딩 진행률 애니메이션 시작
     */
    start() {
        requestAnimationFrame(this.updateProgress);
    }

    /**
     * 로딩 숫자에 사용할 커스텀 easing
     *
     * 기본 cubic easing에 작은 흔들림을 섞어
     * 진행률이 기계적으로 증가하지 않도록 만든다.
     */
    customEasing(x) {
        const base = x < 0.5
            ? 4 * x * x * x
            : 1 - Math.pow(-2 * x + 2, 3) / 2;

        const hesitation =
            Math.sin(x * Math.PI * 6) * 0.04;

        return Math.max(
            0,
            Math.min(base - hesitation, 1)
        );
    }

    /**
     * requestAnimationFrame으로 진행률 계산
     */
    updateProgress = (timestamp) => {
        /**
         * 첫 프레임 시간을 시작 시간으로 저장한다.
         */
        if (!this.startTime) {
            this.startTime = timestamp;
        }

        const elapsedTime =
            timestamp - this.startTime;

        /**
         * 현재 진행 시간을 0~1 범위로 변환한다.
         */
        const timeProgress = Math.min(
            elapsedTime / this.duration,
            1
        );

        const easedProgress =
            this.customEasing(timeProgress);

        const newPercent =
            Math.floor(easedProgress * 100);

        /**
         * 숫자가 이전 진행률보다 커졌을 때만
         * DOM을 업데이트한다.
         */
        if (newPercent > this.progress) {
            this.progress = Math.min(
                newPercent,
                100
            );

            this.updateDOM();
        }

        /**
         * 로딩 시간이 모두 지나면 완료 처리한다.
         */
        if (timeProgress >= 1) {
            this.progress = 100;

            this.updateDOM();
            this.finish();

            return;
        }

        requestAnimationFrame(
            this.updateProgress
        );
    };

    /**
     * 진행률을 DOM에 반영
     */
    updateDOM() {
        if (this.loaderNumber) {
            this.loaderNumber.textContent =
                `${this.progress}%`;

            this.loaderNumber.style.transition =
                'none';

            this.loaderNumber.style.transform =
                'translate(-50%, -50%) scale(1)';

            this.loaderNumber.style.opacity =
                '1';

            this.loaderNumber.style.filter =
                'blur(0)';
        }

        /**
         * 배경이 아래에서 위로 차오르도록
         * 진행률을 높이에 반영한다.
         */
        if (this.bgFill) {
            this.bgFill.style.height =
                `${this.progress}%`;
        }
    }

    /**
     * 100% 완료 후 처리
     *
     * 페이지를 먼저 노출하고 Hero Intro를 시작한다.
     * 그 위에서 로더가 자연스럽게 퇴장한다.
     */
    finish() {
        this.hideLoaderNumber();

        setTimeout(() => {
            this.showPage();

            /**
             * 외부 콜백을 통해 Hero Intro 시작
             */
            this.complete();

            /**
             * Hero 시작 직후 로더 퇴장
             */
            setTimeout(() => {
                this.hideLoader();
            }, 250);
        }, 350);
    }

    /**
     * 로딩 숫자 퇴장
     */
    hideLoaderNumber() {
        if (!this.loaderNumber) {
            return;
        }

        this.loaderNumber.style.transition =
            'opacity .45s cubic-bezier(.25, 1, .5, 1), ' +
            'transform .45s cubic-bezier(.25, 1, .5, 1), ' +
            'filter .45s ease';

        this.loaderNumber.style.opacity =
            '0';

        this.loaderNumber.style.transform =
            'translate(-50%, -50%) scale(.9)';

        this.loaderNumber.style.filter =
            'blur(10px)';
    }

    /**
     * 실제 페이지 노출
     */
    showPage() {
        if (!this.wrap) {
            return;
        }

        this.wrap.classList.add('is-loaded');
    }

    /**
     * 로더 화면 퇴장
     *
     * 여기서는 body.is-loading을 제거하지 않는다.
     * Hero Intro가 끝날 때까지 스크롤 잠금을 유지한다.
     */
    hideLoader() {
        if (!this.loader) {
            return;
        }

        if (
            this.loader.hasAttribute(
                'data-transition'
            )
        ) {
            this.loader.classList.add('hidden');
        } else {
            this.loader.style.transition =
                'opacity .6s ease-out';

            this.loader.style.opacity =
                '0';
        }

        /**
         * CSS transition이 완료된 뒤
         * 로더를 화면에서 완전히 제거한다.
         */
        setTimeout(() => {
            this.loader.style.display = 'none';
        }, 1250);
    }

    /**
     * 외부 완료 콜백 실행
     */
    complete() {
        if (
            typeof this.onComplete === 'function'
        ) {
            this.onComplete();
        }
    }
}


/**
 * =========================================================
 * HeroIntro
 * ---------------------------------------------------------
 * Hero 중앙 문구 3개를 순차적으로 보여준다.
 *
 * 실행 흐름
 * 문구 등장
 * → 문구 퇴장
 * → Hero 전체 페이드아웃
 * → MainIntro 실행
 * → 스크롤 활성화
 * =========================================================
 */
class HeroIntro {
    constructor(options = {}) {
        this.selector =
            options.selector ?? '.title';

        this.heroSelector =
            options.heroSelector ?? '.hero';

        this.onComplete =
            options.onComplete ?? null;

        this.hero = document.querySelector(
            this.heroSelector
        );

        this.timeline = null;
    }

    /**
     * Hero 애니메이션 실행
     */
    play() {
        /**
         * GSAP이 없는 경우 Hero를 즉시 제거하고
         * 다음 단계로 넘어간다.
         */
        if (typeof gsap === 'undefined') {
            this.hideImmediately();
            return;
        }

        const titles = gsap.utils.toArray(
            this.selector
        );

        /**
         * 타이틀 요소가 없는 경우 즉시 완료 처리
         */
        if (!titles.length) {
            this.hideImmediately();
            return;
        }

        this.timeline = gsap.timeline({
            onComplete: () => {
                this.complete();
            }
        });

        /**
         * 각 문구를 순차적으로 등장시키고 퇴장시킨다.
         */
        titles.forEach((title) => {
            this.timeline
                .fromTo(
                    title,
                    {
                        yPercent: 100,
                        opacity: 0
                    },
                    {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.52,
                        ease: 'power3.out'
                    }
                )
                .to(
                    title,
                    {
                        yPercent: -120,
                        opacity: 0,
                        duration: 0.48,
                        ease: 'power2.inOut'
                    },
                    '+=0.16'
                );
        });

        /**
         * 마지막 문구가 퇴장하는 동안
         * Hero 전체 페이드아웃을 겹쳐 실행한다.
         */
        this.timeline.to(
            this.hero,
            {
                opacity: 0,
                duration: 0.45,
                ease: 'power2.out'
            },
            '-=0.32'
        );
    }

    /**
     * GSAP이 없을 경우 즉시 제거
     */
    hideImmediately() {
        if (this.hero) {
            this.hero.style.display = 'none';
        }

        this.complete();
    }

    /**
     * Hero 완료 처리
     */
    complete() {
        if (this.hero) {
            this.hero.style.display = 'none';
        }

        if (
            typeof this.onComplete === 'function'
        ) {
            this.onComplete();
        }
    }

    /**
     * Hero 타임라인 제거
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
 * MainIntro
 * ---------------------------------------------------------
 * 메인 소개 텍스트의 SplitType 및 stagger를 담당한다.
 *
 * 실행 흐름
 * 웹퍼블리셔, 박상호
 * → 설명 문구
 * =========================================================
 */
class MainIntro {
    constructor(options = {}) {
        this.contentSelector =
            options.contentSelector ??
            '.c-main--content';

        this.titleSelector =
            options.titleSelector ??
            '.c-main--txt__title';

        this.textSelector =
            options.textSelector ??
            '.c-main--txt__text';

        this.mainContent =
            document.querySelector(
                this.contentSelector
            );

        this.title =
            document.querySelector(
                this.titleSelector
            );

        this.text =
            document.querySelector(
                this.textSelector
            );

        this.titleSplit = null;
        this.textSplit = null;
        this.timeline = null;
    }

    /**
     * 메인 텍스트 애니메이션 실행
     */
    play() {
        if (
            !this.mainContent ||
            !this.title ||
            !this.text
        ) {
            return;
        }

        /**
         * GSAP 또는 SplitType이 없으면
         * 애니메이션 없이 콘텐츠를 노출한다.
         */
        if (
            typeof gsap === 'undefined' ||
            typeof SplitType === 'undefined'
        ) {
            this.showWithoutAnimation();
            return;
        }

        /**
         * 중복 실행 방지
         */
        if (
            this.mainContent.dataset.animated ===
            'true'
        ) {
            return;
        }

        this.mainContent.dataset.animated =
            'true';

        this.splitText();
        this.setInitialState();
        this.createTimeline();
    }

    /**
     * 제목과 설명을 줄·글자 단위로 분리
     */
    splitText() {
        this.titleSplit = new SplitType(
            this.title,
            {
                types: 'lines, chars',
                tagName: 'span'
            }
        );

        this.textSplit = new SplitType(
            this.text,
            {
                types: 'lines, chars',
                tagName: 'span'
            }
        );
    }

    /**
     * 메인 텍스트 초기 상태 설정
     */
    setInitialState() {
        /**
         * 메인 콘텐츠를 애니메이션 직전에 노출한다.
         */
        gsap.set(this.mainContent, {
            autoAlpha: 1
        });

        /**
         * 메인 제목 글자 초기 상태
         */
        gsap.set(this.titleSplit.chars, {
            yPercent: () =>
                gsap.utils.random(90, 160),

            rotation: () =>
                gsap.utils.random(-9, 9),

            scaleY: () =>
                gsap.utils.random(1.05, 1.2),

            opacity: 0,
            filter: 'blur(9px)',
            transformOrigin: '50% 100%'
        });

        /**
         * 설명 문구 글자 초기 상태
         */
        gsap.set(this.textSplit.chars, {
            yPercent: () =>
                gsap.utils.random(60, 115),

            rotation: () =>
                gsap.utils.random(-4, 4),

            opacity: 0,
            filter: 'blur(6px)',
            transformOrigin: '50% 100%'
        });
    }

    /**
     * 제목과 설명 stagger 타임라인 생성
     */
    createTimeline() {
        this.timeline = gsap.timeline({
            defaults: {
                overwrite: 'auto'
            }
        });

        /**
         * 메인 제목 등장
         */
        this.timeline.to(
            this.titleSplit.chars,
            {
                yPercent: 0,
                rotation: 0,
                scaleY: 1,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.85,

                stagger: {
                    each: 0.035,
                    from: 'random'
                },

                ease: 'expo.out'
            }
        );

        /**
         * 설명 문구 등장
         *
         * 제목 애니메이션이 끝나기 전에
         * 겹쳐서 실행한다.
         */
        this.timeline.to(
            this.textSplit.chars,
            {
                yPercent: 0,
                rotation: 0,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.68,

                stagger: {
                    each: 0.01,
                    from: 'random'
                },

                ease: 'power4.out'
            },
            '-=0.6'
        );
    }

    /**
     * 애니메이션 없이 즉시 노출
     */
    showWithoutAnimation() {
        if (!this.mainContent) {
            return;
        }

        this.mainContent.style.visibility =
            'visible';

        this.mainContent.style.opacity =
            '1';
    }

    /**
     * SplitType과 GSAP 타임라인 원상복구
     */
    revert() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }

        if (this.titleSplit) {
            this.titleSplit.revert();
            this.titleSplit = null;
        }

        if (this.textSplit) {
            this.textSplit.revert();
            this.textSplit = null;
        }

        if (this.mainContent) {
            delete this.mainContent.dataset
                .animated;
        }
    }
}


/**
 * =========================================================
 * ScrollTextReveal
 * ---------------------------------------------------------
 * .text-exam 요소가 화면에 들어올 때
 * SplitType으로 글자를 분리하고 stagger로 등장시킨다.
 *
 * exam1, exam2, exam3, exam4는 각각 독립된
 * ScrollTrigger를 가진다.
 *
 * 실행 흐름
 * init()
 * → 대상 요소 조회
 * → 글자 단위 분리
 * → 초기 상태 지정
 * → ScrollTrigger 생성
 * → 화면 진입 시 stagger 실행
 * =========================================================
 */
class ScrollTextReveal {
    constructor(options = {}) {
        this.selector =
            options.selector ?? '.text-exam';

        /**
         * 요소 상단이 뷰포트 높이의 85% 지점에
         * 도달하면 애니메이션을 시작한다.
         */
        this.start =
            options.start ?? 'top 85%';

        this.duration =
            options.duration ?? 0.9;

        this.stagger =
            options.stagger ?? 0.07;

        this.ease =
            options.ease ?? 'power4.out';

        this.from =
            options.from ?? 'start';

        this.once =
            options.once ?? true;

        this.splits = [];
        this.animations = [];
    }

    /**
     * 모든 스크롤 텍스트 애니메이션 초기화
     */
    init() {
        if (
            typeof gsap === 'undefined' ||
            typeof ScrollTrigger ===
                'undefined' ||
            typeof SplitType === 'undefined'
        ) {
            console.warn(
                '[ScrollTextReveal] 필요한 라이브러리가 로드되지 않았습니다.'
            );

            return;
        }

        const elements =
            gsap.utils.toArray(this.selector);

        if (!elements.length) {
            return;
        }

        elements.forEach((element) => {
            this.createAnimation(element);
        });
    }

    /**
     * 개별 텍스트 애니메이션 생성
     */
    createAnimation(element) {
        /**
         * 같은 요소에 중복 적용되는 것을 방지한다.
         */
        if (
            element.dataset.scrollAnimated ===
            'true'
        ) {
            return;
        }

        element.dataset.scrollAnimated =
            'true';

        /**
         * 텍스트를 글자 단위로 분리한다.
         *
         * exam1
         * → e / x / a / m / 1
         */
        const split = new SplitType(
            element,
            {
                types: 'chars',
                tagName: 'span'
            }
        );

        this.splits.push(split);

        /**
         * 각 글자의 초기 상태
         */
        gsap.set(split.chars, {
            yPercent: 120,

            rotation: () =>
                gsap.utils.random(-8, 8),

            opacity: 0,
            filter: 'blur(10px)',
            transformOrigin: '50% 100%'
        });

        /**
         * 화면 진입 시 글자 stagger 등장
         */
        const animation = gsap.to(
            split.chars,
            {
                yPercent: 0,
                rotation: 0,
                opacity: 1,
                filter: 'blur(0px)',

                duration: this.duration,
                ease: this.ease,

                stagger: {
                    each: this.stagger,
                    from: this.from
                },

                scrollTrigger: {
                    trigger: element,
                    start: this.start,

                    /**
                     * true면 첫 진입 시 한 번만 실행된다.
                     */
                    once: this.once,

                    /**
                     * 개발 중 시작 위치를 확인하려면
                     * true로 변경한다.
                     */
                    markers: false,

                    /**
                     * 아래 설정은 once가 false인 경우에 사용한다.
                     *
                     * 진입 시 재생
                     * 아래로 지나가면 유지
                     * 역방향으로 다시 진입하면 역재생
                     */
                    toggleActions:
                        'play none none reverse'
                }
            }
        );

        this.animations.push(animation);
    }

    /**
     * ScrollTrigger, GSAP, SplitType 제거
     */
    destroy() {
        this.animations.forEach(
            (animation) => {
                if (
                    animation.scrollTrigger
                ) {
                    animation.scrollTrigger.kill();
                }

                animation.kill();
            }
        );

        this.splits.forEach((split) => {
            split.revert();
        });

        document
            .querySelectorAll(this.selector)
            .forEach((element) => {
                delete element.dataset
                    .scrollAnimated;
            });

        this.animations = [];
        this.splits = [];
    }
}


/**
 * =========================================================
 * PortfolioApp
 * ---------------------------------------------------------
 * 각 클래스의 생성과 실행 순서를 연결한다.
 *
 * 전체 실행 흐름
 * SmoothScroll 초기화
 * → ScrollTextReveal 초기화
 * → 스크롤 정지
 * → PageLoader 실행
 * → HeroIntro 실행
 * → MainIntro 실행
 * → 스크롤 활성화
 * → ScrollTrigger 재계산
 * =========================================================
 */
class PortfolioApp {
    constructor() {
        /**
         * Lenis 부드러운 스크롤
         */
        this.smoothScroll =
            new SmoothScroll({
                duration: 1.1,
                smoothWheel: true,
                wheelMultiplier: 0.9,
                touchMultiplier: 1
            });

        /**
         * 메인 소개 텍스트 애니메이션
         */
        this.mainIntro =
            new MainIntro();

        /**
         * section 진입 텍스트 애니메이션
         */
        this.scrollTextReveal =
            new ScrollTextReveal({
                selector: '.text-exam',

                /**
                 * 조금 더 늦게 실행:
                 * 'top 75%'
                 *
                 * 조금 더 일찍 실행:
                 * 'top 90%'
                 */
                start: 'top 85%',

                duration: 0.9,
                stagger: 0.07,
                ease: 'power4.out',

                /**
                 * start:
                 * 왼쪽 글자부터 순차 실행
                 *
                 * random:
                 * 무작위 순서 실행
                 *
                 * center:
                 * 중앙에서 바깥쪽으로 실행
                 */
                from: 'start',

                /**
                 * true:
                 * 처음 한 번만 실행
                 *
                 * false:
                 * 스크롤을 되돌리면 역재생
                 */
                once: true
            });

        /**
         * Hero Intro
         *
         * Hero 종료 후 메인 텍스트를 실행하고
         * 사용자 스크롤을 활성화한다.
         */
        this.heroIntro =
            new HeroIntro({
                onComplete: () => {
                    this.mainIntro.play();
                    this.enableScroll();
                }
            });

        /**
         * Page Loader
         *
         * 로더 완료 후 Hero Intro를 실행한다.
         */
        this.pageLoader =
            new PageLoader({
                duration: 3000,

                onComplete: () => {
                    this.heroIntro.play();
                }
            });
    }

    /**
     * 애플리케이션 초기 실행
     */
    init() {
        /**
         * Lenis 생성 및 GSAP ticker 연결
         */
        this.smoothScroll.init();

        /**
         * .text-exam ScrollTrigger 생성
         */
        this.scrollTextReveal.init();

        /**
         * Loader와 Hero Intro가 진행되는 동안
         * 사용자 스크롤을 막는다.
         */
        this.disableScroll();

        /**
         * Loader 시작
         */
        this.pageLoader.start();

        /**
         * 브라우저 크기가 바뀌면
         * Lenis와 ScrollTrigger를 재계산한다.
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
     * 스크롤 잠금
     */
    disableScroll() {
        document.body.classList.add(
            'is-loading'
        );

        this.smoothScroll.stop();
    }

    /**
     * 스크롤 활성화
     *
     * Hero Intro가 모두 끝난 뒤 호출된다.
     */
    enableScroll() {
        /**
         * body overflow 잠금 해제
         */
        document.body.classList.remove(
            'is-loading'
        );

        /**
         * Lenis 활성화
         */
        this.smoothScroll.start();

        /**
         * Hero가 display:none으로 바뀌고
         * body overflow가 변경됐으므로 문서 높이 재계산
         */
        this.smoothScroll.resize();

        /**
         * ScrollTrigger 시작·종료 위치 재계산
         */
        if (
            typeof ScrollTrigger !==
            'undefined'
        ) {
            requestAnimationFrame(() => {
                ScrollTrigger.refresh();
            });
        }
    }

    /**
     * 브라우저 resize 처리
     */
    handleResize = () => {
        this.smoothScroll.resize();

        if (
            typeof ScrollTrigger !==
            'undefined'
        ) {
            ScrollTrigger.refresh();
        }
    };

    /**
     * 전체 애플리케이션 정리
     */
    destroy() {
        window.removeEventListener(
            'resize',
            this.handleResize
        );

        this.heroIntro.destroy();
        this.mainIntro.revert();
        this.scrollTextReveal.destroy();
        this.smoothScroll.destroy();
    }
}


/**
 * =========================================================
 * App Start
 * ---------------------------------------------------------
 * DOM 생성이 완료된 뒤 PortfolioApp을 실행한다.
 * =========================================================
 */
document.addEventListener(
    'DOMContentLoaded',
    () => {
        const app = new PortfolioApp();

        app.init();

        /**
         * 개발 중 콘솔에서 접근하기 위한 전역 저장
         *
         * 사용 예시:
         * window.portfolioApp.smoothScroll.scrollTo(0);
         */
        window.portfolioApp = app;
    }
);