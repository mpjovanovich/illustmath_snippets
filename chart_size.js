define(() => {
    // This function sizes the grid so that the x and y axes are scaled to the same size.
    function getGridWidthHeight(maxSize, xMin, xMax, yMin, yMax) {
        const rangeX = xMax - xMin;
        const rangeY = yMax - yMin;

        let dims = { width: maxSize, height: maxSize };
        if (rangeX > rangeY) {
            dims.height = (maxSize * rangeY) / rangeX;
        } else {
            dims.width = (maxSize * rangeX) / rangeY;
        }

        return dims;
    }

    return {
        getGridWidthHeight: getGridWidthHeight,
    };
});
