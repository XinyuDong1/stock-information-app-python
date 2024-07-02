BASE_URL = 'http://localhost:5000';
//BASE_URL = 'http://stockdashboard-env.eba-9zydkryg.us-east-1.elasticbeanstalk.com';
function searchAction(event) {
  if (event){
      event.preventDefault();
  }
  var input = document.getElementById('stockSearchInput');
  var ticker = input.value.trim();
  if (ticker === ""){
      input.setCustomValidity("Please fill out this field.");
      input.reportValidity();
      return false;
  } else {
      input.setCustomValidity("");
      fetch(`${BASE_URL}/search?ticker=${encodeURIComponent(ticker)}`)
          .then(response => response.json())
          .then(data => {
              if (Object.keys(data).length === 0 || data.error) {
                  hideStockInfo();
                  displayErrorMessage("Error:No record has been found, please add a valid symbol");
              } else {
                  hideErrorMessage();
                  updateDOMWithSearchResults(data);
                  displayStockInfo();
              }
          })
          .catch(error => {
              console.error("Error fetching data:", error);
              displayErrorMessage("An error occurred while fetching the data");
          });
  }
  var i, tabcontent;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  document.getElementById('company').style.display = "flex";
}

function displayErrorMessage(message) {
  const errorMessageID = document.getElementById('error-message');
  errorMessageID.textContent = message;
  errorMessageID.style.display = 'flex';
}

function hideErrorMessage() {
  const errorMessageID = document.getElementById('error-message');
  errorMessageID.style.display = 'none';
}

function displayStockInfo() {
  const stockInfoID = document.getElementById('stock-info');
  stockInfoID.style.display = 'flex';
  var tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  const companyID = document.getElementById('company-tab');
  companyID.classList.add('active');
}

function hideStockInfo() {
  const stockInfoID = document.getElementById('stock-info');
  stockInfoID.style.display = 'none';
}

function updateDOMWithSearchResults(data) {
  document.getElementById('companyLogo').src = data.logo;
  document.getElementById('companyLogo').alt = data.name + ' Logo';

  document.getElementById('companyName').textContent = data.name;
  document.getElementById('stockTicker').textContent = data.ticker;
  document.getElementById('stockExchange').textContent = data.exchange;
  document.getElementById('companyStartDate').textContent = data.ipo;
  document.getElementById('companyCategory').textContent = data.finnhubIndustry;
}

function clearAction() {
  document.getElementById('stockSearchInput').value = '';
  hideErrorMessage();
  hideStockInfo();
}

var range, to_date;
function openTab(event, tabName) {
  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "flex";
  event.currentTarget.className += " active";

  ticker = document.getElementById('stockTicker').textContent;
  
  if (tabName === 'stocksummary'){
      fetch(`${BASE_URL}/stocksummary?ticker=${encodeURIComponent(ticker)}`)
      .then(response => response.json())
      .then(data => {
          console.log(data);
          updateDOMWithStockSummary(ticker, data);
      })
      .catch(error => {
          console.error("Error fetching data:", error);
          
      });
  }

  if (tabName === 'charts'){
    fetch(`${BASE_URL}/charts?ticker=${encodeURIComponent(ticker)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        intializeStockChart();
        var chart = $('#container').highcharts();
        chart.series[0].setData(data.prices);
        chart.series[1].setData(data.volumes);
        chart.navigator.series[0].setData(data.prices);
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        
    });
  }

  if (tabName === 'latestnews'){
    fetch(`${BASE_URL}/latestnews?ticker=${encodeURIComponent(ticker)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updateDOMWithLatestNews(data);
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        
    });
  } 
}

function updateDOMWithStockSummary(ticker, data) {
  const quote = data.quote;
  const recommendation = data.recommendationTrends[0];
  const date = new Date(quote.t * 1000);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const formattedDate = `${day} ${month}, ${year}`;
  document.getElementById('stocktickersymbol').textContent = ticker;
  document.getElementById('tradingday').textContent = formattedDate;
  document.getElementById('previousclosingprice').textContent = quote.pc;
  document.getElementById('openprice').textContent = quote.o;
  document.getElementById('highprice').textContent = quote.h;
  document.getElementById('lowprice').textContent = quote.l;
  document.getElementById('change').firstChild.nodeValue = quote.d;
  if (quote.d >= 0){
      document.getElementById('changearrow').src = "/static/img/GreenArrowUp.png";
  } else {
      document.getElementById('changearrow').src = "/static/img/RedArrowDown.png";
  }
  document.getElementById('changepercent').firstChild.nodeValue = quote.dp;
  if (quote.dp >= 0){
      document.getElementById('changepercentarrow').src = "/static/img/GreenArrowUp.png";
  } else {
      document.getElementById('changepercentarrow').src = "/static/img/RedArrowDown.png";
  }
  document.getElementById('strong-sell').textContent = recommendation.strongSell;
  document.getElementById('sell').textContent = recommendation.sell;
  document.getElementById('hold').textContent = recommendation.hold;
  document.getElementById('buy').textContent = recommendation.buy;
  document.getElementById('strong-buy').textContent = recommendation.strongBuy;
}

function intializeStockChart() {
  const stockTicker = document.getElementById('stockTicker').textContent;
  const currentDate = new Date().toISOString().split('T')[0];
  Highcharts.stockChart('container', {
      chart: {
        zoomType: 'x',
        type: 'area',
      },
      rangeSelector: {
        inputEnabled: false,
        selected: 0,
        buttons: [{
            type: 'week',
            count: 1,
            text: '7d'
        }, {
            type: 'week',
            count: 2,
            text: '15d'
        }, {
            type: 'month',
            count: 1,
            text: '1m'
        }, {
            type: 'month',
            count: 3,
            text: '3m'
        }, {
            type: 'month',
            count: 6,
            text: '6m'
        }]
      },
      title: {
        text: `Stock Price ${stockTicker} ${currentDate}`
      },
      subtitle: {
        text: 'Source: <a href="https://polygon.io/" target="_blank">Polygon.io</a>',
        useHTML: true,
      },
      navigator: {
          enabled: true,
          adaptToUpdatedData: false,
          series: {
              data: []
          }
      },
      xAxis: {
        type: 'datetime',
      },
      yAxis: [{
        title: {
          text: 'Stock Price',
          style: { color: '#000000'}
        },
        labels: {
          format: '{value:.1f}',
          style: { color: '#000000' }
        },
        resize: {
          enabled: true
        },
        opposite:false
      }, {
        title: {
          text: 'Volume',
          style: { color: '#000000'}
        },
        labels: {
          formatter: function() {
              return this.value / 1000000 + 'M';
          },
          style: { color: '#000000' }
        },
        offset: 0,
        opposite: true,
        tickInterval: 100000000
      }],
      tooltip: {
        shared: true,
        split: false,
        xDateFormat: '%Y-%m-%d'
      },
      legend: {
          enabled: false
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, Highcharts.getOptions().colors[0]],
              [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0.5).get('rgba')]
            ]
          },
          marker: {
            radius: 2
          },
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1
            }
          },
          threshold: null
        },
        column: {
          pointPadding: 0.1,
          borderWidth: 0,
          pointWidth: 2,
        }
      },
      series: [{
        name: 'Stock Price',
        data: [],
        tooltip: {
          valueDecimals: 2
        },
        yAxis: 0
      }, {
        type: 'column',
        name: 'Volume',
        data: [],
        color: '#000000',
        yAxis: 1,
      }]
    });
}

function updateDOMWithLatestNews(data) {
  var i = 0, j = 0, len = data.length;
  while(i < 5 && j < len){
    if (data[j].image != "" && data[j].headline != "" && data[j].datetime != "" && data[j].url != ""){
      newsImage = document.getElementsByClassName("newsImage");
      newsImage[i].src =data[j].image;
      title = document.getElementsByClassName("newsTitle");
      title[i].textContent =data[j].headline;
      datetime = document.getElementsByClassName("newsTime");
      const date = new Date(data[j].datetime * 1000);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const formattedDate = `${day} ${month}, ${year}`;
      datetime[i].textContent = formattedDate;
      link =document.getElementsByClassName("newsLink");
      link[i].href = data[j].url;
      i++;
    }
    j++;
  }
}