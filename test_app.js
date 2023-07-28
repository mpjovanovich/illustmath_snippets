// All dependencies are defined in this main application entry point config.
// We can use these references in the dependent modules.
require.config({
    paths: {
        echarts: '//cdnjs.cloudflare.com/ajax/libs/echarts/5.4.2/echarts.min',
        katex: '//cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min',
        test_dep: './test_dep',
    },
});

require(['echarts', 'test_dep'], (echarts, test_dep) => {
    console.log(echarts);
    console.log(test_dep);
});
