// TODO: legend on right of graph.
// TODO: Add TeX library to render function names:
// https://www.mathjax.org/
// https://cdnjs.com/libraries/mathjax
// TODO: Add 'a' parameter for Taylor.

// Closest eCharts example: https://echarts.apache.org/examples/en/editor.html?c=line-stack

/* ****************************************************************
 * GRAPH SIZING OPTIONS
 * ****************************************************************/
// TODO: extract this section to its own JS module/file. It can be reused.

const FUNCTION_INDEX = 0;
const GRID_DIMS = {
    x: { min: 0, max: 5 },
    y: { min: 0, max: 10 },
};
const MAX_SIZE = 600;
const SUMMATION_INDEX = 1;
const TICKS_PER_UNIT = 0.1;
const VALUE_PRECISION = 4;

// There's no option to have the x and y axis on the same scale, so we have to do this trick.
// By default it will fit the parent container.
function getGridWidthHeight() {
    const rangeX = GRID_DIMS.x.max - GRID_DIMS.x.min;
    const rangeY = GRID_DIMS.y.max - GRID_DIMS.y.min;

    let dims = { width: MAX_SIZE, height: MAX_SIZE };
    if (rangeX > rangeY) {
        dims.height = (MAX_SIZE * rangeY) / rangeX;
    } else {
        dims.width = (MAX_SIZE * rangeX) / rangeY;
    }

    return dims;
}

/* ****************************************************************
 * OTHER GRAPH OPTIONS
 * ****************************************************************/
const axisOptions = {
    axisLabel: { show: true },
    axisTick: { show: true },
    minorTick: { show: false },
    splitLine: { show: false }, // Hide the grid lines
    type: 'value',
};

/* ****************************************************************
 * INCLUDED LIBRARIES
 * ****************************************************************/
requirejs.config({
    paths: {
        jquery: '//code.jquery.com/jquery-3.7.0.min',
        jqueryui: '//code.jquery.com/ui/1.13.1/jquery-ui.min',
        echarts: '//cdnjs.cloudflare.com/ajax/libs/echarts/5.4.2/echarts.min',
        mathjs: '//cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.2/math.min',
        mathjax:
            '//cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML',
        test: './test_module',
    },
});

/* ****************************************************************
 * APPLICATION ENTRY POINT
 * ****************************************************************/
require(['jquery', 'jqueryui', 'echarts', 'mathjs', 'mathjax', 'test'], (
    $,
    _,
    echarts,
    math,
    mathjax,
    test
) => {
    /* ****************************************************************
     * DEFINE GRAPH FUNCTIONS
     * ****************************************************************/
    // TODO: extract this section to its own JS module/file. It's too big to go in here.
    // TODO: Add more functions later.
    console.log(mathjax);

    const functionDefinitions = {
        e_pow_x: {
            fx: (x) => math.pow(math.e, x),
            terms: [
                (x) => 1.0, // 0th term
                (x) => x / 1.0, // 1st term
                (x) => math.pow(x, 2.0) / math.factorial(2), // 2nd term...
                (x) => math.pow(x, 3.0) / math.factorial(3),
                (x) => math.pow(x, 4.0) / math.factorial(4),
            ],
            // TODO: add TeX description for terms
        },
    };

    function getSumSeries(termsSeries) {
        let sum = new Array(termsSeries[0].data.length).fill(0);
        termsSeries.forEach((t) => {
            for (let x = 0; x < t.data.length; x++) {
                sum[x] += t.data[x];
            }
        });

        sum = sum.map((x) => math.round(x, VALUE_PRECISION));

        return {
            name: 'nth sum',
            data: sum,
            // This makes the legend and tooltip match the line color.
            itemStyle: {
                color: (param) => {
                    return '#aa000099';
                },
            },
            lineStyle: {
                color: '#aa000099',
                width: 4,
            },
            showSymbol: false,
            type: 'line',
        };
    }

    function generateChartData(fn) {
        let seriesIndex = 0;
        let xValues = [];
        let termsSeries = [];
        let curData = [];

        // Initialize the x axis values
        for (
            let x = GRID_DIMS.x.min;
            x <= GRID_DIMS.x.max;
            x += TICKS_PER_UNIT
        ) {
            x = math.round(x, 1); // The binary addition from the add makes the results off by a little bit - round them back.
            xValues.push(x);
        }

        // Plot the function
        curData = [];
        xValues.forEach((x) =>
            curData.push(math.round(fn.fx(x), VALUE_PRECISION))
        );

        const fnSeries = {
            name: 'f(x)',
            data: curData,
            // This makes the legend and tooltip match the line color.
            itemStyle: {
                color: (param) => {
                    return '#555';
                },
            },
            lineStyle: {
                color: '#555',
                width: 4,
            },
            showSymbol: false,
            type: 'line',
        };

        // Plot the terms
        fn.terms.forEach((f, fIndex) => {
            curData = [];

            xValues.forEach((x) =>
                curData.push(math.round(f(x), VALUE_PRECISION))
            );

            termsSeries.push({
                name: 'n=' + fIndex,
                data: curData,
                showSymbol: false,
                type: 'line',
            });
        });

        return {
            fnSeries,
            termsSeries,
            xValues,
        };
    }

    /* ******************************************************************************
     * BUILD THE CHART
     * ******************************************************************************/

    // TODO: Hardcoded to e_pow_x until we add a dropdown for function selection.
    const selectedFunction = functionDefinitions.e_pow_x;
    const chartData = generateChartData(functionDefinitions.e_pow_x);
    const gridSize = getGridWidthHeight();
    const myChart = echarts.init(
        document.getElementById('chart_taylor'),
        null,
        {
            //width: gridSize.width,
            //height: gridSize.height
            // For e_pow_x it's easier to see the delta in the summation if we don't draw the axes to scale.
            // We'll have to include this as a property on the object for the other functions.
            width: MAX_SIZE,
            height: MAX_SIZE,
        }
    );

    // Set the chart options.
    // See: https://echarts.apache.org/en/option.html
    let option = {
        animation: false,
        grid: {
            left: '50', // margin
        },
        xAxis: {
            ...axisOptions,
            //axislabel: {interval: 0},
            boundaryGap: false,
            data: chartData.xValues,
            // max: GRID_DIMS.x.max,
            // min: GRID_DIMS.x.min,
            name: 'x',
            type: 'category', // The chart only works if you make x-axis data categorical. I don't know why.
        },
        yAxis: {
            ...axisOptions,
            max: GRID_DIMS.y.max,
            min: GRID_DIMS.y.min,
            name: 'y',
            type: 'value',
        },
        series: new Array(
            chartData.fnSeries,
            getSumSeries(chartData.termsSeries),
            ...chartData.termsSeries
        ),
        /*
        title: {
            left: 'center',
            text: 'Taylor Series Approximation: e^x, a=0 (Maclauren Series)'
        },
        */
        tooltip: {
            trigger: 'axis',
        },
    };

    // If the chart option exists (is should - this is a sanity check), display the chart.
    option && myChart.setOption(option);

    /* ******************************************************************************
     * UI Controls
     * ******************************************************************************/
    $(() => {
        $('#chart_taylor_title').html(
            'Taylor Series Approximation: \\(e^x, a=0\\) (Maclauren Series)'
        );

        // DEBUG
        console.log($('#chart_taylor_slider'));

        $('#chart_taylor_slider').slider({
            create: (event, ui) => {
                $('#n_value').html(
                    '(' + (selectedFunction.terms.length - 1).toString() + ')'
                );
            },
            max: selectedFunction.terms.length - 1,
            min: 0,
            slide: (event, ui) => {
                const sliderVal = ui.value;
                const slicedTerms = chartData.termsSeries.slice(
                    0,
                    sliderVal + 1
                );
                option.series = new Array(
                    chartData.fnSeries,
                    getSumSeries(slicedTerms),
                    ...slicedTerms
                );
                option && myChart.setOption(option, true);
                $('#n_value').html('(' + sliderVal + ')');
            },
            step: 1,
            value: selectedFunction.terms.length - 1,
        });
    });
});
