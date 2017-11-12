(function (global) {
    let leonRequireJS = {};


    let modules = {};
    //类似queue 结构操作
    let loadings = [];
    let init = false;

    /**
     * load entrance javascript file.
     */
    leonRequireJS.init = function () {
        if (!init) {
            let node = document.getElementsByTagName('script')[0];
            let mainjs = node.getAttribute('data-main');
            leonRequireJS.loadJS(mainjs, null);
        }
    };


    /**
     * Load javascript file, and add to <head>.
     * @param url
     * @param callback
     */
    leonRequireJS.loadJS = function (url, callback) {
        let node = document.createElement('script');
        node.type = 'text/javascript';
        node.src = url;
        node.onload = function () {
            console.log('script onload url: ', url);
            if (callback) {
                callback();
            }
        };

        node.onerror = function () {
            throw Error();
        };

        let head = document.getElementsByTagName('head')[0];
        head.appendChild(node);
    };


    /**
     * define(['a','b'],function(a,b){
            return function(){
                a.doSomething();
                b.doSomething();
            }
       });
     * @param deps
     * @param callback
     */
    leonRequireJS.define = function (deps, callback) {
        let id = leonRequireJS.getCurrentJs();
        // id is file pathname

        let depsId = [];
        deps.map(function (name) {
            depsId.push(leonRequireJS.getScriptId(name));
        });

        if (!modules[id]) {
            modules[id] = {
                id: id,
                state: 1, //module state
                deps: depsId, //module dependence
                callback: callback,
                exports: null,
                colors: 0
            };
        }
    };

    /**
     * require(['c'],function(c){
            return function(){
                c.doSomething();
                //doSomething();
            }
        });
     * @param deps
     * @param callback
     */
    leonRequireJS.require = function (deps, callback) {

        let id = leonRequireJS.getCurrentJs();
        //main module register in modules
        if (!modules[id]) {
            let depsId = [];
            deps.map(function (name) {
                depsId.push(leonRequireJS.getScriptId(name));
            });

            if (!modules[id]) {
                modules[id] = {
                    id: id,
                    state: 1, //module state
                    deps: depsId, //module dependence
                    callback: callback,
                    exports: null,
                    colors: 0
                };
            }
            //main entrance
            loadings.unshift(id);
        }

        //load dep module
        leonRequireJS.loadDepsModule(id);
    };

    /**
     * js pathname
     * @param id {String}
     */
    leonRequireJS.loadDepsModule = function (id) {

        // If no dependence, fire module directly.
        if (modules[id].deps.length === 0) {
            leonRequireJS.fireFactory(modules[id].id, modules[id].deps, modules[id].callback);
            return
        }
        modules[id].deps.map(function (el) {
            // if not in module, load dep javascript file
            if (!modules[el]) {
                leonRequireJS.loadJS(el, function () {

                    // add to loading
                    loadings.unshift(el);
                    console.log('loadings: ', loadings);

                    //load deps recursive.
                    leonRequireJS.loadDepsModule(el);
                    leonRequireJS.checkDeps();
                })
            }
        })
    };


    /**
     *
     */
    leonRequireJS.checkDeps = function () {
        let i = loadings.length - 1;
        while (loadings[i]) {
            let id = loadings[i];
            let obj = modules[id];
            let deps = obj.deps;
            let allloaded = true;

            for (let key in deps) {
                if (!modules[deps[key]] || modules[deps[key]].state !== 2) {
                    allloaded = false;
                    break;
                }
            }

            if (allloaded) {
                // remove loaded module
                loadings.splice(i, 1);
                //execute callback
                leonRequireJS.fireFactory(id, deps, obj.callback);
                //check other dep
                leonRequireJS.checkDeps();
            }
            i -= 1;
        }
    };


    /**
     * Execute module in global context with dependence callback params. ?
     * @param id Module id
     * @param deps Module
     * @param callback
     * @returns {*}
     */
    leonRequireJS.fireFactory = function (id, deps, callback) {
        let params = [];

        for (let i = 0; i < deps.length; i++) {
            params.push(modules[deps[i]].exports)
        }

        //execute callback with params in global context
        let ret = callback.apply(global, params);

        modules[id].exports = ret;

        modules[id].state = 2;
        return ret
    };


    /**
     * Get File pathname;
     * @return {String} pathname
     */
    leonRequireJS.getCurrentJs = function () {
        let filename = document.currentScript.getAttribute('src');
        return filename
    };

    /**
     * convert dep name to pathname
     * @param name {String}
     * @return {String}
     */
    leonRequireJS.getScriptId = function (name) {
        let filename = name + '.js';
        return filename
    };

    leonRequireJS.init();

    global.define = leonRequireJS.define;
    global.require = leonRequireJS.require;

})(window);
