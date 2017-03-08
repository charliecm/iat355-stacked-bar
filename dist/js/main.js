/**
 * Main Interactions
 */

/* global d3 */

document.addEventListener('DOMContentLoaded', function() {

	// Data
	var data,
		dataURL = 'AutomobileSales.csv',
		activeDimension = '',
		dimensions = [
			'carSales',
			'bikeSales',
			'truckSales'
		],
		labels = d3.scaleOrdinal([
			'Cars', 'Bikes', 'Truckers'
		]),
		colors = d3.scaleOrdinal(d3.schemeCategory10),
		yMax = 0,
		stack = d3.stack().keys(dimensions),
		series;

	// UI
	var canvas = document.getElementById('canvas'),
		svg = d3.select(canvas).append('svg'),
		gWrap, gXAxis, gAxisLabels, gYAxis, gBars,
		margin = {
			top: 40,
			bottom: 40,
			left: 80,
			right: 0
		},
		xScale, yScale, yAxisScale,
		xAxis, yAxis;

	// https://github.com/jashkenas/underscore/blob/master/underscore.js#L880
	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;
		var _now = Date.now || function() {
			return new Date().getTime();
		};
		var later = function() {
			var last = _now() - timestamp;
			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};
		return function() {
			context = this;
			args = arguments;
			timestamp = _now();
			var callNow = immediate && !timeout;
			if (!timeout) timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}
			return result;
		};
	}

	function setupLegends() {
		var eleList = document.getElementById('legends-list'),
			eleItem, eleColor, eleLabel;
		dimensions.forEach(function(dimension) {
			eleItem = document.createElement('li');
			eleItem.className = 'legends__item';
			eleItem.addEventListener('click', function() {
				activeDimension = dimension;
			});
			eleColor = document.createElement('span');
			eleColor.className = 'legends__color';
			eleColor.style.backgroundColor = colors(dimension);
			eleLabel = document.createElement('span');
			eleLabel.className = 'legends__label';
			eleLabel.textContent = labels(dimension);
			eleItem.appendChild(eleColor);
			eleItem.appendChild(eleLabel);
			eleList.appendChild(eleItem);
		});
	}

	// Setup visualization canvas
	function setupVis() {
		gWrap = svg.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		gBars = gWrap.append('g');
		gXAxis = gWrap.append('g');
		gXAxis.append('line');
		gAxisLabels = gXAxis.append('g');
		gYAxis = gWrap.append('g');
	}

	// Draws the visualization
	function redraw() {

		var outerWidth = canvas.clientWidth,
			outerHeight = canvas.clientHeight,
			width = outerWidth - margin.left - margin.right,
			height = outerHeight - margin.top - margin.bottom;

		// Calculate scales
		xScale = d3.scaleBand().rangeRound([ 0, width ]).padding(0.05);
		xAxis = d3.axisBottom().scale(xScale);
		yScale = d3.scaleLinear().range([ height / 2, 0]);
		yAxisScale = d3.scaleLinear().range([ height, 0 ]);
		yAxis = d3.axisLeft().scale(yAxisScale);
		xScale.domain(data.map(function(d) {
			return d.month;
		}));
		yScale.domain([ 0, yMax ]);
		yAxisScale.domain([ -yMax, yMax ]);

		// Resize canvas
		svg.attrs({
			class: 'chart',
			width: outerWidth,
			height: outerHeight
		});

		// x-axis line
		gXAxis.select('line')
			.attrs({
				x1: 0,
				y1: height / 2 + 0.5,
				x2: width,
				y2: height / 2 + 0.5,
				stroke: 'black'
			});

		// x-axis labels
		gAxisLabels
			.attr('class', 'chart__x-axis')
			.attr('transform', 'translate(0, ' + height / 2 + ')')
			.call(xAxis);

		// gXAxis.selectAll('text')
		// 	.transition().duration(1000)
		// 	.attr('transform', 'translate(0,' + d3.max(offsets[offset]) + ')');

		// y-axis
		gYAxis.call(yAxis.ticks(10, '.2s'));

		// Populate series
		var gSeries = gBars.selectAll('.series').data(series);
		gSeries.exit().remove();
		gSeries = gSeries.enter()
			.append('g')
			.attr('class', 'series')
			.attr('fill', function(d) {
				return colors(d.key);
			})
			.merge(gSeries);

		// Populate bars for each series
		var gSeriesBars = gSeries.selectAll('g')
			.data(function(d) {
				return d;
			});
		gSeriesBars.exit().remove();
		gSeriesBars
			.enter()
				.append('g')
				.each(function() {
					d3.select(this).append('rect');
					d3.select(this).append('text');
				});
		gSeriesBars = gSeries.selectAll('g');

		gSeriesBars.selectAll('rect')
			.attrs({
				x: function(d) {
					return xScale(d.data.month);
				},
				y: function(d) {
					return yScale(d[1]);
				},
				width: xScale.bandwidth(),
				height: function(d) {
					return yScale(d[0]) - yScale(d[1]);
				}
			});

		gSeriesBars.selectAll('text')
			.attrs({
				class: 'chart__value',
				dx: function(d) {
					return xScale(d.data.month) + xScale.bandwidth() / 2;
				},
				dy: function(d) {
					return yScale(d[1]) + 2;
				},
				width: xScale.bandwidth(),
				'text-anchor': 'middle',
				'alignment-baseline': 'text-before-edge'
			})
			.text(function(d) {
				return d3.format('.2s')(d[1]);
			});

	}

	// Fetches and parses the data
	function fetch() {
		d3.csv(dataURL)
			.row(function(d) {
				var carSales = +d['Car Sales'],
					bikeSales = +d['Bike Sales'],
					truckSales = +d['Truck Sales'];
				yMax = Math.max(yMax, Math.max(carSales + bikeSales + truckSales));
				return {
					month: d['Month'].substr(0, 3),
					carSales: carSales,
					bikeSales: bikeSales,
					truckSales: truckSales
				};
			})
			.get(function(d) {
				// Initialize visualization
				data = d;
				series = stack(data);
				setupLegends();
				setupVis();
				redraw();
				window.addEventListener('resize', debounce(redraw, 500));
			});
	}

	// Get the ball rolling...
	fetch();

});
