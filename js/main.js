/**
 * Main Interactions
 */

/* global d3 */

document.addEventListener('DOMContentLoaded', function() {

	// Data
	var data,
		dataURL = 'AutomobileSales.csv',
		dimensions = [
			'carSales',
			'bikeSales',
			'truckSales'
		],
		labels = d3.scaleOrdinal([
			'Cars', 'Bikes', 'Trucks'
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
			top: 24,
			bottom: 64,
			left: 80,
			right: 0
		},
		offsets = [],
		offsetIndex = 0,
		transitionDuration = 600;

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

	function updateOffset(index) {
		offsetIndex = index;
		redraw();
	}

	function setupLegends() {
		var eleList = document.getElementById('legends-list'),
			eleItem, eleColor, eleLabel;
		dimensions.forEach(function(dimension, i) {
			eleItem = document.createElement('li');
			eleItem.className = 'legends__item';
			eleItem.addEventListener('click', function() {
				updateOffset(i);
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
	function redraw(isInit) {

		var outerWidth = canvas.clientWidth,
			outerHeight = canvas.clientHeight,
			width = outerWidth - margin.left - margin.right,
			height = outerHeight - margin.top - margin.bottom,
			duration = (isInit) ? 0 : transitionDuration;

		// Calculate scales
		var xScale = d3.scaleBand()
				.rangeRound([ 0, width ])
				.padding(0.05)
				.domain(data.map(function(d) {
					return d.month;
				})),
			xAxis = d3.axisBottom().scale(xScale),
			yScale = d3.scaleLinear()
				.range([ height / 2, 0])
				.domain([ 0, yMax ]),
			yAxisScale = d3.scaleLinear()
				.range([ height, 0 ])
				.domain([ -yMax, yMax ]),
			yAxis = d3.axisLeft().scale(yAxisScale),
			yOffsetScale = d3.scaleLinear().range([ 0, height / 2 ]).domain([ 0, yMax ]),
			offsetMax = yOffsetScale(d3.max(offsets[offsetIndex]));

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
			.call(xAxis)
			.selectAll('text')
			.transition().duration(duration)
				.attr('transform', 'translate(0, ' + (height / 2 + offsetMax) + ')');

		// y-axis
		gYAxis.call(yAxis.ticks(10, '.2s'));

		// Series group
		var gSeries = gBars.selectAll('.series').data(series);
		gSeries.exit().remove();
		gSeries = gSeries.enter()
			.append('g')
			.attr('class', 'series')
			.attr('fill', function(d) {
				return colors(d.key);
			})
			.merge(gSeries);

		// Series bars
		var gSeriesBars = gSeries.selectAll('g')
			.data(function(d, i) {
				return d.map(function(d) {
					d.series = i;
					return d;
				});
			});
		gSeriesBars.exit().remove();
		gSeriesBars
			.enter()
				.append('g')
				.each(function(d, i) {
					d.index = i;
					d3.select(this).append('rect').datum(d)
						.on('click', function() {
							updateOffset(d.series);
						});
					d3.select(this).append('text').datum(d);
				});
		gSeriesBars = gSeries.selectAll('g');

		// Bars
		gSeriesBars.selectAll('rect')
			.attrs({
				class: 'chart__bar',
				x: function(d) {
					return xScale(d.data.month);
				},
				width: xScale.bandwidth(),
				height: function(d) {
					return yScale(d[0]) - yScale(d[1]);
				}
			})
			.transition().duration(duration)
				.attr('y', function(d) {
					return yScale(d[1] - offsets[offsetIndex][d.index]);
				});

		// Bar value labels
		gSeriesBars.selectAll('text')
			.attrs({
				class: 'chart__value',
				dx: function(d) {
					return xScale(d.data.month) + xScale.bandwidth() / 2;
				},
				width: xScale.bandwidth(),
				'text-anchor': 'middle',
				'alignment-baseline': 'text-before-edge'
			})
			.text(function(d) {
				return d3.format('.2s')(d.data[dimensions[d.series]]);
			})
			.transition().duration(duration)
				.attr('dy', function(d) {
					return yScale(d[1] - offsets[offsetIndex][d.index]) + 3;
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
				offsets = series.map(function(row) {
					var offset = row.map(function(column) {
						return column[0];
					});
					return offset;
				});
				setupLegends();
				setupVis();
				redraw(true);
				window.addEventListener('resize', debounce(redraw, 500));
			});
	}

	// Get the ball rolling...
	fetch();

});
