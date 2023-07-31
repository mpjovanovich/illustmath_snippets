define(['jquery', 'jqueryui', 'echarts', 'katex', 'taylorGraph'], (
    $,
    _,
    echarts,
    katex,
    taylorGraph
) => {
    function addChartRow(dataSet) {
        let tr = $('<tr>');

        tr.append(
            $('<th>', { scope: 'row' }).append(
                $(
                    katex.renderToString(dataSet.texLabel, {
                        throwOnError: false,
                    })
                )
            )
        );
        tr.append(
            $('<th>', { scope: 'row' }).append(
                $(
                    katex.renderToString(dataSet.texValue, {
                        throwOnError: false,
                    })
                )
            )
        );

        dataSet.data.forEach((x) => {
            tr.append($('<td>', { text: x }));
        });

        return tr;
    }

    function buildTable(taylorChart) {
        const chartData = taylorChart.getChartData();
        const table = $('#table_taylor');
        table.find('tbody').remove();

        // Header row - x values
        let tbody = $('<tbody>');
        let dataSet = chartData.x;
        let tr = $('<tr>');
        tr.append($('<th>'));
        tr.append($('<th>'));
        dataSet.data.forEach((x) => {
            tr.append($('<th>', { scope: 'col', text: x }));
        });
        tbody.append(tr);

        // Data rows - y values
        addChartRow(chartData.delta).appendTo(tbody);
        addChartRow(chartData.fx).appendTo(tbody);
        addChartRow(chartData.sum).appendTo(tbody);
        chartData.terms.forEach((term) => {
            addChartRow(term).appendTo(tbody);
        });

        table[0].append(tbody[0]);
    }

    function init() {
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
        const taylorChart = new taylorGraph.TaylorChart();
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
            ///////////////////////////////
            // Load CSS - another fun hack for poor server path support.
            ///////////////////////////////

            // There's some configuration file on Jupyter that's adding css to the page.
            // It's screwing up our nice tables - remove it.
            $('.table').removeClass('table');
            $('.table-condensed').removeClass('table-condensed');
            $('.table-nonfluid').removeClass('table-nonfluid');
            $('.rendered_html').removeClass('rendered_html');

            const base_url =
                window.location.href.split('/').slice(0, -1).join('/') + '/';
            const cssPath = base_url + 'src/assets/taylor/taylor.css';
            $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: cssPath,
            }).insertAfter('#last_link');

            ///////////////////////////////
            // Build the table that goes under the graph.
            ///////////////////////////////
            buildTable(taylorChart);

            ///////////////////////////////
            // Render the chart title.
            ///////////////////////////////
            let titleExpression = katex.renderToString(
                `${selectedFunction.fx.tex}, a=0`,
                { throwOnError: false }
            );
            $('#chart_taylor_title').html(
                'Taylor Series Approximation: ' +
                    titleExpression +
                    ' (Maclauren Series)'
            );

            ///////////////////////////////
            // Set up the sliders, and rig up events.
            ///////////////////////////////
            $('#chart_taylor_slider_a').slider({
                create: (event, ui) => {
                    $('#a_value').html('(' + (0).toString() + ')');
                },
                max: 4,
                min: 0,
                slide: (event, ui) => {
                    const sliderVal = ui.value;
                    $('#a_value').html('(' + sliderVal + ')');

                    // Update the chart title.
                    titleExpression = katex.renderToString(
                        `${selectedFunction.fx.tex}, a=${sliderVal}`,
                        { throwOnError: false }
                    );

                    $('#chart_taylor_title').html(
                        'Taylor Series Approximation: ' + titleExpression //+
                    );
                    if (sliderVal == 0) {
                        $('#chart_taylor_title').html(
                            $('#chart_taylor_title').html() +
                                ' (Maclauren Series)'
                        );
                    }
                },
                step: 1,
                value: 0,
            });
            $('#chart_taylor_slider_n').slider({
                create: (event, ui) => {
                    $('#n_value').html(
                        '(' +
                            (selectedFunction.terms.length - 1).toString() +
                            ')'
                    );
                },
                max: selectedFunction.terms.length - 1,
                min: 0,
                slide: (event, ui) => {
                    const sliderVal = ui.value;
                    option = taylorChart.generateChart(
                        selectedFunction,
                        sliderVal
                    );
                    option && myChart.setOption(option, true);
                    $('#n_value').html('(' + sliderVal + ')');

                    const chartData = taylorChart.getChartData();
                    buildTable(taylorChart);
                },
                step: 1,
                value: selectedFunction.terms.length - 1,
            });
        });
    }

    return { init };
});