(() => {
    window.addEventListener(
        'DOMContentLoaded',
        handleDOMContentLoaded,
    );

    function handleDOMContentLoaded() {
        new window.SAI.Toggle();
        new window.SAI.ToggleGroup();
        new window.SAI.Theme();
    }
})();