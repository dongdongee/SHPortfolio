const themeToggle = document.querySelector('.sai-header__theme');

themeToggle?.addEventListener('click', (e) => {
    const button = e.target.closest('.sai-header__theme-button');
    if (!button) return;

    const theme = button.dataset.value;

    themeToggle.dataset.theme = theme;

    themeToggle
        .querySelectorAll('.sai-header__theme-button')
        .forEach((el) => el.classList.toggle('is-active', el === button));

    document.documentElement.dataset.theme = theme;
});