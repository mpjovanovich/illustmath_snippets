define(['jquery', 'jqueryui', 'echarts', 'katex', 'taylorGraph'], (
    $,
    _,
    echarts,
    katex,
    taylorGraph
) => {
    function addChartRow(dataSet, a) {
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
            $('<th class="taylor_equation">', { scope: 'row' }).append(
                $(
                    katex.renderToString(
                        dataSet.texValue.replace(new RegExp('#A', 'g'), a),
                        {
                            throwOnError: false,
                        }
                    )
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
        tr.append($('<th>', { scope: 'row', text: 'x' }));
        tr.append($('<th>'));
        dataSet.data.forEach((x) => {
            tr.append($('<th>', { scope: 'col', text: x }));
        });
        tbody.append(tr);

        // Data rows - y values
        addChartRow(chartData.delta, chartData.a).appendTo(tbody);
        addChartRow(chartData.fx, chartData.a).appendTo(tbody);
        addChartRow(chartData.sum, chartData.a).appendTo(tbody);
        chartData.terms.forEach((term) => {
            addChartRow(term, chartData.a).appendTo(tbody);
        });

        table[0].append(tbody[0]);
    }

    function updateGraph(taylorChart, myChart, selectedFunction, degree, a) {
        if (degree == null)
            degree = $('#chart_taylor_slider_n').slider('value');
        if (a == null) a = $('#chart_taylor_slider_a').slider('value');

        ///////////////////////////////
        // Update slider vals and text
        ///////////////////////////////
        $('#chart_taylor_slider_a').slider('value', a);
        $('#a_value').html('(' + a + ')');

        $('#chart_taylor_slider_n').slider('value', degree);
        $('#n_value').html('(' + degree + ')');

        ///////////////////////////////
        // Render the chart title.
        ///////////////////////////////
        let titleExpression = katex.renderToString(
            `${selectedFunction.fx.tex}`,
            { throwOnError: false }
        );
        $('#chart_taylor_title').html(
            `Taylor Series Approximation: ${titleExpression}, degree=${degree}, a=${a}`
        );
        if (a == 0) {
            $('#chart_taylor_title').html(
                $('#chart_taylor_title').html() + ' (Maclauren Series)'
            );
        }

        option = taylorChart.generateChart(selectedFunction, degree, a);
        option && myChart.setOption(option, true);

        buildTable(taylorChart);
    }

    function init() {
        /* ****************************************************************
         * OTHER CONSTANTS
         * ****************************************************************/
        const MAX_SIZE = 600;

        /* ******************************************************************************
         * UI Controls
         * ******************************************************************************/
        $(() => {
            ///////////////////////////////
            // Load CSS - another fun hack for poor server path support.
            // This has to do entirely with the fact that we're running this on Jupyter -
            // otherwise not needed.
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

            /* ******************************************************************************
             * BUILD THE CHART
             * ******************************************************************************/
            const myChart = echarts.init(
                document.getElementById('chart_taylor'),
                null,
                {
                    width: MAX_SIZE,
                    height: MAX_SIZE,
                }
            );

            // If the chart option exists (is should - this is a sanity check), display the chart.
            const taylorChart = new taylorGraph.TaylorChart();
            let selectedFunction = taylorChart.functionDefinitions.e_pow_x;
            let option;

            ///////////////////////////////
            // Set up the function selector.
            ///////////////////////////////
            // Render tex
            $('.tex').each((index, element) => {
                const tex = katex.renderToString($(element).text(), {
                    throwOnError: false,
                });
                $(element).text(tex);
            });

            // Radio controls
            $('#functions').controlgroup();
            $('.functionSelector')
                .checkboxradio()
                .on('change', (event) => {
                    selectedFunction =
                        taylorChart.functionDefinitions[event.target.id];
                    updateGraph(
                        taylorChart,
                        myChart,
                        selectedFunction,
                        selectedFunction.terms.length - 1,
                        0
                    );
                });

            ///////////////////////////////
            // Set up the sliders, and rig up events.
            ///////////////////////////////
            $('#chart_taylor_slider_a').slider({
                create: (event, ui) => {
                    $('#a_value').html('(' + (0).toString() + ')');
                },
                max: selectedFunction.tableAVals.max,
                min: selectedFunction.tableAVals.min,
                slide: (event, ui) => {
                    const aSliderVal = ui.value;
                    updateGraph(
                        taylorChart,
                        myChart,
                        selectedFunction,
                        null,
                        aSliderVal
                    );
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
                    const nSliderVal = ui.value;
                    console.log(nSliderVal);
                    updateGraph(
                        taylorChart,
                        myChart,
                        selectedFunction,
                        nSliderVal,
                        null
                    );
                },
                step: 1,
                value: selectedFunction.terms.length - 1,
            });

            updateGraph(
                taylorChart,
                myChart,
                selectedFunction,
                selectedFunction.terms.length - 1,
                0
            );
        });
    }

    return { init };
});
