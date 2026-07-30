(() => {
    window.SAI = window.SAI || {};

    class ToggleGroup {
        constructor(options = {}) {
            this.groupSelector =
                options.groupSelector || '.js-toggle-group';

            this.itemSelector =
                options.itemSelector || '.js-toggle-item';

            this.activeClass =
                options.activeClass || 'is-active';

            this.handleClick = this.handleClick.bind(this);

            this.init();
        }

        init() {
            document.addEventListener('click', this.handleClick);
        }

        handleClick(event) {
            const elItem = event.target.closest(this.itemSelector);

            if (!elItem) return;
            if (elItem.disabled) return;

            const elGroup =
                elItem.closest(this.groupSelector);

            if (!elGroup) return;

            const activeClass =
                elGroup.dataset.activeClass || this.activeClass;

            const elItems =
                elGroup.querySelectorAll(this.itemSelector);

            elItems.forEach((item) => {
                const isSelected = item === elItem;

                item.classList.toggle(
                    activeClass,
                    isSelected,
                );

                item.setAttribute(
                    'aria-selected',
                    String(isSelected),
                );
            });

            elGroup.dispatchEvent(
                new CustomEvent('sai:toggle-group-change', {
                    bubbles: true,
                    detail: {
                        value: elItem.dataset.value,
                        elItem,
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

    window.SAI.ToggleGroup = ToggleGroup;
})();