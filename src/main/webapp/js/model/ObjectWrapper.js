/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished t do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * Base class that provides wrapping functionality for a generic underlying object (with id and name).
 *
 * @module model/ObjectWrapper
 * @author Giovanni Idili
 */

define(['jquery', 'underscore', 'backbone'], function (require) {
    return {
        Model: Backbone.Model.extend({
            _metaType: "",
            wrappedObj: null,
            parent: null,

            /**
             * Gets the name of the node
             *
             * @command Node.getName()
             * @returns {String} Name of the node
             *
             */
            getName: function () {
                return this.get('wrappedObj').name;
            },

            /**
             * Get the id associated with node
             *
             * @command Node.getId()
             * @returns {String} ID of node
             */
            getId: function () {
                return this.get('wrappedObj').id;
            },

            /**
             * Get the wrapped obj
             *
             * @command Node.getWrappedObj()
             * @returns {Object} - Wrapped object
             */
            getWrappedObj: function () {
                return this.get('wrappedObj');
            },

            /**
             * Get meta type
             *
             * @command Instance.getMetaType()
             *
             * @returns {String} - meta type
             *
             */
            getMetaType: function () {
                return this.get('wrappedObj').eClass;
            },

            /**
             * Get parent
             *
             * @command Type.getParent()
             *
             * @returns {Object} - Parent object
             *
             */
            getParent: function () {
                return this.get("parent");
            },

            /**
             * Get path
             *
             * @command Type.getPath()
             *
             * @returns {String} - path
             *
             */
            getPath: function () {
                var parent = this.get("parent");
                var parentPath = "";

                if (parent != null && parent != undefined) {
                    parentPath = parent.getPath();
                }

                var path = parentPath + "." + this.getId();

                return (parentPath != "") ? path : this.getId();
            }
        })
    };
});
