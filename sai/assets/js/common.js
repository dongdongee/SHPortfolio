/* *********************************
 * 테마 설정
 * ********************************* */

class Theme {
    constructor() {
        this.root = document.documentElement;
        this.storageKey = 'sai-theme';

        this.init();
    }

    init() {
        this.loadTheme();
        this.bindEvents();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem(this.storageKey) || 'light';

        this.setTheme(savedTheme);
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.js-theme-button');

            if (!button) return;

            const theme = button.dataset.themeValue;

            this.setTheme(theme);
        });
    }

    setTheme(theme) {
        this.root.setAttribute('data-theme', theme);
        localStorage.setItem(this.storageKey, theme);
    }
}


/* *********************************
 * 전체 토글 이벤트
 * ********************************* */

class ActiveToggle {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.js-active-toggle');

            if (!button) return;

            const group = button.dataset.activeGroup;

            // 같은 그룹의 다른 active 닫기
            if (group) {
                const groupButtons = document.querySelectorAll(
                    `.js-active-toggle[data-active-group="${group}"]`
                );

                groupButtons.forEach((otherButton) => {
                    if (otherButton === button) return;

                    this.setActive(otherButton, false);
                });
            }

            const isActive = !button.classList.contains('is-active');

            this.setActive(button, isActive);
        });
    }

    setActive(button, isActive) {
        button.classList.toggle('is-active', isActive);

        const targetSelector = button.dataset.activeTarget;
        const target = targetSelector
            ? document.querySelector(targetSelector)
            : null;

        target?.classList.toggle('is-active', isActive);

        if (button.hasAttribute('aria-expanded')) {
            button.setAttribute(
                'aria-expanded',
                String(isActive)
            );
        }
    }
}


/* *********************************
 * 페이지에 맞는 내비게이션 활성화
 * ********************************* */

class AsideNavigation {
    constructor() {
        this.init();
    }

    init() {
        const nav = document.querySelector('.sai-aside__nav');

        if (nav) {
            this.setCurrentMenu(nav);
            return;
        }

        const observer = new MutationObserver(() => {
            const nav = document.querySelector('.sai-aside__nav');

            if (!nav) return;

            observer.disconnect();
            this.setCurrentMenu(nav);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setCurrentMenu(nav) {
        const currentFile =
            window.location.pathname.split('/').pop() || 'index.html';

        const links = nav.querySelectorAll(
            '.aside__detail_menu a'
        );

        links.forEach((link) => {
            const linkFile =
                new URL(link.href, window.location.origin)
                    .pathname
                    .split('/')
                    .pop() || 'index.html';

            if (linkFile !== currentFile) return;

            // 소메뉴 활성화
            link.classList.add('is-active');

            // 소메뉴가 속한 그룹
            const navToggle = link.closest('.sai-nav-toggle');

            if (!navToggle) return;

            // 해당 그룹의 대메뉴
            const mainMenu = navToggle.querySelector(
                '.sai-aside__main_menu'
            );

            if (!mainMenu) return;

            // 현재 페이지가 속한 대메뉴 표시
            mainMenu.classList.add('is-current');

            // 대메뉴 펼치기
            mainMenu.classList.add('is-active');
            mainMenu.setAttribute('aria-expanded', 'true');
        });
    }
}

/* *********************************
 * Menu Button
 * ********************************* */

class MenuButton {
    constructor() {
        this.mediaQuery = window.matchMedia('(max-width: 1280px)');

        this.init();
    }

    init() {
        const setup = () => {
            this.button = document.querySelector('.js-menu-button');
            this.aside = document.querySelector('#sai-aside__wrap');
            this.overlay = document.querySelector('.js-aside-overlay');
            this.closeButton = document.querySelector('.js-aside-close');

            if (!this.button || !this.aside || !this.overlay) {
                return false;
            }

            this.bindEvents();

            return true;
        };

        if (setup()) return;

        const observer = new MutationObserver(() => {
            if (!setup()) return;

            observer.disconnect();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    bindEvents() {
        // 햄버거 버튼
        this.button.addEventListener('click', () => {
            this.toggle();
        });

        // 닫기 버튼
        this.closeButton?.addEventListener('click', () => {
            this.close();
        });

        // 오버레이
        this.overlay.addEventListener('click', () => {
            this.close();
        });

        // ESC
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!this.aside.classList.contains('is-open')) return;

            this.close();
            this.button.focus();
        });

        // 반응형
        this.mediaQuery.addEventListener('change', () => {
            this.close();
        });
    }

    toggle() {
        if (!this.mediaQuery.matches) return;

        const isActive = this.aside.classList.contains('is-open');

        this.setActive(!isActive);
    }

    setActive(isActive) {
        this.button.classList.toggle('is-active', isActive);
        this.aside.classList.toggle('is-open', isActive);
        this.overlay.classList.toggle('is-open', isActive);

        document.body.classList.toggle('is-aside-open', isActive);

        this.button.setAttribute('aria-expanded', String(isActive));
        this.button.setAttribute(
            'aria-label',
            isActive ? '메뉴 닫기' : '메뉴 열기'
        );
    }

    close() {
        if (!this.aside?.classList.contains('is-open')) return;

        this.setActive(false);
    }
}


/* *********************************
 * 필요한 스크립트 실행부
 * ********************************* */

new Theme();
new ActiveToggle();
new AsideNavigation();
new MenuButton();