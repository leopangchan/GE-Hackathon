//"Access-Control-Allow-Origin": "http://localhost:8090"
//"Access-Control-Allow-Credentials": "true",
//"Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
//"Access-Control-Allow-Headers": "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, " +
//"Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"

app.controller("ChartController", function ($scope, $chartType, $uibModalInstance, $http, $lglat) {

  var $ctrl = this;
  var chartId = "chart";

  $ctrl.economicData =
    [[new Date(2011, 0),  0.7,  null],
    [new Date(2012, 1),   0.8,  null],
    [new Date(2013, 2),   0.85,   null],
    [new Date(2015, 3),  0.95, null],
    [new Date(2016, 4),  1, null],
    [new Date(2017, 5),    1.1, 1.1],
    [new Date(2018, 6), null, 1.2],
    [new Date(2019, 7), null, 1.26],
    [new Date(2020, 8),  null, 1.27]];

  $ctrl.trafficYearlyData =
    [[new Date(2012, 0),  83],
    [new Date(2013, 0),  72],
    [new Date(2014, 0),  69],
    [new Date(2015, 0),  57],
    [new Date(2016, 0),  50],
    [new Date(2017, 0),  52]];

  $ctrl.pedestrianMonthlyData =
      [[new Date(2017, 0),  10],
      [new Date(2017, 1),  12],
      [new Date(2017, 2),  13.5],
      [new Date(2017, 3),  14],
      [new Date(2017, 4),  16],
      [new Date(2017, 5),  20]];

  $ctrl.pedestrianYearlyData =
    [[new Date(2012, 0),  80],
    [new Date(2013, 0),  81],
    [new Date(2014, 0),  85],
    [new Date(2015, 0),  92],
    [new Date(2016, 0),  97],
    [new Date(2017, 0),  97]];

  $ctrl.pedestrianYearlyOptions = {
    hAxis: {
        title: 'Year',
        format: 'yyyy'
    },
    vAxis: {
        title: 'Average Number of Pedestrians / Year'
    },
    title: 'Yearly Pedestrian Data',
    trendlines: { 0: {} }
  };

  $ctrl.trafficYearlyOptions = {
    hAxis: {
        title: 'Year',
        format: 'yyyy'
    },
    vAxis: {
        title: 'Average Number of Vehicles / Year'
    },
    title: 'Yearly Vehicle Data',
    trendlines: { 0: {} }
  };

  $ctrl.pedestrianMonthlyOptions = {
    hAxis: {
      title: 'Month',
      format: 'M/yy'
    },
    vAxis: {
      title: 'Average Number of Pedestrians / Month'
    },
    title: 'Monthly Pedestrian Data',
    trendlines: { 0: {} }
  };

  $ctrl.economicOptions = {
    chart: {
        title: 'Average and Predicted Home Price 2011-2020'
    },
    series: {
        // Gives each series an axis name that matches the Y-axis below.
        0: {axis: 'Current Average Home Price'},
        1: {axis: 'Predicted Average Home Price', lineDashStyle: [4, 4]}
    },
    axes: {
        // Adds labels to each axis; they don't have to match the axis names.
        y: {
          Average: {label: 'Average Price (millions)'}
        }
    }
  };

  $scope.chartType = $chartType;
  $ctrl.token = config.token;

  /**
  *  write a function that takes in a coordinate [lat, long], calls the get locations function.
  *
  *  Note:
  *  vm.locationPos = [[32.708757321722075, -117.16414366466401, $$hashKey: "object:10"], ...]
  *
  *  @param locations - locations of all CityIQ sensors
  *  @param coord - [32.708757321722075, -117.16414366466401]
  *  @return the location id of the closest sensor
  *
  *  sqrt((x1^2 - x2^2)^2 + (y1^2 - y2^2)^2)
  */
  $ctrl.getClosestSensor = function(locations, coord) {
    let closestPos = undefined;
    let minDis = undefined;

    locations.forEach(function (pos) {
        if (pos) {
            let xDis = Math.abs(Math.pow(parseFloat(pos[0]), 2) - Math.pow(parseFloat(coord[0]), 2));
            let yDis = Math.abs(Math.pow(parseFloat(pos[1]), 2) - Math.pow(parseFloat(coord[1]), 2));
            let dis = Math.sqrt(Math.abs(xDis - yDis));

            if ((minDis === undefined) || (minDis > dis)) {
               minDis = dis;
               closestPos = pos
            }
        }
    });

    if (closestPos === undefined) {
        return 'a49a96ea'
    }

    return closestPos[2]
  };

  $ctrl.make_api_request_header = function(type) {
    // query url
    let metadataurl = 'https://ic-metadata-service-sdhack.run.aws-usw02-pr.ice.predix.io/v2/metadata';
    let requestURL = metadataurl + "/locations/search?q=locationType:" + type + "&page=0&size=50";
    let zoneId = 'SD-IE-TRAFFIC';

    return {
      method: 'GET',
      url: requestURL,
      headers: {
        "Authorization": "Bearer " + $ctrl.token,
        "Predix-Zone-Id": zoneId
      }
    };
  };

  $ctrl.get_start_end_time = function() {
    // get dates for backend request
    let today = new Date();

    let endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    let endts = Math.trunc(endDate.getTime());

    let startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    let startts = Math.trunc(startDate.getTime());

    return {"startts":startts, "endts":endts}
  };

  $ctrl.formatChart = function(res, startts, endts, titles) {
      let data = new google.visualization.DataTable();

      data.addColumn('date', titles['x_axis']);
      data.addColumn('number', titles['y_axis']);
      data.addRows(res);

      let options = {
          hAxis: {
            gridlines: {
              count: -1,
              units: {
                days: {format: ['MMM dd']},
                hours: {format: ['HH:mm', 'ha']},
              }
            },
            minorGridlines: {
              units: {
                hours: {format: ['hh:mm:ss a', 'ha']},
                minutes: {format: ['HH:mm a Z', ':mm']}
              }
            },
            title: titles['x_axis']
          },
          vAxis: {
            title: titles['y_axis']
          },
          title: titles['title']
      };

      let chart = new google.visualization.LineChart(document.getElementById(chartId));

      chart.draw(data, options);
    };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $ctrl.loadTrafficChart = function() {
    console.log("Load Chart");
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback($ctrl.drawLineChart.bind(null, chartId,
     $ctrl.trafficYearlyData, $ctrl.trafficYearlyOptions));
  };

  $ctrl.loadPedestrianChart = function(data) {
    console.log('Loading line chart');
    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback($ctrl.drawLineChart.bind(null, chartId,
     $ctrl.pedestrianYearlyData, $ctrl.pedestrianYearlyOptions));

    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback($ctrl.drawLineChart.bind(null, "chart2",
     $ctrl.pedestrianMonthlyData, $ctrl.pedestrianMonthlyOptions));

    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback($ctrl.drawPedestrianChartWeekly.bind(null, "chart3"));
  };

  $ctrl.loadEnvTable = function() {
    console.log("Load Chart");
    google.charts.load('current', {'packages':['corechart', 'bar']});
    google.charts.setOnLoadCallback($ctrl.drawEnvTable);
  };

  $ctrl.loadEconomicChart = function() {
    console.log("Load Economic Chart");
    google.charts.load('current', {'packages':['corechart', 'line']});
    google.charts.setOnLoadCallback($ctrl.drawDualLineChart.bind(null,
     'chart', $ctrl.economicData, $ctrl.economicOptions));
  };

  $ctrl.drawLineChart = function(chartId, chartData, chartOptions) {
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', "Average");

    data.addRows(chartData)

    var chart = new google.visualization.LineChart(document.getElementById(chartId))
    chart.draw(data, chartOptions)
  };

  $ctrl.drawDualLineChart = function(chartId, chartData, chartOptions) {
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', "Current Average Home Price");
    data.addColumn('number', "Predicted Average Home Price");

    data.addRows(chartData)

    console.log(chartId)
    var chart = new google.visualization.LineChart(document.getElementById(chartId));
    chart.draw(data, chartOptions);
  }

  $ctrl.drawEnvTable = function() {
        let data = new google.visualization.arrayToDataTable([
            ['Year', 'Current', 'After Planting Tree'],
            ['2014', 200000, 180000],
            ['2015', 140000, 120000],
            ['2016', 130000, 100000],
            ['2017', 100000, 95000]
        ]);

    var options = {
        chart: {
            title: 'San Diego Carbon Emissions in Lbs/Year',
            subtitle: 'current value on the left, value after planting tree on the right'
        },
        bars: 'horizontal',
        width: 1024,
        height: 500,
        hAxis: { title: 'San Diego Total Carbon Emission (lbs/year)' }

    };

    var chart = new google.charts.Bar(document.getElementById('chart'));
    chart.draw(data, options);
  };

  $ctrl.drawTrafficWeekly = function() {
    console.log('USER COORDS TRAFFIC CHART')
    console.log($lglat)

    if (!$lglat) {
        $lglat = [32.7157, -117.1611]
    }

    var time = $ctrl.get_start_end_time()
    var req = $ctrl.make_api_request_header('TRAFFIC_LANE')
    var titles = {
        'title': 'Average Number of Vehicles from ' +
         (new Date(time["startts"])).toDateString() +
         ' to ' +
         (new Date(time["endts"])).toDateString(),

         'x_axis': 'Date',
         'y_axis': 'Average Number of Vehicles'
    }

    $http(req)
    .then(function(data) {
        var res = []
        var locations = data.data['content']

        locations.forEach(function(element) {
            if (element.hasOwnProperty('coordinates')) {
                var coord = element['coordinates'].split(":")
                res.push( [parseFloat(coord[0]), parseFloat(coord[1]), element["locationUid"]] )
            }
        })

        return $ctrl.getClosestSensor(res, $lglat)
    })
    .then(function(sensor) {
        console.log('CLOSEST SENSOR')
        console.log(sensor)
        $http({
            method: 'GET',
            url: "/traffic/timeRange?start="+
            time["startts"] +
            "&end=" +
            time["endts"] +
            "&locId="+
            sensor
        })
        .then(function (value) { // get the data
            res = []
            var data = value.data
            data.forEach(function(element) {
                res.push([new Date(element['time']), element['avgSpeed']])
            })

            return res
        })
        .then(function(res) { // draw the chart
            console.log('DATA')
            console.log(res)
            $ctrl.formatChart(res, time["startts"], time["endts"], titles)
        })
    })
  }

  $ctrl.drawPedestrianChartWeekly = function(chartId) {
    console.log('USER COORDS PED CHART')
    console.log($lglat)

    if (!$lglat) {
        $lglat = [32.7157, -117.1611]
    }

    var time = $ctrl.get_start_end_time()
    var req = $ctrl.make_api_request_header('WALKWAY')
    var titles = {
        'title': 'Average Number of Pedestrians from ' +
         (new Date(time["startts"])).toDateString() +
         ' to ' +
         (new Date(time["endts"])).toDateString(),

         'x_axis': 'Date',
         'y_axis': 'Average Number of Pedestrians'
    }

    $http(req)
     .then(function(data) {
        var res = []
        var locations = data.data['content']

        locations.forEach(function(element) {
            if (element.hasOwnProperty('coordinates')) {
                var coord = element['coordinates'].split(":")
                res.push( [parseFloat(coord[0]), parseFloat(coord[1]), element["locationUid"]] )
            }
        })

        return $ctrl.getClosestSensor(res, $lglat)
     })
     .then(function(sensor) {
        console.log('CLOSEST SENSOR')
        console.log(sensor)
        $http({
            method: 'GET',
            url: "/pedestrian/timeRange?start="+
             time["startts"] +
             "&end=" +
             time["endts"] +
             "&locId="+
             sensor
        })
        .then(function (value) { // get the data
            res = []
            var data = value.data
            data.forEach(function(element) {
                res.push([new Date(element['time']), element['count']])
            })

            return res
        })
        .then(function(res) { // draw the chart
            console.log('DATA')
            console.log(res)
            $ctrl.formatChart(res, time["startts"], time["endts"], titles, chartId)
        })
     })
  }

  $ctrl.main = function() {
    switch ($chartType) {
        case 'environmental':
          $ctrl.loadEnvTable();
          return;
        case 'pedestrian':
          $ctrl.loadPedestrianChart();
          return;
        case 'traffic':
          $ctrl.loadTrafficChart();
          return;
        case 'economic':
          $ctrl.loadEconomicChart();
          return;
    }
  };

  $ctrl.main()

});