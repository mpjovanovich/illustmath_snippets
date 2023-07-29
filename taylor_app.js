// TODO: diff table below graph. This can show the function derivative names and values.
// TODO: Add 'a' parameter for Taylor.
// TODO: legend on right of graph with function name and degree?
// TODO: this app is utilizing memory poorly.

/* ****************************************************************
 * INCLUDED LIBRARIES
 * ****************************************************************/
require.config({
    paths: {
        jquery: '//code.jquery.com/jquery-3.7.0.min',
        jqueryui: '//code.jquery.com/ui/1.13.1/jquery-ui.min',
        echarts: '//cdnjs.cloudflare.com/ajax/libs/echarts/5.4.2/echarts.min',
        mathjs: '//cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.2/math.min',
        katex: '//cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min',
        taylor: './taylor_graph',
    },
});

/* ****************************************************************
 * APPLICATION ENTRY POINT
 * ****************************************************************/
require(['jquery', 'jqueryui', 'echarts', 'katex', 'taylor'], (
    $,
    _,
    echarts,
    katex,
    taylor
) => {
    /* ****************************************************************
     * OTHER CONSTANTS
     * ****************************************************************/
    const MAX_SIZE = 600;

    /* ******************************************************************************
     * BUILD THE CHART
     * ******************************************************************************/
    const myChart = echarts.init(
        document.getElementById('chart_taylor'),
        null,
        {
            // For e_pow_x it's easier to see the delta in the summation if we don't draw the axes to scale.
            // We'll have to include this as a property on the object for the other functions.
            width: MAX_SIZE,
            height: MAX_SIZE,
        }
    );

    // TODO: Hardcoded to e_pow_x until we add a dropdown for function selection.
    // If the chart option exists (is should - this is a sanity check), display the chart.
    const taylorChart = new taylor.TaylorChart();
    const selectedFunction = taylorChart.functionDefinitions.e_pow_x;
    let option = taylorChart.generateChart(
        selectedFunction,
        selectedFunction.terms.length - 1
    );
    option && myChart.setOption(option, true);

    /* ******************************************************************************
     * UI Controls
     * ******************************************************************************/
    $(() => {
        // DEBUG
        const chartData = taylorChart.getChartData();
        console.log(chartData);

        // TODO: Extract to function. Can go in a new module for charting.
        // Use a JS library to prettify the table after its made.
        var table = document.createElement('table');

        var tableHead = document.createElement('thead');
        tableHead.appendChild(document.createTextNode('Values'));
        table.appendChild(tableHead);

        var tableBody = document.createElement('tbody');
        var row = document.createElement('tr');
        var data = chartData.xValues;
        var increment = Math.floor(1 / taylorChart.TICKS_PER_UNIT);

        for (var i = 0; i < data.length; i += increment) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(data[i]));
            row.appendChild(cell);
        }
        tableBody.appendChild(row);

        data = chartData.fnSeries.data;
        row = document.createElement('tr');
        for (var i = 0; i < data.length; i += increment) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(data[i]));
            row.appendChild(cell);
        }
        tableBody.appendChild(row);

        // chartData.xValues.forEach((rowData) => {
        //     var row = document.createElement('tr');

        //     // rowData.forEach(function (cellData) {
        //     //     var cell = document.createElement('td');
        //     //     cell.appendChild(document.createTextNode(cellData));
        //     //     row.appendChild(cell);
        //     // });

        //     tableBody.appendChild(row);
        // });

        table.appendChild(tableBody);
        $('#table_taylor')[0].appendChild(table);

        const titleExpression = katex.renderToString(
            `${selectedFunction.tex}, a=0`,
            { throwOnError: false }
        );

        $('#chart_taylor_title').html(
            'Taylor Series Approximation: ' +
                titleExpression +
                ' (Maclauren Series)'
        );

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
                option = taylorChart.generateChart(selectedFunction, sliderVal);
                option && myChart.setOption(option, true);
                $('#n_value').html('(' + sliderVal + ')');
            },
            step: 1,
            value: selectedFunction.terms.length - 1,
        });
    });
});
