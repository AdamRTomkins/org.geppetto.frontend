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
 * furnished to do so, subject to the following conditions:
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
 * Client class use to represent a pointer.
 *
 * @module model/Pointer
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    return ObjectWrapper.Model.extend({
        elements: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"wrappedObj": options.wrappedObj});
            this.set({"elements": options.elements});
        },

        /**
         * Gets the full path for this pointer
         *
         * @command Pointer.getPath()
         *
         * @returns {String} - Path
         *
         */
        getPath: function (types) {
            if (types === undefined) {
                types = false;
            }

            var path = "";
            var elements = this.getElements();

            for (var e = 0; e < elements.length; e++) {
                var element = elements[e];

                path += element.getPath(types);

                if (e < elements.length - 1) {
                    path += ".";
                }
            }

            return path;
        },

        /**
         * Get PointerElements
         *
         * @command POinter.getElements()
         *
         * @returns {List<PointerElement>} - array of elements
         */
        getElements: function () {
            return this.get('elements');
        }
    });
});
