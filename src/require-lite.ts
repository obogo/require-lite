let define:Function, require:any;
(function() {
    let requireWorker = function () {
        let _get:Function, defined:Object, pending:Object, definitions:Object, timer:number = 0, raw;

        const
            CACHE_TOKEN = '~',
            DEFINITIONS_TOKEN = '.',
            REQUIRE = 'require',
            EXPORTS = 'exports',
            DEFAULT = 'default',
            CACHED = 'c',
            DEFINED = 'd',
            PENDING = 'p',
            RAW = 'r';

        /**
         * Sets and Gets cache, defined, and pending items in a private internal cache
         */
        function init() {
            _get = Function[CACHE_TOKEN] = Function[CACHE_TOKEN] || function (name:string) {
                    if (!_get[name]) {
                        _get[name] = {};
                    }
                    return _get[name];
                };
            raw = _get(RAW);
            definitions = _get(CACHED); // these are items that have been initialized and permanently cached
            defined = _get(DEFINED); // these are items that have been defined but have not been initialized
            pending = _get(PENDING); // these are items that have been initialized but have deps that need initialized before done
        }

        function clear() {
            delete Function[CACHE_TOKEN];
            delete definitions;
            delete defined;
            delete pending;
            init();
        }

        /**
         * Initializes
         */
        function initDefinition(name:string) {
            if (!defined[name]) {
                let args = arguments;
                let val = args[1];
                if (typeof val === 'function') {
                    // ex. define('myFunc', function(){...});
                    defined[name] = val.apply({name: name}); // invoke immediately and assign to defined
                } else {
                    // store in a temporary definitions until all definitions have been processed
                    // ex. define('myFunc', ['toBoolean'], function(toBoolean){...})
                    definitions[name] = args[2]; // skip array and assign funtion to cached name
                    definitions[name][DEFINITIONS_TOKEN] = val; // assign dependencies to definitions on function itself
                }
            }
        }

        function resolveModule(name:string, initHandler:Function) {
            pending[name] = true; // mark this definition as pending
            let deps = initHandler[DEFINITIONS_TOKEN]; // get any dependencies required by definition
            let args = [];
            let i:number, len:number;
            let dependencyName;
            if (deps) {
                len = deps.length;
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    // if (definitions[dependencyName]) {
                    if (pending[dependencyName]) {
                        if (!require.ignoreWarnings) {
                            console.warn('Recursive dependency between "' + name + '" and "' + dependencyName);
                        }
                    } else if (definitions[dependencyName]) {
                        resolveModule(dependencyName, definitions[dependencyName]);
                    }
                    delete definitions[dependencyName];
                    // }
                }
            }


            if (!defined.hasOwnProperty(name)) { // if the item has not been defined
                let exports;
                let module;
                for (i = 0; i < len; i++) { // loop through dependencies
                    dependencyName = deps[i]; // get the dependency name
                    if (dependencyName === REQUIRE) {
                        args.push(require);
                    } else if (dependencyName === EXPORTS) {
                        exports = {};
                        args.push(exports);
                    } else if (defined.hasOwnProperty(dependencyName)) {
                        args.push(defined[dependencyName]); // this will push an item even if it is undefined
                    } else if (!require.ignoreWarnings) {
                        args.push(undefined);
                        console.warn('Module "' + name + '" requires "' + dependencyName + '", but is undefined');
                    }
                }
                let returnVal = initHandler.apply({name: name}, args); // call the function and assign return value onto defined list
                if (exports) {
                    if (exports.hasOwnProperty(DEFAULT)) {
                        defined[name] = exports[DEFAULT];
                    } else {
                        defined[name] = exports;
                    }
                } else {
                    defined[name] = returnVal;
                }
            }

            delete pending[name]; // permanently remove pending item
        }

        function resolve() {
            for (let name in definitions) {
                if (definitions.hasOwnProperty(name)) {
                    let fn = definitions[name];
                    delete definitions[name];
                    try {
                        resolveModule(name, fn);
                    } catch (e) {
                        // throw new Error('ModuleError in "' + name + '": ' + e.message);
                    }
                }
            }
            let callback = defined[CACHE_TOKEN];
            if (callback) {
                delete defined[CACHE_TOKEN];
                callback();
            }
        }

        define = function (name:string, deps = [], initHandler:Function) {
            if (typeof name !== 'string') {
                throw new Error('Property "name" requires type string');
            }
            try {
                raw[name] = {name:name, deps:deps, fn:initHandler};
                initDefinition.apply({name: name}, arguments);
            } catch(e) {
                throw new Error('ModuleError in "' + name + '": ' + e.message)
            }
            clearInterval(timer);
            setTimeout(resolve);
        };

        require = function (modules, handler?:Function) {
            clearTimeout(timer);
            resolve();

            if (!handler) {
                if (typeof modules !== 'string' && modules.length > 1) {
                    throw new Error('Callback function required');
                }
                let name = modules.toString();
                return defined[name];
            }
            let args = [];
            if (typeof modules === 'string') {
                modules = [modules];
            }
            let len = modules.length;
            for (let i = 0; i < len; i++) {
                args.push(defined[modules[i]]);
            }

            handler.apply(null, args);
        };

        require.clear = clear;
        require.ignoreWarnings = false;
        require.resolve = resolve;
        require.workerTemplate = function(fn) {
            let fnStr = fn.toString();
            let deps = [];
            fnStr.replace(/\W+require\(("|')(.*?)\1\)/g, function(m, g1, g2) {
                deps.push(g2);
            });
            let str = 'function(e) {\nvar define, require;\n(' + requireWorker + ')();\n', i, j, dep, used = {};
            deps = deps || [];
            for(i = 0; i < deps.length; i += 1) {
                dep = raw[deps[i]];
                str += '    define("' + dep.name + '", ' + (dep.deps.join ? '["' + dep.deps.join('","') + '"], ' + dep.fn : dep.deps) + ');\n';
                for(j = 0; j < dep.deps.length; j += 1) {
                    if (!used[dep.deps[j]]) {
                        used[dep.deps[j]] = true;
                        deps.push(dep.deps[j]);
                    }
                }
            }
            return fnStr.replace(/^.*?\{/, str);
        };
        require.ready = function (readyHandler:Function, errorHandler?:Function) {
            defined[CACHE_TOKEN] = readyHandler;
            defined[DEFINITIONS_TOKEN] = errorHandler;
        };

        init();
    };
    return requireWorker();
})();
