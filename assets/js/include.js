const Include = {
    resolveCandidates(filePath) {
        const rawPath = (filePath || '').trim();
        if (!rawPath) return [];

        const candidates = new Set();

        try {
            candidates.add(new URL(rawPath, window.location.href).href);
        } catch (error) {
            // Ignore invalid URL values.
        }

        if (!rawPath.startsWith('/')) {
            candidates.add(new URL('/' + rawPath.replace(/^\.?\//, ''), window.location.origin).href);
        }

        if (rawPath.startsWith('/')) {
            candidates.add(new URL(rawPath, window.location.origin).href);
        }

        return [...candidates];
    },

    async load() {
        const includeElements = document.querySelectorAll('[data-include]');

        await Promise.all(
            [...includeElements].map(async (element) => {
                const filePath = element.dataset.include;

                if (!filePath) return;

                let loaded = false;

                for (const candidatePath of this.resolveCandidates(filePath)) {
                    try {
                        const response = await fetch(candidatePath, { cache: 'no-store' });

                        if (!response.ok) {
                            throw new Error(`${candidatePath} include load fail`);
                        }

                        element.innerHTML = await response.text();
                        loaded = true;
                        break;
                    } catch (error) {
                        console.warn(`${candidatePath} include load fail`, error);
                    }
                }

                if (!loaded) {
                    console.error(`All include paths failed for: ${filePath}`);
                    element.innerHTML = '<!-- include failed -->';
                }
            })
        );

        document.dispatchEvent(new CustomEvent('include:loaded'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Include.load();
});