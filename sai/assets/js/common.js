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

            button.classList.toggle('is-active');
        });
    }
}




/* *********************************
 * 필요한 스크립트 실행부
 * ********************************* */


new Theme();
new ActiveToggle();