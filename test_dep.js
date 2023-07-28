define(['katex'], (katex) => {
    console.log('test_dep.js did something');

    return {
        state: 'karnataka',
        city: 'bangalore',
        katex: katex,
    };
});
