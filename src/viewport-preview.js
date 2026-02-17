
export function initViewportPreview(mainContainerId, handleId, previewCanvasId, hourlyData) {
    const mainContainer = document.getElementById(mainContainerId);
    const handle = document.getElementById(handleId);
    const canvas = document.getElementById(previewCanvasId);
    if (!mainContainer || !handle || !canvas || !hourlyData) return;

    const ctx = canvas.getContext('2d');
    const wrapper = handle.parentElement;

    // 1. Render Sparkline correctly
    function renderSparkline() {
        // Adjust canvas resolution
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const data = hourlyData.temperature_2m;
        if (!data || data.length === 0) return;

        const width = rect.width;
        const height = rect.height;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        ctx.clearRect(0, 0, width, height);

        // Draw background shading for days
        const pointsCount = data.length;
        const pointsPerDay = 24;
        for (let i = 0; i < pointsCount; i += pointsPerDay) {
            if ((i / pointsPerDay) % 2 === 1) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
                ctx.fillRect((i / pointsCount) * width, 0, (pointsPerDay / pointsCount) * width, height);
            }
        }

        ctx.beginPath();
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        data.forEach((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 10) - 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // 2. Sync handle size and position
    function updateHandle() {
        const totalWidth = mainContainer.scrollWidth;
        const visibleWidth = mainContainer.clientWidth;
        const scrollLeft = mainContainer.scrollLeft;

        const wrapperWidth = wrapper.clientWidth;
        // Ensure visibleWidth doesn't exceed totalWidth
        const ratio = Math.min(1, visibleWidth / totalWidth);
        const handleWidth = Math.max(40, ratio * wrapperWidth); // Minimum handle size

        // Use the range of the handle movement to map to the range of the scrollable content
        const maxHandleX = wrapperWidth - handleWidth;
        const maxScroll = totalWidth - visibleWidth;
        const handleLeft = maxScroll > 0 ? (scrollLeft / maxScroll) * maxHandleX : 0;

        handle.style.width = `${handleWidth}px`;
        handle.style.left = `${handleLeft}px`;
    }

    // 3. Interactions
    let isDragging = false;
    let startX = 0;
    let startLeft = 0;

    function onPointerDown(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const rect = wrapper.getBoundingClientRect();
        const touchX = clientX - rect.left;

        const handleLeft = parseFloat(handle.style.left || 0);
        const handleWidth = parseFloat(handle.style.width || 0);
        const wrapperWidth = wrapper.clientWidth;

        if (touchX >= handleLeft && touchX <= handleLeft + handleWidth) {
            isDragging = true;
            startX = clientX;
            startLeft = handleLeft;
            e.preventDefault();
        } else {
            // Snap to position (center on touch)
            const newHandleLeft = Math.max(0, Math.min(wrapperWidth - handleWidth, touchX - handleWidth / 2));

            const totalWidth = mainContainer.scrollWidth;
            const visibleWidth = mainContainer.clientWidth;
            const maxHandleX = wrapperWidth - handleWidth;
            const maxScroll = totalWidth - visibleWidth;

            const scrollRatio = maxHandleX > 0 ? newHandleLeft / maxHandleX : 0;
            mainContainer.scrollLeft = scrollRatio * maxScroll;
            updateHandle();

            // Allow immediate drag after snap
            isDragging = true;
            startX = clientX;
            startLeft = newHandleLeft;
            if (e.cancelable) e.preventDefault();
        }
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - startX;

        const wrapperWidth = wrapper.clientWidth;
        const handleWidth = handle.offsetWidth;

        let newLeft = startLeft + deltaX;
        newLeft = Math.max(0, Math.min(wrapperWidth - handleWidth, newLeft));

        const totalWidth = mainContainer.scrollWidth;
        const visibleWidth = mainContainer.clientWidth;
        const maxHandleX = wrapperWidth - handleWidth;
        const maxScroll = totalWidth - visibleWidth;

        const scrollRatio = maxHandleX > 0 ? newLeft / maxHandleX : 0;
        mainContainer.scrollLeft = scrollRatio * maxScroll;
        updateHandle();

        if (e.cancelable) e.preventDefault();
    }

    function onPointerUp() {
        isDragging = false;
    }

    // Event Listeners
    wrapper.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    wrapper.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Sync when main container is scrolled (if native scroll is still somehow used)
    mainContainer.addEventListener('scroll', () => {
        if (!isDragging) updateHandle();
    });

    // Resize observer for responsiveness
    const resizeObserver = new ResizeObserver(() => {
        renderSparkline();
        updateHandle();
    });
    resizeObserver.observe(wrapper);
    resizeObserver.observe(mainContainer);

    // Initial render
    renderSparkline();
    updateHandle();
}
