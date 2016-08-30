var define:Function, require:any;
(function () {
    var _get:Function, defined:Object, pending:Object, definitions:Object, timer:number = 0;

    const
        CACHE_TOKEN = '~',
        DEFINITIONS_TOKEN = '.',
        REQUIRE = 'require',
        EXPORTS = 'exports',
        DEFAULT = 'default',
        CACHED = 'c',
        DEFINED = 'd',
        PENDING = 'p';

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
            var args = arguments;
            var val = args[1];
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
        var deps = initHandler[DEFINITIONS_TOKEN]; // get any dependencies required by definition
        var args = [];
        var i:number, len:number;
        var dependencyName;
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
            var exports;
            var module;
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
            var returnVal = initHandler.apply({name: name}, args); // call the function and assign return value onto defined list
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
        for (var name in definitions) {
            if (definitions.hasOwnProperty(name)) {
                var fn = definitions[name];
                delete definitions[name];
                try {
                    resolveModule(name, fn);
                } catch (e) {
                    // throw new Error('ModuleError in "' + name + '": ' + e.message);
                }
            }
        }
        var callback = defined[CACHE_TOKEN];
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
            var name = modules.toString();
            return defined[name];
        }
        var args = [];
        if (typeof modules === 'string') {
            modules = [modules];
        }
        var len = modules.length;
        for (var i = 0; i < len; i++) {
            args.push(defined[modules[i]]);
        }

        handler.apply(null, args);
    };

    require.clear = clear;
    require.ignoreWarnings = false;
    require.resolve = resolve;
    require.ready = function (readyHandler:Function, errorHandler?:Function) {
        defined[CACHE_TOKEN] = readyHandler;
        defined[DEFINITIONS_TOKEN] = errorHandler;
    };

    init();
}());
