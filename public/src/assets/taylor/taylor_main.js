/*
This file is most here to provide an easy entry point for the Jupyter workflow.
We can keep all other files as modules.
*/

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
        taylorApp: './taylor_app',
        taylorGraph: './taylor_graph',
    },
});

/* ****************************************************************
 * APPLICATION ENTRY POINT
 * ****************************************************************/
require(['taylorApp'], (taylorApp) => {
    taylorApp.init();
});
