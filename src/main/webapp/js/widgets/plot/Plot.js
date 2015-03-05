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
 * Plot Widget class
 * @module Widgets/Plot
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
			plot: null,
			limit: 1600,
			options: null,
			xaxisLabel: null,
			yaxisLabel: null,
			labelsUpdated: false,
			labelsMap : {},
			datasets : [],

			/**
			 * Default options for plot widget, used if none specified when plot
			 * is created
			 */
			defaultPlotOptions:  {
				axes: ['right', 'bottom'],
				tickFormats: { time: function(d) {return ".5";} },
				ticks: { time: 10, right: 3},
				historySize : 10,
			},

			/**
			 * Initializes the plot given a set of options
			 * 
		     * @param {Object} options - Object with options for the plot widget
		     */
			initialize: function(options) {
				this.id = options.id;
				this.name = options.name;
				this.visible = options.visible;
				this.datasets = [];
				this.options = this.defaultPlotOptions;
				this.render();
				$("#"+this.id).addClass("epoch");
				
				//fix conflict between jquery and bootstrap tooltips
				$.widget.bridge('uitooltip', $.ui.tooltip);
				
				//show tooltip for legends
				$(".legendLabel").tooltip();
			},

			/**
			 * Takes data series and plots them. To plot array(s) , use it as
			 * plotData([[1,2],[2,3]]) To plot a geppetto simulation variable , use it as
			 * plotData(object) Multiples arrays can be specified at once in
			 * this method, but only one object at a time.
			 *
			 * @command plotDataset(state, options)
			 * @param {Object} state - series to plot, can be array of data or an geppetto simulation variable
			 * @param {Object} options - options for the plotting widget, if null uses default
			 */
			plotData: function(state, options) {
				if (state!= null) {					
					var value = state.getValue();
					var id = state.getInstancePath();

					var t = GEPPETTO.Simulation.getTime().getValue();
					var nextSet ={
							label : id,
							variable : state,
							values : [{time: t,y: value}],
					};
					this.datasets.push(nextSet);						

					var plotHolder = $("#" + this.id);
					if(this.plot == null) {
						this.plot = $("#" + this.id).epoch({
							type: 'time.line',
							data: this.datasets,
							axes : this.options.axes,
							ticks : this.options.ticks,
							tickFormats : {bottom:function(d) {
							    return Math.round(d*10000)/10000 + 
							    		GEPPETTO.Simulation.getTime().unit;
							  }, right :function(d) {
								    return Math.round(d*10000)/10000;
							  }},
							historySize : 1600,
						});
					}
					else {
						this.plot.update(this.datasets);
					}
				}
				
				return "Line plot added to widget";
			},
			
			/**
			 * Takes two time series and plots one against the other. To plot
			 * array(s) , use it as plotData([[1,2],[2,3]]) To plot an object ,
			 * use it as plotData(objectNameX,objectNameY)
			 *
			 * @command plotData(dataX,dataY, options)
			 * @param {Object} dataX - series to plot on X axis, can be array or an object
			 * @param {Object} dataY - series to plot on Y axis, can be array or an object
			 * @param options - options for the plotting widget, if null uses default
			 */
			plotXYData: function(dataX, dataY, options) {

				// If no options specify by user, use default options
				if(options != null) {
					this.options = options;
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}

				this.datasets.push({
					label: dataX.name,
					data: dataX.data
				});
				
				if (dataY != undefined){
					this.datasets.push({
						label: dataY.name,
						data: dataY.data
					});
				}

				var plotHolder = $("#" + this.id);
				if(this.plot == null) {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
					plotHolder.resize();
				}
				else {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
				}

				return "Line plot added to widget";
			},
			/**
			 * Removes the data set from the plot. EX:
			 * 
			 * @command removeDataSet(state)
			 *
			 * @param {Object} state -Data set to be removed from the plot
			 */
			removeDataSet: function(state) {
				if(state != null) {
					for(var key=0;key<this.datasets.length;key++) {
						if(state.getInstancePath() == this.datasets[key].label) {
							this.datasets.splice(key, 1);
						}
					}

					var data = [];

					for(var i = 0; i < this.datasets.length; i++) {
						data.push(this.datasets[i]);
					}

					this.plot.setData(data);
					this.plot.setupGrid();
					this.plot.draw();
				}

				if(this.datasets.length == 0) {
					this.resetPlot();
				}
			},

			/**
			 * Updates a data set, use for time series
			 */
			updateDataSet: function() {
				var newData = [];
				for(var key in this.datasets) {
					var newValue = this.datasets[key].variable.getValue();

					var t = GEPPETTO.Simulation.getTime().getValue();

					newData.push({ time : t, y: newValue});
				}

				if(this.plot != null){
					//this.plot.push(this.datasets);
					this.plot.push(newData);
				}
			},

			/**
			 * Plots a function against a data series
			 *
			 * @command dataFunction(func, data, options)
			 * @param func - function to plot vs data
			 * @param data - data series to plot against function
			 * @param options - options for plotting widget
			 */
			plotDataFunction: function(func, data_x, options) {
				// If no options specify by user, use default options
				if(options != null) {
					this.options = options;
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}
				
				var labelsMap = this.labelsMap;
	        	this.initializeLegend(function(label, series){
	        		var shortLabel = label;
	        		//FIXME: Adhoc solution for org.neuroml.export
	        		var split = label.split(/-(.+)?/);
	        		if (split.length > 1) shortLabel = split[1];
					labelsMap[label] = {label : shortLabel};
	        		return '<div class="legendLabel" id="'+label+'" title="'+label+'">'+shortLabel+'</div>';
	        	});
				
				//Parse func as a mathjs object
				var parser = math.parser();
				var mathFunc = parser.eval(func);
				var data = []; 
				data.name = options.legendText;
				data.data = [];
				for (var data_xIndex in data_x){
					var dataElementString = data_x[data_xIndex].valueOf();
					data_y = mathFunc(dataElementString);
					//TODO: Understand why sometimes it returns an array and not a value
					if (typeof value == 'object'){
						data.data.push([data_x[data_xIndex][0], data_y[0]]);
					}
					else{
						data.data.push([data_x[data_xIndex][0], data_y]);
					}
				}

				//Plot values 
				this.plotXYData(data);
			},

			/**
			 * Resets the plot widget, deletes all the data series but does not
			 * destroy the widget window.
			 *
			 * @command resetPlot()
			 */
			resetPlot: function() {
				if(this.plot != null) {
					this.datasets = [];
					this.options = this.defaultPlotOptions;
					var plotHolder = $("#" + this.id);
					this.plot = $.plot(plotHolder, this.datasets, this.options);
				}
			},

			/**
			 *
			 * Set the options for the plotting widget
			 *
			 * @command setOptions(options)
			 * @param {Object} options - options to modify the plot widget
			 */
			setOptions: function(options) {
//				this.options = options;
//				if(this.options.xaxis != null) {
//					if(this.options.xaxis.max > this.limit) {
//						this.limit = this.options.xaxis.max;
//					}
//				}
//				this.plot = $.plot($("#" + this.id), datasets, this.options);
			},
			
			/**
			 * Sets the legend for a variable
			 * 
			 * @command setLegend(variable, legend)
			 * @param {Object} variable - variable to change display label in legends
			 * @param {String} legend - new legend name
			 */
			setLegend : function(variable, legend){
				//Check if it is a string or a geppetto object
				var plotId = variable;
				if ((typeof variable) != "string")	plotId = variable.getInstancePath();
				
				var labelsMap = this.labelsMap;
	        	this.initializeLegend(function(label, series){
					var shortLabel;
					
					if(plotId != label){
						shortLabel = labelsMap[label].label;
					}
					else{
						shortLabel = legend;
						labelsMap[label].label = shortLabel;
					}
					return '<div class="legendLabel" id="'+label+'" title="'+label+'">'+shortLabel+'</div>';
	        	});
				
				this.plot = $.plot($("#" + this.id), this.datasets,this.options);
			},

			/**
			 * Retrieve the data sets for the plot
			 * @returns {Array}
			 */
			getDataSets: function() {
				return this.datasets;
			},

			/**
			 * Resets the datasets for the plot
			 */
			cleanDataSets: function() {
				// update corresponding data set
				for(var key=0;key<this.datasets.length;key++) {
					this.datasets[key].data = [[]];
				}
			},
			
			/**
			 * Initialize legend
			 */
			initializeLegend: function(labelFormatterFunction){
				
				//set label legends to shorter label
				this.options.legend = {labelFormatter :labelFormatterFunction};
				
				//fix conflict between jquery and bootstrap tooltips
				$.widget.bridge('uitooltip', $.ui.tooltip);
				
				//show tooltip for legends
				$(".legendLabel").tooltip();
			},
			
			/**
			 * Sets a label next to the Y Axis
			 *
			 * @command setAxisLabel(labelY, labelX)
			 * @param {String} labelY - Label to use for Y Axis
			 * @param {String} labelX - Label to use for X Axis
			 */
			setAxisLabel: function(labelY, labelX) {
				if (this.options.yaxis == undefined){
					this.options["yaxis"] = {};
				}
				this.options.yaxis.axisLabel = labelY;
				if (this.options.xaxis == undefined){
					this.options["xaxis"] = {};
				}
				this.options.xaxis.axisLabel = labelX;
				this.plot = $.plot($("#" + this.id), this.datasets,this.options);
			},
			
			/**
			 * Takes a FunctionNode and plots the expression and set the attributes from the plot metadata information
			 *
			 * @command plotFunctionNode(functionNode)
			 * @param {Node} functionNode - Function Node to be displayed
			 */
			plotFunctionNode: function(functionNode){
				//Check there is metada information to plot
				if (functionNode.plotMetadata != null){
					
					//Read the information to plot
					var expression = functionNode.getExpression();
					var arguments = functionNode.getArguments();

					var finalValue = parseFloat(functionNode.plotMetadata["FinalValue"]);
					var initialValue = parseFloat(functionNode.plotMetadata["InitialValue"]);
					var stepValue = parseFloat(functionNode.plotMetadata["StepValue"]);

					//Create data series for plot 
					//TODO: What are we going to do if we have two arguments?
					var values = [];
					for (var i=initialValue; i<finalValue; i = i + stepValue){values.push([i]);}

					var plotTitle = functionNode.plotMetadata["PlotTitle"];
					var XAxisLabel = functionNode.plotMetadata["XAxisLabel"];
					var YAxisLabel = functionNode.plotMetadata["YAxisLabel"];
					//Generate options from metadata information
					options = {xaxis:{min:initialValue,max:finalValue,show:true,axisLabel:XAxisLabel}, yaxis:{axisLabel:YAxisLabel}, legendText: plotTitle};

					//Convert from single expresion to parametired expresion (2x -> f(x)=2x)
					var  parameterizedExpression = "f(";
					for (var argumentIndex in arguments){
						parameterizedExpression += arguments[argumentIndex] + ","; 
					}
					parameterizedExpression = parameterizedExpression.substring(0, parameterizedExpression.length - 1);
					parameterizedExpression += ") =" + expression;
					
					//Plot data function
					this.plotDataFunction(parameterizedExpression, values, options);

					//Set title to widget
					this.setName(plotTitle);
				}
			},

		});
});
