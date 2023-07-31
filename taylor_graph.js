define(['mathjs'], (mathjs) => {
    class TaylorChart {
        /* ****************************************************************
         * CLASS CONSTANTS
         * ****************************************************************/
        #axisOptions = {
            axisLabel: { show: true },
            axisTick: { show: true },
            minorTick: { show: false },
            splitLine: { show: false }, // Hide the grid lines
            type: 'value',
        };

        // This one is public so that it's exposed in the API.
        functionDefinitions = {
            e_pow_x: {
                fx: this.#createFunctionDefinition(
                    (x) => mathjs.pow(mathjs.e, x),
                    'e^x'
                ),
                terms: [
                    this.#createFunctionDefinition((x) => 1.0, '1'),
                    this.#createFunctionDefinition((x) => x / 1.0, 'x/1!'),
                    this.#createFunctionDefinition(
                        (x) => mathjs.pow(x, 2.0) / mathjs.factorial(2),
                        'x^2/2!'
                    ),
                    this.#createFunctionDefinition(
                        (x) => mathjs.pow(x, 3.0) / mathjs.factorial(3),
                        'x^3/3!'
                    ),
                    this.#createFunctionDefinition(
                        (x) => mathjs.pow(x, 4.0) / mathjs.factorial(4),
                        'x^4/4!'
                    ),
                ],
            },
        };

        #GRID_DIMS = {
            x: { min: 0, max: 5 },
            y: { min: 0, max: 10 },
        };

        #TICKS_PER_UNIT = 0.1;
        #VALUE_PRECISION = 4;

        /* ****************************************************************
         * CLASS VARIABLES
         * ****************************************************************/
        #chartData;
        #degree;
        #functionDefinition;
        #option;

        /* ****************************************************************
         * PUBLIC METHODS
         * ****************************************************************/
        // This method returns a set of arrays with a friendly api for consumption
        // by the client.
        getChartData = () => {
            // Build an index array for subset that will form the return elements.
            let returnObject = {
                // TODO: export only a subset of the data.
                x: { tex: 'x', data: [] },
                fx: {
                    texLabel: 'f(x)',
                    texValue: this.#functionDefinition.fx.tex,
                    data: [],
                },
                // TODO: fix tex
                sum: {
                    texLabel: 'sum',
                    texValue: '\\sum_{n=0}^{\\infty} (f^{n}(a)/n!) (x-a)^{n}',
                    data: [],
                },
                // TODO: fix tex
                delta: {
                    tex: 'delta, \\delta_{f(x)-\\epsilon}',
                    texLabel: 'delta',
                    texValue: '\\delta_{f(x)-\\epsilon}',
                    data: [],
                },
                terms: [],
            };
            for (let i = 2; i < this.#option.series.length; i++) {
                returnObject.terms.push({
                    tex:
                        `f^{(${i - 2})}(x), ` +
                        this.#functionDefinition.terms[i - 2].tex,
                    texLabel: `f^{(${i - 2})}(x)`,
                    texValue: this.#functionDefinition.terms[i - 2].tex,
                    data: [],
                });
            }

            // This was chosen arbitrarily.
            let increment = Math.floor(1 / this.#TICKS_PER_UNIT);
            for (
                let i = 0;
                i < this.#chartData.xValues.length;
                i += increment
            ) {
                returnObject.x.data.push(this.#chartData.xValues[i]);
                returnObject.fx.data.push(this.#option.series[0].data[i]);
                returnObject.sum.data.push(this.#option.series[1].data[i]);
                returnObject.delta.data.push(
                    // We're calculating here, so we have to round the result.
                    mathjs.round(
                        this.#option.series[0].data[i] -
                            this.#option.series[1].data[i],
                        this.#VALUE_PRECISION
                    )
                );
                for (let j = 2; j < this.#option.series.length; j++) {
                    let termIndex = j - 2;
                    returnObject.terms[termIndex].data.push(
                        this.#option.series[j].data[i]
                    );
                }
            }

            returnObject.x.data = returnObject.x.data.map((x) =>
                Math.round(x, 2)
            );
            returnObject.fx.data = returnObject.fx.data.map((x) =>
                Math.round(x, 2)
            );

            return returnObject;
        };

        generateChart = (functionDefinition, degree) => {
            let functionChanged = false;
            let degreeChanged = false;

            if (
                !this.#functionDefinition ||
                functionDefinition.tex !== this.#functionDefinition.tex
            ) {
                this.#functionDefinition = functionDefinition;
                functionChanged = true;
            }
            if (!this.#degree || this.#degree !== degree) {
                this.#degree = degree;
                degreeChanged = true;
            }

            // Nothing changed, so quit.
            if (!functionChanged && !degreeChanged) return this.#option;

            if (functionChanged) {
                this.#chartData = this.#generateChartData();
            }

            this.#setChartOption(this.#chartData, this.#degree);

            return this.#option;
        };

        /* ****************************************************************
         * PRIVATE METHODS
         * ****************************************************************/
        #createFunctionDefinition(fn, tex) {
            return { fn, tex };
        }

        #generateChartData() {
            // let seriesIndex = 0;
            let xValues = [];
            let termsSeries = [];
            let curData = [];

            // Initialize the x axis values
            for (
                let x = this.#GRID_DIMS.x.min;
                x <= this.#GRID_DIMS.x.max;
                x += this.#TICKS_PER_UNIT
            ) {
                x = mathjs.round(x, 1); // The binary addition from the add makes the results off by a little bit - round them back.
                xValues.push(x);
            }

            // Plot the function
            curData = [];
            xValues.forEach((x) =>
                curData.push(
                    mathjs.round(
                        this.#functionDefinition.fx.fn(x),
                        this.#VALUE_PRECISION
                    )
                )
            );

            const fnSeries = {
                name: 'f(x)',
                data: curData,
                // makes the legend and tooltip match the line color.
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
            this.#functionDefinition.terms.forEach((f, fIndex) => {
                curData = [];

                xValues.forEach((x) =>
                    curData.push(mathjs.round(f.fn(x), this.#VALUE_PRECISION))
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

        #getChartSeries(degree) {
            // TODO: export a consumable snapshot of the chart data for the client.
            const slicedTerms = this.#chartData.termsSeries.slice(
                0,
                degree + 1
            );

            return new Array(
                this.#chartData.fnSeries,
                this.#getSumSeries(slicedTerms),
                ...slicedTerms
            );
        }

        #getSumSeries(termsSeries) {
            let sum = new Array(termsSeries[0].data.length).fill(0);
            termsSeries.forEach((t) => {
                for (let x = 0; x < t.data.length; x++) {
                    sum[x] += t.data[x];
                }
            });

            sum = sum.map((x) => mathjs.round(x, this.#VALUE_PRECISION));

            return {
                name: 'nth sum',
                data: sum,
                // makes the legend and tooltip match the line color.
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

        #roundArray(data) {
            return data.map((x) => Math.round(x, this.#VALUE_PRECISION));
        }

        #setChartOption(chartData, degree) {
            this.#option = {
                animation: false,
                grid: {
                    left: '50', // margin
                },
                xAxis: {
                    ...this.#axisOptions,
                    boundaryGap: false,
                    data: chartData.xValues,
                    name: 'x',
                    type: 'category', // The chart only works if you make x-axis data categorical. I don't know why.
                },
                yAxis: {
                    ...this.#axisOptions,
                    max: this.#GRID_DIMS.y.max,
                    min: this.#GRID_DIMS.y.min,
                    name: 'y',
                    type: 'value',
                },
                series: this.#getChartSeries(degree),
                tooltip: {
                    trigger: 'axis',
                },
            };
        }
    }

    /* ****************************************************************
     * RETURN OBJECT
     * ****************************************************************/
    return {
        TaylorChart,
    };
});
