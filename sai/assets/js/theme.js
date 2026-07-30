(() => {
    window.SAI = window.SAI || {};

    class Theme {
        constructor() {
            this.elRoot = document.documentElement;
            this.elToggle =
                document.querySelector('.js-theme-toggle');

            this.handleToggleChange =
                this.handleToggleChange.bind(this);

            this.init();
        }

        init() {
            if (!this.elToggle) return;

            const savedTheme =
                localStorage.getItem('sai-theme');

            const initialTheme =
                savedTheme ||
                this.elRoot.dataset.theme ||
                'dark';

            this.applyTheme(initialTheme);

            this.elToggle.addEventListener(
                'sai:toggle-change',
                this.handleToggleChange,
            );
        }

        handleToggleChange(event) {
            const { isActive } = event.detail;

            const theme =
                isActive ? 'light' : 'dark';

            this.applyTheme(theme);
        }

        applyTheme(theme) {
            this.elRoot.dataset.theme = theme;

            localStorage.setItem(
                'sai-theme',
                theme,
            );

            this.updateButton(theme);
        }

        updateButton(theme) {
            const isLight = theme === 'light';

            this.elToggle.classList.toggle(
                'is-active',
                isLight,
            );

            this.elToggle.setAttribute(
                'aria-pressed',
                String(isLight),
            );

            const elText =
                this.elToggle.querySelector(
                    '.js-theme-text',
                );

            if (elText) {
                elText.textContent =
                    isLight
                        ? 'Dark Mode'
                        : 'Light Mode';
            }

            const nextTheme =
                isLight ? 'dark' : 'light';

            this.elToggle.setAttribute(
                'aria-label',
                `${nextTheme} mode로 전환`,
            );
        }
    }

    window.SAI.Theme = Theme;
})();