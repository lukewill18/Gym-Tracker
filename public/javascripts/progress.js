$(function() {
    const workouts = data;
    console.log(workouts);
    let current_chart = $(`.chart-container[data-id=${workouts[0].id}]`);
    current_chart.removeClass("hidden");

    $(".workout-btn").click(function() {
        current_chart.addClass("hidden");
        current_chart = $(`.chart-container[data-id=${$(this).attr("data-id")}]`);
        current_chart.removeClass("hidden");
    });

    function drawCharts() {
        for(let i = 0; i < workouts.length; ++i) {
            if(workouts[i].stats[0] === null) 
                continue;
            else {
                for(let j = 0; j < workouts[i].stats.length; ++j) {
                    const dates = workouts[i].stats[j].sets.map(function(s) {
                        return s.date;
                    });
                    const weight = workouts[i].stats[j].sets.map(function(s) {
                        return s.weight;
                    });
                    const ctx = $(`.chart[data-id=${workouts[i].stats[j].id}]`)[0].getContext('2d');
                    const chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [{
                                backgroundColor: 'rgba(255, 255, 255, 0)',
                                borderColor: 'rgb(255, 99, 132)',
                                data: weight,
                            }]
                        },
                        
                        options: {
                            elements: {
                                line: {
                                    tension: 0
                                }
                            },
                            scales: {
                                yAxes: [{
                                  scaleLabel: {
                                    display: true,
                                    labelString: 'Weight lifted (lbs)'
                                  }
                                }],
                                xAxes: [{
                                    scaleLabel: {
                                      display: true,
                                      labelString: 'Date'
                                    }
                                  }]
                            },
                            legend: {
                                display: false
                            },
                            tooltips: {
                                callbacks: {
                                   label: function(tooltipItem) {
                                          return tooltipItem.yLabel;
                                   }
                                }
                            }    
                        }
                    });

                }
            }
        }
    }
    drawCharts();
});