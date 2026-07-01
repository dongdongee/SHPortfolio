const Include = {
    async load() {
        const includeElements = document.querySelectorAll('[data-include]');

        await Promise.all(
            [...includeElements].map(async (element) => {
                const filePath = element.dataset.include;

                if (!filePath) return;

                try {
                    const response = await fetch(filePath);

                    if (!response.ok) {
                        throw new Error(`${filePath} include load fail`);
                    }

                    element.innerHTML = await response.text();
                } catch (error) {
                    console.error(error);
                }
            })
        );

        document.dispatchEvent(new CustomEvent('include:loaded'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Include.load();
});