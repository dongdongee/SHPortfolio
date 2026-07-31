(() => {
    window.SAI = window.SAI || {};

    class Theme {
        constructor() {
            this.storageKey = 'sai-theme';
            this.defaultTheme = 'dark';

            this.elRoot = document.documentElement;

            this.handleClick =
                this.handleClick.bind(this);

            this.init();
        }

        init() {
            const savedTheme =
                localStorage.getItem(this.storageKey);

            const initialTheme =
                savedTheme ||
                this.elRoot.dataset.theme ||
                this.defaultTheme;

            /*
             * 헤더가 아직 include되지 않았더라도
             * html 테마 속성은 먼저 적용한다.
             */
            this.applyTheme(initialTheme);

            /*
             * 동적으로 삽입되는 테마 버튼도 감지한다.
             */
            document.addEventListener(
                'click',
                this.handleClick,
            );
        }

        handleClick(event) {
            const elButton =
                event.target.closest('.js-theme-button');

            if (!elButton) return;

            const theme =
                elButton.dataset.themeValue;

            if (!this.isValidTheme(theme)) return;

            this.applyTheme(theme);
        }

        applyTheme(theme) {
            const nextTheme =
                this.isValidTheme(theme)
                    ? theme
                    : this.defaultTheme;

            this.elRoot.dataset.theme = nextTheme;

            localStorage.setItem(
                this.storageKey,
                nextTheme,
            );

            this.updateButtons(nextTheme);
        }

        updateButtons(currentTheme) {
            const elButtons =
                document.querySelectorAll(
                    '.js-theme-button',
                );

            elButtons.forEach((elButton) => {
                const targetTheme =
                    elButton.dataset.themeValue;

                elButton.hidden =
                    targetTheme === currentTheme;
            });
        }

        isValidTheme(theme) {
            return (
                theme === 'light' ||
                theme === 'dark'
            );
        }

        destroy() {
            document.removeEventListener(
                'click',
                this.handleClick,
            );
        }
    }

    window.SAI.Theme = Theme;
})();