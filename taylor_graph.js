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
                fx: (x) => mathjs.pow(mathjs.e, x),
                terms: [
                    (x) => 1.0, // 0th term
                    (x) => x / 1.0, // 1st term
                    (x) => mathjs.pow(x, 2.0) / mathjs.factorial(2), // 2nd term...
                    (x) => mathjs.pow(x, 3.0) / mathjs.factorial(3),
                    (x) => mathjs.pow(x, 4.0) / mathjs.factorial(4),
                ],
                tex: 'e^x',
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
         * CONSTRUCTOR
         * ****************************************************************/
        // constructor() {
        // }

        /* ****************************************************************
         * PUBLIC METHODS
         * ****************************************************************/
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
        #generateChartData = () => {
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
                        this.#functionDefinition.fx(x),
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
                    curData.push(mathjs.round(f(x), this.#VALUE_PRECISION))
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
        };

        #getChartSeries = (charData, degree) => {
            const slicedTerms = this.#chartData.termsSeries.slice(
                0,
                degree + 1
            );

            return new Array(
                this.#chartData.fnSeries,
                this.#getSumSeries(slicedTerms),
                ...slicedTerms
            );
        };

        #getSumSeries = (termsSeries) => {
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
        };

        #setChartOption = (chartData, degree) => {
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
                series: this.#getChartSeries(chartData, degree),
                tooltip: {
                    trigger: 'axis',
                },
            };
        };
    }

    /* ****************************************************************
     * RETURN OBJECT
     * ****************************************************************/
    return {
        TaylorChart,
    };
});
