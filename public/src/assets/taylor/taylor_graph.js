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
                gridDims: {
                    x: { min: 0, max: 5 },
                    y: { min: 0, max: 10 },
                },
                tableAVals: { min: 0, max: 5 },
                tableXVals: [0, 1, 2, 3, 4, 5],
                fx: this.#createFunctionDefinition(
                    (x, a) => mathjs.pow(mathjs.e, x),
                    'e^x'
                ),
                terms: [
                    this.#createFunctionDefinition(
                        (x, a) => mathjs.pow(mathjs.e, a),
                        'e^{#A}'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) => (mathjs.pow(mathjs.e, a) / 1.0) * (x - a),
                        '\\frac{e^{#A}}{1!}(x-#A)'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(2)) *
                            mathjs.pow(x - a, 2),
                        '\\frac{e^{#A}}{2!}(x-{#A})^2'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(3)) *
                            mathjs.pow(x - a, 3),
                        '\\frac{e^#A}{3!}(x-#A)^3'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(4)) *
                            mathjs.pow(x - a, 4),
                        '\\frac{e^#A}{4!}(x-#A)^4'
                    ),
                ],
            },
            one_over_one_minus_x: {
                gridDims: {
                    x: { min: -2, max: 7 },
                    y: { min: -1.5, max: 1.5 },
                },
                tableAVals: { min: 0, max: 5 },
                tableXVals: [0, 1, 2, 3, 4, 5],
                fx: this.#createFunctionDefinition(
                    (x, a) => 1.0 / (1.0 - x),
                    '1/(1-x)'
                ),
                terms: [
                    this.#createFunctionDefinition(
                        (x, a) => 1.0 / (1.0 - a),
                        '\\frac{1}{(1-#A)}'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) => (1.0 / mathjs.pow(1 - a, 2)) * (x - a),
                        '\\frac{1*1!}{(1-#A)^2}(x-#A)'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            ((2.0 * mathjs.factorial(2)) /
                                mathjs.pow(1 - a, 3)) *
                            mathjs.pow(x - a, 2),
                        '\\frac{2*2!}{(1-#A)^3}(x-#A)^2'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            ((6.0 * mathjs.factorial(3)) /
                                mathjs.pow(1 - a, 4)) *
                            mathjs.pow(x - a, 3),
                        '\\frac{6*3!}{(1-#A)^4}(x-#A)^3'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            ((24.0 * mathjs.factorial(4)) /
                                mathjs.pow(1 - a, 5)) *
                            mathjs.pow(x - a, 4),
                        '\\frac{24*4!}{(1-#A)^5}(x-#A)^4'
                    ),
                ],
            },
            sin_x: {
                gridDims: {
                    x: { min: -5, max: 5 },
                    y: { min: -1.5, max: 1.5 },
                },
                tableAVals: { min: 0, max: 5 },
                tableXVals: [-2, -1, 0, 1, 2],
                fx: this.#createFunctionDefinition(
                    (x, a) => mathjs.sin(x),
                    'sin(x)'
                ),
                terms: [
                    this.#createFunctionDefinition(
                        (x, a) => mathjs.sin(a),
                        'sin(#A)'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) => (mathjs.cos(a) / 1.0) * (x - a),
                        '\\frac{cos(#A)}{1!}(x-#A)'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            ((-1 * mathjs.sin(a)) / mathjs.factorial(2)) *
                            mathjs.pow(x - a, 2),
                        '\\frac{-sin(#A)}{2!}(x-{#A})^2'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            ((-1 * mathjs.cos(a)) / mathjs.factorial(3)) *
                            mathjs.pow(x - a, 3),
                        '\\frac{-cos(#A)}{3!}(x-{#A})^3'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.sin(a) / mathjs.factorial(4)) *
                            mathjs.pow(x - a, 4),
                        '\\frac{sin(#A)}{4!}(x-{#A})^4'
                    ),
                ],
            },
        };

        #TICKS_PER_UNIT = 0.1;
        #VALUE_PRECISION = 4;

        /* ****************************************************************
         * CLASS VARIABLES
         * ****************************************************************/
        #a;
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
                a: this.#a,
                n: this.#degree,
                x: { tex: 'x', data: [] },
                fx: {
                    texLabel: 'f(x)',
                    texValue: this.#functionDefinition.fx.tex,
                    data: [],
                },
                sum: {
                    texLabel: 'g(x)',
                    texValue:
                        '\\sum_{n=0}^{#N}\\frac{f^{n}(#A)}{n!} (x-#A)^{n}',
                    data: [],
                },
                delta: {
                    texLabel: '\\delta(x)',
                    texValue: 'f(x)-g(x)',
                    data: [],
                },
                terms: [],
            };
            for (let i = 2; i < this.#option.series.length; i++) {
                returnObject.terms.push({
                    texLabel: `term ${i - 2}`,
                    texValue: this.#functionDefinition.terms[i - 2].tex,
                    data: [],
                });
            }

            this.#functionDefinition.tableXVals.forEach((x) => {
                const xIndex = this.#chartData.xValues.indexOf(x);
                returnObject.x.data.push(x);
                returnObject.fx.data.push(this.#option.series[0].data[xIndex]);
                returnObject.sum.data.push(this.#option.series[1].data[xIndex]);
                returnObject.delta.data.push(
                    // We're calculating here, so we have to round the result.
                    mathjs.round(
                        this.#option.series[0].data[xIndex] -
                            this.#option.series[1].data[xIndex],
                        this.#VALUE_PRECISION
                    )
                );
                for (let j = 2; j < this.#option.series.length; j++) {
                    let termIndexIndex = j - 2;
                    returnObject.terms[termIndexIndex].data.push(
                        this.#option.series[j].data[xIndex]
                    );
                }
            });

            return returnObject;
        };

        generateChart = (functionDefinition, degree, a) => {
            let functionChanged = false;
            let degreeChanged = false;
            let aChanged = false;

            if (
                !this.#functionDefinition ||
                functionDefinition.fx.tex !== this.#functionDefinition.fx.tex
            ) {
                this.#functionDefinition = functionDefinition;
                functionChanged = true;
            }
            if (!this.#degree || this.#degree !== degree) {
                this.#degree = degree;
                degreeChanged = true;
            }
            if (!this.#a || this.#a !== a) {
                this.#a = a;
                aChanged = true;
            }

            // Nothing changed, so quit.
            if (!functionChanged && !degreeChanged && !aChanged) {
                return this.#option;
            }

            if (functionChanged || aChanged) {
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
            let xValues = [];
            let termsSeries = [];
            let curData = [];

            // Initialize the x axis values
            for (
                let x = this.#functionDefinition.gridDims.x.min;
                x <= this.#functionDefinition.gridDims.x.max;
                x += this.#TICKS_PER_UNIT
            ) {
                x = mathjs.round(x, 1); // The binary addition from the add makes the results off by a little bit - round them back.
                xValues.push(x);
            }

            // Plot the function
            curData = [];
            xValues.forEach((x) => {
                let y = this.#functionDefinition.fx.fn(x);
                // echarts will try to plot Inifinity as a verticle asymptote.
                // This should really be NaN.
                if (y == Infinity || y == -Infinity) {
                    curData.push(NaN);
                } else {
                    curData.push(mathjs.round(y, this.#VALUE_PRECISION));
                }
            });

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

                xValues.forEach((x) => {
                    let y = f.fn(x, this.#a);
                    // echarts will try to plot Inifinity as a verticle asymptote.
                    // This should really be NaN.
                    if (y == Infinity || y == -Infinity) {
                        curData.push(NaN);
                    } else {
                        curData.push(mathjs.round(y, this.#VALUE_PRECISION));
                    }
                });

                termsSeries.push({
                    name: 'term' + fIndex,
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
                name: 'g(x)',
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
                    max: this.#functionDefinition.gridDims.y.max,
                    min: this.#functionDefinition.gridDims.y.min,
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
