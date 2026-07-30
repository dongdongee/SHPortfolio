(() => {
    window.SAI = window.SAI || {};

    class Toggle {
        constructor(options = {}) {
            this.selector = options.selector || '.js-toggle';
            this.activeClass = options.activeClass || 'is-active';

            this.handleClick = this.handleClick.bind(this);

            this.init();
        }

        init() {
            document.addEventListener('click', this.handleClick);
        }

        handleClick(event) {
            const elToggle = event.target.closest(this.selector);

            if (!elToggle) return;
            if (elToggle.disabled) return;

            const activeClass =
                elToggle.dataset.activeClass || this.activeClass;

            const isActive =
                elToggle.classList.toggle(activeClass);

            elToggle.setAttribute(
                'aria-pressed',
                String(isActive),
            );

            elToggle.dispatchEvent(
                new CustomEvent('sai:toggle-change', {
                    bubbles: true,
                    detail: {
                        isActive,
                        activeClass,
                    },
                }),
            );
        }

        destroy() {
            document.removeEventListener(
                'click',
                this.handleClick,
            );
        }
    }

    window.SAI.Toggle = Toggle;
})();