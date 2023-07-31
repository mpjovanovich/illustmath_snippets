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
                    (x, a) => mathjs.pow(mathjs.e, x),
                    'e^x'
                ),
                terms: [
                    this.#createFunctionDefinition(
                        (x, a) => mathjs.pow(mathjs.e, a),
                        'e^a'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) => (mathjs.pow(mathjs.e, a) / 1.0) * (x - a),
                        '\\frac{e^a}{1!}(x-a)'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(2)) *
                            mathjs.pow(x - a, 2),
                        '\\frac{e^a}{2!}(x-a)^2'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(3)) *
                            mathjs.pow(x - a, 3),
                        '\\frac{e^a}{3!}(x-a)^3'
                    ),
                    this.#createFunctionDefinition(
                        (x, a) =>
                            (mathjs.pow(mathjs.e, a) / mathjs.factorial(4)) *
                            mathjs.pow(x - a, 4),
                        '\\frac{e^a}{4!}(x-a)^4'
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
                x: { tex: 'x', data: [] },
                fx: {
                    texLabel: 'f(x)',
                    texValue: this.#functionDefinition.fx.tex,
                    data: [],
                },
                sum: {
                    texLabel: 'sum, \\epsilon',
                    texValue:
                        '\\sum_{n=0}^{\\infty}\\frac{f^{n}(a)}{n!} (x-a)^{n}',
                    data: [],
                },
                delta: {
                    texLabel: 'delta, \\delta',
                    texValue: '\\delta (f(x)-\\epsilon)',
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

        generateChart = (functionDefinition, degree, a) => {
            console.log('generateChart', functionDefinition, degree, a);
            let functionChanged = false;
            let degreeChanged = false;
            let aChanged = false;

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
                    curData.push(
                        mathjs.round(f.fn(x, this.#a), this.#VALUE_PRECISION)
                    )
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

        // #roundArray(data) {
        //     return data.map((x) => Math.round(x, this.#VALUE_PRECISION));
        // }

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
