describe('require-lite', function () {

    it('define() should be a type function', function () {
        expect(typeof define).toBe('function');
    });

    it('require() should be a type function', function () {
        expect(typeof define).toBe('function');
    });

    it('require.ignoreWarnings to be false', function () {
        expect(require.ignoreWarnings).toBe(false);
    });

    it('require.clear should be a type function', function () {
        expect(typeof require.clear).toBe('function');
    });

    describe('define("bar", foo.bar)', function () {
        var foo = {
            bar: function () {
                return 'bar';
            }
        };

        beforeAll(function (done) {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', foo.bar);

            setTimeout(done);
        });

        it('expect foo.bar() to have been called', function () {
            expect(foo.bar).toHaveBeenCalled();
        });

        it('expect foo.bar() to return "bar"', function () {
            expect(foo.bar.calls.mostRecent().returnValue).toBe('bar');
        });
    })

    describe('define("bar", ["baz"], foo.bar)', function () {
        var bazValue;
        var foo = {
            bar: function (baz) {
                bazValue = baz;
                return 'bar';
            },
            baz: function () {
                return 'baz';
            }
        };

        beforeAll(function (done) {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', ['baz'], foo.bar);
            define('baz', foo.baz);

            setTimeout(done);
        });

        it('expect foo.bar() to have been called', function () {
            expect(foo.bar).toHaveBeenCalled();
        });

        it('expect foo.bar() to return "bar"', function () {
            expect(foo.bar.calls.mostRecent().returnValue).toBe('bar');
        });

        it('expect foo.bar() args to equal ["baz"]', function () {
            expect(foo.bar.calls.mostRecent().args).toEqual(['baz']);
        });

        it('expect baz value to equal "baz"', function () {
            expect(bazValue).toEqual('baz');
        });
    })

    describe('require("bar")', function () {
        var foo = {
            bar: function () {
                return 'bar';
            },
            baz: function () {
                return 'baz';
            }
        };

        beforeAll(function () {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', foo.bar);

            require('bar');
        });

        it('expect foo.bar() to have been called', function () {
            expect(foo.bar).toHaveBeenCalled();
        });

        it('expect return value to be "bar"', function () {
            var bar = require('bar');
            expect(bar).toBe('bar');
        });
    });

    describe('require(["bar"])', function () {
        var foo = {
            bar: function () {
                return 'bar';
            },
            baz: function () {
                return 'baz';
            }
        };

        beforeAll(function () {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', foo.bar);
            define('baz', foo.baz);

            require(['bar']);
        });

        it('expect foo.bar() to have been called', function () {
            expect(foo.bar).toHaveBeenCalled();
        });

        it('expect return value to be "bar"', function () {
            var bar = require(['bar']);
            expect(bar).toBe('bar');
        });
    });

    describe('require(["bar", "baz"])', function () {
        var foo = {
            bar: function () {
                return 'bar';
            },
            baz: function () {
                return 'baz';
            }
        };

        beforeAll(function () {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', foo.bar);
            define('baz', foo.baz);
        });

        it('expect value to throw Error("Callback function required")', function () {
            var err;
            try {
                var bar = require(['bar', 'baz']);
            } catch (e) {
                err = e;
            }
            expect(err.message).toBe('Callback function required');
        });
    });

    describe('require("bar", handler)', function () {
        var barValue;
        var foo = {
            bar: function () {
                return 'bar';
            },
            baz: function () {
                return 'baz';
            },
            handler: function (bar) {
                barValue = bar;
            }
        };

        beforeAll(function () {
            spyOn(foo, "handler").and.callThrough();

            require.clear();

            define('bar', foo.bar);
            define('baz', foo.baz);

            require('bar', foo.handler);
        });

        it('expect handler to have been called', function () {
            expect(foo.handler).toHaveBeenCalled();
        });

        it('expect handler to return `undefined`', function () {
            expect(foo.handler.calls.mostRecent().returnValue).toBe(undefined);
        });

        it('expect handler args to equal ["bar"]', function () {
            expect(foo.handler.calls.mostRecent().args).toEqual(['bar']);
        });

        it('expect bar value to equal "bar"', function () {
            expect(barValue).toEqual('bar');
        });
    });

    describe('require(["bar"], handler)', function () {
        var barValue;
        var foo = {
            bar: function () {
                return 'bar';
            },
            baz: function () {
                return 'baz';
            },
            handler: function (bar) {
                barValue = bar;
            }
        };

        beforeAll(function () {
            spyOn(foo, "handler").and.callThrough();

            require.clear();

            define('bar', foo.bar);
            define('baz', foo.baz);

            require(['bar'], foo.handler);
        });

        it('expect handler to have been called', function () {
            expect(foo.handler).toHaveBeenCalled();
        });

        it('expect handler to return `undefined`', function () {
            expect(foo.handler.calls.mostRecent().returnValue).toBe(undefined);
        });

        it('expect handler args to equal ["bar"]', function () {
            expect(foo.handler.calls.mostRecent().args).toEqual(['bar']);
        });

        it('expect bar value to equal "bar"', function () {
            expect(barValue).toEqual('bar');
        });
    });

    describe('define("bar", ["require", "exports"], handler)', function () {
        var bazValue;
        var foo = {
            bar: function (require, exports) {
                bazValue = require('baz');
                exports.default = 'bar';
            },
            baz: function () {
                return 'baz';
            }
        };

        beforeAll(function (done) {
            spyOn(foo, "bar").and.callThrough();

            require.clear();

            define('bar', ['require', 'exports'], foo.bar);
            define('baz', foo.baz);

            setTimeout(done);
        });

        it('expect bar to have been called', function () {
            expect(foo.bar).toHaveBeenCalled();
        });

        it('expect bar args[0] to be require()', function () {
            expect(foo.bar.calls.mostRecent().args[0]).toBe(require);
        });

        it('expect bar args[1] to equal {"default":"bar"}', function () {
            expect(foo.bar.calls.mostRecent().args[1]).toEqual({default: "bar"});
        });

        it('expect bar value to equal "bar"', function () {
            var barValue = require('bar');
            expect(barValue).toEqual('bar');
        });

        it('expect baz value to equal "baz"', function () {
            expect(bazValue).toEqual('baz');
        });
    });

    describe('define("bar", ["bogus"], foo.bar)', function () {
        var foo = {
            bar: function () {
                return 'bar';
            }
        };

        beforeAll(function (done) {
            spyOn(console, 'warn').and.callThrough();

            require.clear();

            define('bar', ['bogus'], foo.bar);

            setTimeout(done);
        });

        it('expect console.warn to have been called', function () {
            expect(console.warn).toHaveBeenCalled();
        });

        it('expect console.warn to equal - Module "bar" requires "bogus", but is undefined', function () {
            expect(console.warn.calls.mostRecent().args).toEqual(['Module "bar" requires "bogus", but is undefined']);
        });
    });

    describe('require.ignoreWarnings = true', function () {
        describe('define("bar", ["bogus"], foo.bar)', function () {
            var foo = {
                bar: function () {
                    return 'bar';
                }
            };

            beforeAll(function (done) {
                spyOn(console, 'warn').and.callThrough();

                require.clear();
                require.ignoreWarnings = true;

                define('bar', ['bogus'], foo.bar);

                setTimeout(done);
            });

            it('expect console.warn not to have been called', function () {
                expect(console.warn).not.toHaveBeenCalled();
            });
        });
    });

    describe('Recursive reference - "a" refs "b" refs "c" refs "a"', function () {
        beforeAll(function (done) {
            spyOn(console, 'warn').and.callThrough();

            require.clear();
            require.ignoreWarnings = false;

            define('a', ['b'], function () {
                return 'a';
            });

            define('b', ['c'], function () {
                return 'b';
            });

            define('c', ['a'], function () {
                return 'c';
            });
            setTimeout(done);
        })

        it('expect console.warn to have been called', function () {
            expect(console.warn).toHaveBeenCalled();
        });

        it('expect console.warn to equal - [ Recursive dependency between "c" and "a" ] ', function () {
            expect(console.warn.calls.first().args).toEqual(['Recursive dependency between "c" and "a']);
        });

        it('expect console.warn to equal - [ Module "c" requires "a", but is undefined ] ', function () {
            expect(console.warn.calls.mostRecent().args).toEqual(['Module "c" requires "a", but is undefined']);
        });
    });

    describe('define(["bar"], handler)', function () {
        beforeAll(function (done) {
            spyOn(console, 'warn').and.callThrough();

            require.clear();

            setTimeout(done);
        })

        it('expect value to throw Error("Property "name" requires type string")', function () {
            var err;
            try {
                define(['bar'], function () {
                    return 'baz';
                });
            } catch (e) {
                err = e;
            }
            expect(err.message).toBe('Property "name" requires type string');
        });
    });

    describe('define("foo", handler)', function () {

        var name;
        beforeAll(function (done) {
            require.clear();
            define('foo', function () {
                name = this.name;
                return 'foo';
            });

            setTimeout(done);
        });

        it('this.name === "foo" in handler', function () {
            expect(name).toBe('foo');
        })
    });
});